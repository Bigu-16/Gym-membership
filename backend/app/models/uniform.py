from datetime import date
from decimal import Decimal

from sqlalchemy import Boolean, Date, Enum, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.base import TenantMixin, TimestampMixin
from app.models.enums import FeeMethod, UniformOrderStatus


class UniformSize(TenantMixin, TimestampMixin, Base):
    """A uniform size (55, 60 ... 100). Stock figures are computed from orders, sales and counts."""

    __tablename__ = "uniform_sizes"
    __table_args__ = (UniqueConstraint("club_id", "label", name="uq_uniform_sizes_club_label"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    label: Mapped[str] = mapped_column(String(10), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # None = use the branch's default uniform price.
    price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class UniformOrder(TenantMixin, TimestampMixin, Base):
    """An order placed with the supplier. Its quantities count as stock once it is received."""

    __tablename__ = "uniform_orders"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    supplier: Mapped[str | None] = mapped_column(String(120), nullable=True)
    ordered_on: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[UniformOrderStatus] = mapped_column(
        Enum(UniformOrderStatus, name="uniform_order_status_enum"), nullable=False, default=UniformOrderStatus.ordered
    )
    received_on: Mapped[date | None] = mapped_column(Date, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    lines = relationship("UniformOrderLine", back_populates="order", cascade="all, delete-orphan")


class UniformOrderLine(Base):
    __tablename__ = "uniform_order_lines"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("uniform_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    size_id: Mapped[int] = mapped_column(ForeignKey("uniform_sizes.id"), nullable=False, index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)

    order = relationship("UniformOrder", back_populates="lines")


class UniformSale(TenantMixin, TimestampMixin, Base):
    """A uniform sold, with enrolment or on its own (walk-in buyer, replacement, growing kid)."""

    __tablename__ = "uniform_sales"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    size_id: Mapped[int] = mapped_column(ForeignKey("uniform_sizes.id"), nullable=False, index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    method: Mapped[FeeMethod] = mapped_column(Enum(FeeMethod, name="fee_method_enum", create_type=False), nullable=False)
    reference: Mapped[str | None] = mapped_column(String(64), nullable=True)
    sold_on: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    student_id: Mapped[int | None] = mapped_column(ForeignKey("students.id", ondelete="SET NULL"), nullable=True, index=True)
    guardian_id: Mapped[int | None] = mapped_column(ForeignKey("guardians.id", ondelete="SET NULL"), nullable=True, index=True)
    buyer_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    buyer_phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    receipt_no: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)
    recorded_by_id: Mapped[int | None] = mapped_column(ForeignKey("app_users.id", ondelete="SET NULL"), nullable=True)

    size = relationship("UniformSize")


class UniformAdjustment(TenantMixin, TimestampMixin, Base):
    """Stock count corrections: opening stock, damaged, lost, found."""

    __tablename__ = "uniform_adjustments"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    size_id: Mapped[int] = mapped_column(ForeignKey("uniform_sizes.id"), nullable=False, index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)  # + adds stock, - removes it
    reason: Mapped[str] = mapped_column(String(200), nullable=False)
    recorded_by_id: Mapped[int | None] = mapped_column(ForeignKey("app_users.id", ondelete="SET NULL"), nullable=True)
