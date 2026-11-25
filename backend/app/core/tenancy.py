"""Tenant isolation for every database session.

Each gym is a tenant (a row in `clubs`). Every table that holds a gym's data has a
`club_id` (see TenantMixin). This module makes isolation automatic instead of relying on
each query remembering a WHERE clause:

* SELECT / UPDATE / DELETE on tenant tables are filtered to the session's tenant.
* New rows are stamped with the session's tenant; a row for another tenant is refused.
* A session with no tenant sees nothing (fail closed). Only system jobs that work across
  tenants (daily reminders, the notification worker, tests, migrations) opt out explicitly
  with `all_tenants(session)`, and then every new row must carry its own club_id.
"""

from functools import cache

from sqlalchemy import event, inspect, select
from sqlalchemy.orm import Session, with_loader_criteria

from app.models.base import TenantMixin

TENANT_KEY = "club_id"
ALL_TENANTS_KEY = "all_tenants"
DEFAULT_TENANT_KEY = "default_club_id"  # stamping fallback for all-tenant system/test sessions
NO_TENANT = -1  # never a real id: a session without a tenant matches no rows


class TenantError(RuntimeError):
    pass


def _sync(session):
    return getattr(session, "sync_session", session)


def bind_tenant(session, club_id: int) -> None:
    info = _sync(session).info
    current = info.get(TENANT_KEY)
    if current is not None and current != club_id:
        raise TenantError("A database session can only ever work for one tenant")
    info[TENANT_KEY] = club_id
    # A session bound to a tenant is always filtered, whatever it was created as.
    info.pop(ALL_TENANTS_KEY, None)
    info.pop(DEFAULT_TENANT_KEY, None)


def all_tenants(session) -> None:
    """For system jobs only (cron reminders, the notification worker)."""
    _sync(session).info[ALL_TENANTS_KEY] = True


@event.listens_for(Session, "do_orm_execute")
def _filter_by_tenant(state) -> None:
    if not (state.is_select or state.is_update or state.is_delete):
        return
    info = state.session.info
    if info.get(ALL_TENANTS_KEY):
        return
    tenant = info.get(TENANT_KEY, NO_TENANT)
    state.statement = state.statement.options(
        with_loader_criteria(TenantMixin, lambda cls: cls.club_id == tenant, include_aliases=True)
    )


@cache
def _tenant_references(mapper) -> tuple[tuple[str, object], ...]:
    """(attribute, referenced column) for every foreign key that points at another tenant table."""
    refs = []
    for column in mapper.local_table.columns:
        for fk in column.foreign_keys:
            target = fk.column.table
            if target.name != "clubs" and "club_id" in target.c:
                refs.append((mapper.get_property_by_column(column).key, fk.column))
    return tuple(refs)


def _check_references(session, obj) -> None:
    """A row may only point at rows of its own tenant (e.g. a payment for another gym's member)."""
    state = inspect(obj)
    for key, target_column in _tenant_references(state.mapper):
        value = getattr(obj, key)
        if value is None:
            continue
        if not state.pending and not state.attrs[key].history.has_changes():
            continue
        owner = session.connection().execute(
            select(target_column.table.c.club_id).where(target_column == value)
        ).scalar()
        if owner is not None and owner != obj.club_id:
            raise TenantError(f"{type(obj).__name__}.{key} points at another tenant's record")


@event.listens_for(Session, "before_flush")
def _stamp_tenant(session, flush_context, instances) -> None:
    tenant = session.info.get(TENANT_KEY)
    cross = session.info.get(ALL_TENANTS_KEY)
    for obj in list(session.new) + list(session.dirty):
        if not isinstance(obj, TenantMixin):
            continue
        if obj.club_id is None:
            tenant = tenant if tenant is not None else session.info.get(DEFAULT_TENANT_KEY)
            if tenant is None:
                raise TenantError(f"{type(obj).__name__} has no tenant (club_id)")
            obj.club_id = tenant
        elif tenant is not None and obj.club_id != tenant and not cross:
            raise TenantError(f"{type(obj).__name__} belongs to another tenant")
        _check_references(session, obj)
