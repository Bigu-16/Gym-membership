# Backend Architecture

This document explains the backend as it exists in this repository. It is meant to be readable enough to learn the system quickly, but detailed enough that you can trace an API request down to the database tables it reads or writes.

## 1. System Overview

The backend is a FastAPI application for gym membership operations. It manages staff/admin users, members, families, membership plans, class schedules, class/session enrollments, check-ins, dashboard metrics, analytics, notifications, and demo-data seeding.

At runtime the backend is made of these pieces:

| Piece | Technology | Purpose |
| --- | --- | --- |
| API server | FastAPI + Uvicorn | Receives HTTP requests, validates input, applies auth/role checks, runs business logic, and returns JSON. |
| Database | PostgreSQL | Stores users, members, plans, classes, sessions, enrollments, check-ins, notifications, and announcements. |
| ORM | SQLAlchemy async | Maps Python models to database tables and runs async database queries. |
| Migrations | Alembic | Creates and upgrades the PostgreSQL schema. |
| Background jobs | Celery | Runs async-like business jobs outside the HTTP request path. |
| Broker/result backend | Redis | Queues Celery tasks and stores task results. |
| Messaging adapters | WhatsApp, Telegram, SMTP email | Sends queued notification jobs through external providers or dev stubs. |
| Static admin console | HTML/CSS/JS served by FastAPI | A backend-only admin dashboard at `/admin`. |

The API is versioned under `/api/v1`. The app also exposes:

| Path | Purpose |
| --- | --- |
| `/` | Basic metadata: app name, docs path, API prefix, admin path. |
| `/docs` | FastAPI Swagger UI. |
| `/admin` | Static admin dashboard HTML. |
| `/static/*` | Static admin dashboard assets. |

## 2. Source Layout

```text
backend/
  main.py                       # top-level import target for uvicorn: main:app
  app/
    main.py                     # FastAPI app construction
    api/
      router.py                 # includes all API route modules
      deps.py                   # auth dependencies
      routes/                   # endpoint handlers
    core/
      config.py                 # environment settings
      database.py               # async SQLAlchemy engine/session
      security.py               # password hashing and JWT
      celery_app.py             # Celery app and beat schedule
    models/                     # SQLAlchemy tables and enums
    schemas/                    # Pydantic request/response schemas
    services/
      announcements.py          # announcement recipient resolution and fan-out
      demo_data.py              # idempotent demo-data seed logic
      messaging/                # channel adapters and templates
    tasks/
      notifications.py          # Celery task implementations
      reminders.py              # re-exports notification tasks
    static/                     # standalone backend admin dashboard
  alembic/
    env.py                      # migration runtime config
    versions/                   # schema migrations
  tests/                        # pytest tests for notifications/messaging
  scripts/
    seed_demo_data.py           # CLI seed wrapper
    smoke_test_api.py           # end-to-end API smoke test
```

## 3. Request Lifecycle

A typical protected API request follows this path:

1. Uvicorn serves `main:app`, which imports the FastAPI app from `app.main`.
2. `app.main` installs CORS middleware, includes `api_router` under `/api/v1`, and mounts static files.
3. `app.api.router` includes each route module.
4. A route dependency asks for a database session through `get_db_session`.
5. Protected routes also ask for either `get_current_user` or `get_current_admin_user`.
6. `get_current_user` reads the bearer token, decodes the JWT, extracts the `sub` email, and loads an active `AppUser`.
7. The route validates request input through Pydantic schemas.
8. The route queries or mutates SQLAlchemy models.
9. The route commits when it changes data, refreshes ORM objects, and returns Pydantic response models.
10. FastAPI serializes the response to JSON.

## 4. Authentication And Authorization

Authentication is JWT bearer token auth.

| Concern | Implementation |
| --- | --- |
| Password hashing | `passlib` bcrypt in `app/core/security.py`. |
| Token format | JWT signed with HS256. |
| Token subject | User email stored in the `sub` claim. |
| Token expiry | `ACCESS_TOKEN_EXPIRE_MINUTES`, default 1440 minutes. |
| Current user lookup | `app/api/deps.py:get_current_user`. |
| Admin check | `app/api/deps.py:get_current_admin_user`. |

Roles:

| Role | Meaning |
| --- | --- |
| `admin` | Can create/update/delete operational records and manage users. |
| `staff` | Can read most operational data and dashboard/analytics data. |

Authorization pattern:

| Dependency | Access level |
| --- | --- |
| None | Public endpoint. |
| `get_current_user` | Any active `admin` or `staff` user. |
| `get_current_admin_user` | Active admin only. |

Public endpoints are limited to health checks, root metadata, login, and first-admin bootstrap. The bootstrap endpoint works only while the `app_users` table is empty.

## 5. Configuration

Settings are defined in `app/core/config.py` using `pydantic-settings`. Values are read from environment variables and `.env`.

| Setting | Default | Purpose |
| --- | --- | --- |
| `APP_NAME` | `Gym Management Backend` | FastAPI title and root message. |
| `APP_ENV` | `development` | Environment label. |
| `API_V1_PREFIX` | `/api/v1` | API route prefix. |
| `DEBUG` | `true` | Enables SQL echo through SQLAlchemy. |
| `SECRET_KEY` | `change-me-in-production` | JWT signing secret. Must be changed in production. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | JWT lifetime. |
| `DATABASE_URL` | unset | Optional full DB URL override, used for Render/Neon. |
| `POSTGRES_*` | Docker defaults | Used to build local PostgreSQL URL when `DATABASE_URL` is not set. |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_DB` | `redis`, `6379`, `0` | Celery broker/result backend. |
| `MESSAGING_DEV_MODE` | `true` | Unconfigured message channels return synthetic success. |
| `NOTIFICATION_MAX_ATTEMPTS` | `3` | Retry limit before a notification job becomes failed. |
| `WHATSAPP_*` | blank | Meta WhatsApp Cloud API credentials. |
| `TELEGRAM_BOT_TOKEN` | blank | Telegram Bot API credential. |
| `SMTP_*` | blank | Email delivery settings. |

Database URL normalization accepts deployment-style URLs such as:

```text
postgresql://USER:PASSWORD@HOST/DB?sslmode=require
```

It converts them to SQLAlchemy async URLs:

```text
postgresql+asyncpg://USER:PASSWORD@HOST/DB?ssl=require
```

It also strips `channel_binding` because asyncpg does not accept that parameter.

## 6. Endpoint Catalog

All paths below are under `/api/v1` unless explicitly noted.

### Auth

| Method | Path | Auth | Request | Result | Main behavior |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/auth/bootstrap-admin` | Public, only before first user | `BootstrapAdminRequest` | `201 UserResponse` | Creates the first admin user. Fails with `409` if any user already exists. |
| `POST` | `/auth/login` | Public | OAuth2 form fields: `username`, `password` | `200 LoginResponse` | Verifies email/password and returns a bearer token. |
| `GET` | `/auth/me` | User | none | `200 UserResponse` | Returns the active user represented by the bearer token. |

Example `LoginResponse`:

```json
{
  "access_token": "jwt-string",
  "token_type": "bearer"
}
```

### Users

User management is admin-only.

| Method | Path | Auth | Request | Result | Main behavior |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/users/` | Admin | none | `200 list[UserResponse]` | Lists users newest first. |
| `POST` | `/users/` | Admin | `UserCreateRequest` | `201 UserResponse` | Creates admin/staff user. Lowercases email. Fails on duplicate email. |
| `GET` | `/users/{user_id}` | Admin | path `user_id` | `200 UserResponse` | Loads one user. |
| `PATCH` | `/users/{user_id}` | Admin | `UserUpdateRequest` | `200 UserResponse` | Partially updates user. Prevents duplicate email and self-deactivation. |
| `PATCH` | `/users/{user_id}/password` | Admin | `UserPasswordResetRequest` | `200 UserResponse` | Replaces password hash. |

`UserResponse` fields:

```text
id, full_name, email, role, is_active, created_at, updated_at
```

### Members And Families

Members are the central gym customer records. Staff can read them; only admins can mutate them.

| Method | Path | Auth | Request | Result | Main behavior |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/members/` | User | query: `search`, `phone`, `expired`, `is_frozen` | `200 list[MemberResponse]` | Lists members newest first with optional filters. |
| `POST` | `/members/` | Admin | `MemberCreate` | `201 MemberResponse` | Creates an individual member. Phone must be unique. Queues enrollment confirmation if opted in. |
| `POST` | `/members/families` | Admin | `FamilyCreate` | `201 FamilyGroupResponse` | Creates one family parent record and multiple child/member records in one transaction. |
| `GET` | `/members/families` | User | query: `parent_phone` | `200 list[FamilyGroupResponse]` | Lists family groups with members. |
| `GET` | `/members/{member_id}` | User | path `member_id` | `200 MemberResponse` | Loads one member. |
| `PUT` | `/members/{member_id}` | Admin | `MemberUpdate` | `200 MemberResponse` | Updates a member. |
| `DELETE` | `/members/{member_id}` | Admin | path `member_id` | `204 No Content` | Deletes a member and cascades enrollments, check-ins, and notification jobs at ORM relationship level. |
| `PATCH` | `/members/{member_id}/freeze` | Admin | `{ "is_frozen": true/false }` | `200 MemberResponse` | Freezes or unfreezes one member. |
| `PATCH` | `/members/families/{family_key}/freeze` | Admin | `{ "is_frozen": true/false }` | `200 FamilyGroupResponse` | Freezes or unfreezes all members in a family. `family_key` can be numeric family id or parent phone. |

Member filters:

| Query | Meaning |
| --- | --- |
| `search` | Case-insensitive partial match against member name or phone. |
| `phone` | Exact phone match. |
| `expired=true` | Members with `expiry_date < today`. |
| `expired=false` | Members with `expiry_date >= today`. |
| `is_frozen=true/false` | Frozen state. |

`MemberResponse` fields:

```text
id, name, phone, email, telegram_chat_id, parent_phone, family_id, gender,
medical_issues, age, plan_id, expiry_date, messaging_opt_in, is_frozen,
created_at, updated_at
```

Family response shape:

```json
{
  "id": 1,
  "parent": {
    "name": "Parent Name",
    "phone": "+971500000000",
    "email": "parent@example.com",
    "address": "Address",
    "relationship": "parent",
    "notes": "optional"
  },
  "members": [
    {
      "id": 10,
      "name": "Child Member",
      "phone": "+971511111111",
      "age": 12,
      "is_frozen": false
    }
  ]
}
```

### Membership Plans

Plans describe payment/membership products. Staff can read; admins can mutate.

| Method | Path | Auth | Request | Result | Main behavior |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/plans/` | User | query: `program`, `is_active` | `200 list[MembershipPlanResponse]` | Lists plans ordered by `sort_order`, `program`, then `name`. |
| `POST` | `/plans/` | Admin | `MembershipPlanCreate` | `201 MembershipPlanResponse` | Creates a plan. Name must be unique. |
| `GET` | `/plans/{plan_id}` | User | path `plan_id` | `200 MembershipPlanResponse` | Loads one plan. |
| `PUT` | `/plans/{plan_id}` | Admin | `MembershipPlanUpdate` | `200 MembershipPlanResponse` | Updates a plan. Checks name uniqueness. Rejects null for required fields. |
| `DELETE` | `/plans/{plan_id}` | Admin | path `plan_id` | `204 No Content` | Deletes an unused plan. Fails with `409` if assigned to members. |

`MembershipPlanResponse` fields:

```text
id, name, program, duration_label, duration_months, classes_per_week,
price, currency, included_items, description, duration_days, sort_order,
is_active, created_at, updated_at
```

Important validation:

| Field | Rule |
| --- | --- |
| `duration_months` | 1 to 120. |
| `classes_per_week` | null or 1 to 14. |
| `price` | >= 0. |
| `currency` | exactly 3 characters, normalized uppercase. |
| `included_items` | Empty/whitespace-only items are removed. |
| `duration_days` | >= 1. |

### Schedule

The schedule is split into reusable templates and dated sessions.

| Method | Path | Auth | Request | Result | Main behavior |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/schedule/templates` | User | none | `200 list[ScheduleTemplateResponse]` | Lists class templates ordered by title. |
| `POST` | `/schedule/templates` | Admin | `ScheduleTemplateCreate` | `201 ScheduleTemplateResponse` | Creates a recurring schedule template. |
| `GET` | `/schedule/sessions` | User | none | `200 list[SessionResponse]` | Lists dated sessions newest first. |
| `POST` | `/schedule/sessions` | Admin | `SessionCreate` | `201 SessionResponse` | Creates a dated class/session. |
| `PATCH` | `/schedule/sessions/{session_id}/status` | Admin | `SessionStatusUpdate` | `200 SessionResponse` | Updates session status. |

Template fields:

```text
id, title, type, days, time, capacity, created_at, updated_at
```

Session fields:

```text
id, template_id, date, trainer_name, status, checklist_data, created_at, updated_at
```

### Enrollments

Enrollments connect members to either a recurring schedule template or a specific dated session.

| Method | Path | Auth | Request | Result | Main behavior |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/enrollments/` | User | none | `200 list[EnrollmentResponse]` | Lists enrollments newest first. |
| `POST` | `/enrollments/` | Admin | `EnrollmentCreate` | `201 EnrollmentResponse` | Enrolls a member in one template or one session. |
| `DELETE` | `/enrollments/{enrollment_id}` | Admin | path `enrollment_id` | `204 No Content` | Deletes an enrollment. |

Enrollment rules:

| Rule | Behavior |
| --- | --- |
| Exactly one target | Request must provide one of `template_id` or `session_id`, not both and not neither. |
| Member must exist | Missing member returns `404`. |
| Frozen members blocked | Frozen member enrollment returns `400`. |
| Duplicate prevention | Existing same member/target enrollment returns `409`. |
| Capacity check | Existing enrollments cannot meet/exceed template or session capacity. |
| Notification | If member opted in, class enrollment confirmation is queued. |

`EnrollmentResponse` fields:

```text
id, member_id, template_id, session_id, created_at, updated_at
```

### Check-Ins

Check-ins represent member attendance.

| Method | Path | Auth | Request | Result | Main behavior |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/check-ins/` | User | none | `200 list[CheckInResponse]` | Lists check-ins newest first. |
| `POST` | `/check-ins/` | Admin | `CheckInCreate` | `201 CheckInResponse` | Checks a member in at current UTC time. |
| `PATCH` | `/check-ins/{check_in_id}/check-out` | Admin | `CheckOutRequest` | `200 CheckInResponse` | Sets checkout time to request value or current UTC time. |

Check-in rules:

| Rule | Behavior |
| --- | --- |
| Member must exist | Missing member returns `404`. |
| One active check-in | A member cannot have a second row with `check_out_time = null`. |
| Checkout once | Already checked-out rows return `409`. |
| DB time constraint | `check_out_time` must be null or >= `check_in_time`. |

`CheckInResponse` fields:

```text
id, member_id, check_in_time, check_out_time
```

### Dashboard

Dashboard endpoints are read-only and available to any active user.

| Method | Path | Auth | Request | Result | Main behavior |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/dashboard/stats` | User | none | `200 DashboardStatsResponse` | Returns top-level counts. |
| `GET` | `/dashboard/active-members` | User | none | `200 list[ActiveMemberResponse]` | Lists members currently checked in. |
| `GET` | `/dashboard/recent-activities` | User | query: `limit`, default 10 | `200 list[RecentActivityResponse]` | Lists recent check-in/check-out activity. |

`DashboardStatsResponse`:

```text
total_members      = count(members.id)
active_members     = count(check_ins.id where check_out_time is null)
today_sessions     = count(sessions.id where date = today)
recent_activities  = count(check_ins.id where date(check_in_time) = today)
```

`ActiveMemberResponse`:

```text
member_id, member_name, phone, check_in_time
```

`RecentActivityResponse`:

```text
check_in_id, member_id, member_name, action, timestamp
```

The `action` is `check_in` when the row has no checkout time, otherwise `check_out`.

### Analytics

Analytics endpoints are read-only and available to any active user.

| Method | Path | Auth | Request | Result | Main behavior |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/analytics/growth` | User | none | `200 list[GrowthPoint]` | Groups members by creation date. |
| `GET` | `/analytics/attendance` | User | none | `200 list[AttendancePoint]` | Groups check-ins by check-in date. |
| `GET` | `/analytics/notifications` | User | none | `200 NotificationAnalytics` | Counts notification jobs by status, channel, and type. |

`GrowthPoint`:

```text
date, new_members
```

`AttendancePoint`:

```text
date, attendance_count
```

`NotificationAnalytics`:

```text
total, pending, processed, failed, delivery_rate, by_channel, by_type, by_status
```

`delivery_rate = processed / (processed + failed)`. Pending jobs do not affect the denominator.

### Notifications And Announcements

Notifications are stored as jobs before they are delivered. Admins can inspect jobs and create announcements.

| Method | Path | Auth | Request | Result | Main behavior |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/notifications/jobs` | Admin | query: `status`, `channel`, `notification_type` | `200 list[NotificationJobResponse]` | Lists jobs newest first with optional filters. |
| `GET` | `/notifications/channels` | User | none | `200 list[dict]` | Shows each channel's configured and available state. |
| `POST` | `/notifications/announcements` | Admin | `AnnouncementCreate` | `201 AnnouncementResponse` | Creates announcement and fans it out into notification jobs. |
| `GET` | `/notifications/announcements` | Admin | none | `200 list[AnnouncementResponse]` | Lists announcements newest first. |

Channel status response item:

```json
{
  "channel": "whatsapp",
  "configured": false,
  "available": true
}
```

`available` is true if the channel has real credentials or `MESSAGING_DEV_MODE=true`.

Announcement filters:

| Filter | Meaning |
| --- | --- |
| `plan_id` | Only members assigned to this membership plan. |
| `program` | Only members whose assigned plan has this program. |
| `expired=true` | Only opted-in members with expiry before today. |
| `expired=false` | Opted-in members with no expiry date or expiry today/later. |

Announcement creation behavior:

1. Stores an `announcements` row.
2. Resolves opted-in member recipients matching the filters.
3. Deduplicates requested channels while preserving order.
4. Creates one `notification_jobs` row per reachable member/channel pair.
5. Sets `recipient_count`, `job_count`, and status.

Announcement status behavior in the current code:

| Case | Status |
| --- | --- |
| At least one job created | `sent` |
| No jobs created | `queued` |

This means "sent" currently means "jobs were created", not necessarily that external providers delivered the messages.

### Tasks

Task endpoints are admin-only controls around Celery and demo data.

| Method | Path | Auth | Request | Result | Main behavior |
| --- | --- | --- | --- | --- | --- |
| `POST` | `/tasks/membership-expiry-reminders` | Admin | none | `202 {"task_id": "...", "status": "queued"}` | Queues expiry reminder job. |
| `POST` | `/tasks/process-notification-jobs` | Admin | none | `202 {"task_id": "...", "status": "queued"}` | Queues pending notification processing. |
| `POST` | `/tasks/seed-demo-data` | Admin | none | `200 seed result` | Directly runs demo data seed in the request transaction. |

Seed result shape:

```json
{
  "status": "seeded",
  "counts": {
    "users": 2,
    "plans": 0,
    "members": 0
  },
  "logins": {
    "admin": {
      "email": "admin@example.com",
      "password": "ChangeMe123!"
    },
    "staff": {
      "email": "staff@example.com",
      "password": "ChangeMe123!"
    }
  }
}
```

The exact `counts` keys come from `app/services/demo_data.py`.

### Health

| Method | Path | Auth | Request | Result | Main behavior |
| --- | --- | --- | --- | --- | --- |
| `GET` | `/health/live` | Public | none | `200 {"status": "ok"}` | Process liveness check. |
| `GET` | `/health/ready` | Public | none | `200 {"status": "ok"}` | Runs `SELECT 1` against the database. |

## 7. API Schema Reference

This section summarizes the request and response schemas. Field names are JSON names.

### Common Enums

| Enum | Values |
| --- | --- |
| `Gender` | `male`, `female`, `other` |
| `UserRole` | `admin`, `staff` |
| `ScheduleType` | `group`, `personal` |
| `SessionStatus` | `upcoming`, `in_progress`, `completed`, `cancelled` |
| `NotificationType` | `welcome`, `membership_expiry`, `session_reminder`, `enrollment`, `class_enrollment`, `announcement` |
| `NotificationStatus` | `pending`, `processed`, `failed` |
| `NotificationChannel` | `whatsapp`, `telegram`, `email` |
| `AnnouncementStatus` | `draft`, `queued`, `sent` |

### Auth And Users

| Schema | Fields |
| --- | --- |
| `BootstrapAdminRequest` | `full_name: str`, `email: EmailStr`, `password: str` |
| `LoginResponse` | `access_token: str`, `token_type: str = "bearer"` |
| `UserCreateRequest` | `full_name: str`, `email: EmailStr`, `password: str`, `role: UserRole = staff`, `is_active: bool = true` |
| `UserUpdateRequest` | optional `full_name`, `email`, `role`, `is_active` |
| `UserPasswordResetRequest` | `password: str` |
| `UserResponse` | `id`, `full_name`, `email`, `role`, `is_active`, `created_at`, `updated_at` |

### Members And Families

| Schema | Fields |
| --- | --- |
| `MemberCreate` | `name`, `phone`, optional `email`, optional `telegram_chat_id`, optional `parent_phone`, optional `family_id`, optional `gender`, optional `medical_issues`, `age`, optional `plan_id`, optional `expiry_date`, `messaging_opt_in = true`, `is_frozen = false` |
| `MemberUpdate` | all member fields optional, but `age` cannot be explicit null |
| `MemberResponse` | all create fields plus `id`, `is_frozen`, `created_at`, `updated_at` |
| `FreezeRequest` | `is_frozen: bool` |
| `FamilyParentCreate` | `name`, `phone`, optional `email`, optional `address`, `relationship = "parent"`, optional `notes` |
| `FamilyCreate` | `parent: FamilyParentCreate`, `members: list[MemberCreate]` |
| `FamilyGroupResponse` | `id`, `parent`, `members` |

### Plans

| Schema | Fields |
| --- | --- |
| `MembershipPlanCreate` | `name`, `program = "General"`, `duration_label = "One Month"`, `duration_months = 1`, optional `classes_per_week`, `price = 0.00`, `currency = "AED"`, `included_items = []`, optional `description`, `duration_days = 30`, `sort_order = 0`, `is_active = true` |
| `MembershipPlanUpdate` | all plan fields optional, with required model fields protected from explicit null |
| `MembershipPlanResponse` | all create fields plus `id`, `created_at`, `updated_at` |

### Schedule And Attendance

| Schema | Fields |
| --- | --- |
| `ScheduleTemplateCreate` | `title`, `type`, `days`, `time`, `capacity` |
| `ScheduleTemplateResponse` | create fields plus `id`, `created_at`, `updated_at` |
| `SessionCreate` | optional `template_id`, `date`, `trainer_name`, `status = upcoming`, `checklist_data = {}` |
| `SessionStatusUpdate` | `status` |
| `SessionResponse` | `id`, `template_id`, `date`, `trainer_name`, `status`, `checklist_data`, `created_at`, `updated_at` |
| `EnrollmentCreate` | `member_id`, exactly one of `template_id` or `session_id` |
| `EnrollmentResponse` | `id`, `member_id`, `template_id`, `session_id`, `created_at`, `updated_at` |
| `CheckInCreate` | `member_id` |
| `CheckOutRequest` | optional `check_out_time` |
| `CheckInResponse` | `id`, `member_id`, `check_in_time`, optional `check_out_time` |

### Dashboard, Analytics, Notifications

| Schema | Fields |
| --- | --- |
| `DashboardStatsResponse` | `total_members`, `active_members`, `today_sessions`, `recent_activities` |
| `ActiveMemberResponse` | `member_id`, `member_name`, `phone`, `check_in_time` |
| `RecentActivityResponse` | `check_in_id`, `member_id`, `member_name`, `action`, `timestamp` |
| `GrowthPoint` | `date`, `new_members` |
| `AttendancePoint` | `date`, `attendance_count` |
| `NotificationAnalytics` | `total`, `pending`, `processed`, `failed`, `delivery_rate`, `by_channel`, `by_type`, `by_status` |
| `NotificationJobResponse` | `id`, `member_id`, `notification_type`, `channel`, `status`, `recipient`, `scheduled_for`, `processed_at`, `payload`, `provider`, `provider_message_id`, `attempts`, `error_message`, `created_at`, `updated_at` |
| `AnnouncementFilters` | optional `plan_id`, optional `program`, optional `expired` |
| `AnnouncementCreate` | `subject`, `body`, `channels`, `filters = {}`, optional `scheduled_for` |
| `AnnouncementResponse` | `id`, `subject`, `body`, `channels`, `filters`, `status`, `scheduled_for`, `recipient_count`, `job_count`, `created_by_id`, `created_at`, `updated_at` |

## 8. Database Representation

The physical database is PostgreSQL. SQLAlchemy models define the application-side mapping, and Alembic migrations define the actual database schema.

Most business tables use `TimestampMixin`, which adds:

| Column | Type | Meaning |
| --- | --- | --- |
| `created_at` | `timestamp with time zone` | Creation timestamp, server default `now()`. |
| `updated_at` | `timestamp with time zone` | Update timestamp, server default `now()`. |

### Entity Relationship Summary

```text
app_users
  1 -> many announcements.created_by_id

membership_plans
  1 -> many members.plan_id

families
  1 -> many members.family_id

members
  1 -> many enrollments.member_id
  1 -> many check_ins.member_id
  1 -> many notification_jobs.member_id

schedule_templates
  1 -> many sessions.template_id
  1 -> many enrollments.template_id

sessions
  1 -> many enrollments.session_id
```

### `app_users`

Stores backend users who can log in.

| Column | Type | Null | Index/Constraint | Notes |
| --- | --- | --- | --- | --- |
| `id` | integer | no | primary key, index | Internal user id. |
| `full_name` | varchar(120) | no | none | Display name. |
| `email` | varchar(255) | no | unique, index | Login identity and JWT subject. Stored lowercase by route code. |
| `password_hash` | varchar(255) | no | none | bcrypt hash, never returned by API. |
| `role` | `user_role_enum` | no | none | `admin` or `staff`. |
| `is_active` | boolean | no | none | Inactive users cannot authenticate. |
| `created_at` | timestamptz | no | none | From `TimestampMixin`. |
| `updated_at` | timestamptz | no | none | From `TimestampMixin`. |

### `membership_plans`

Stores sellable membership products.

| Column | Type | Null | Index/Constraint | Notes |
| --- | --- | --- | --- | --- |
| `id` | integer | no | primary key, index | Plan id. |
| `name` | varchar(100) | no | unique | Human-readable plan name. |
| `program` | varchar(80) | no | index | Program/category, such as Kids or General. |
| `duration_label` | varchar(80) | no | none | Display label. |
| `duration_months` | integer | no | none | Month count. |
| `classes_per_week` | integer | yes | none | Optional weekly class entitlement. |
| `price` | numeric(10,2) | no | none | Decimal price. |
| `currency` | varchar(3) | no | none | Uppercase ISO-like code, default AED. |
| `included_items` | json | no | none | List of included features/items. |
| `description` | text | yes | none | Optional admin-facing copy. |
| `duration_days` | integer | no | none | Day count used for membership period calculations. |
| `sort_order` | integer | no | none | UI/API ordering. |
| `is_active` | boolean | no | none | Soft availability flag. |
| `created_at` | timestamptz | no | none | From `TimestampMixin`. |
| `updated_at` | timestamptz | no | none | From `TimestampMixin`. |

### `families`

Stores parent/guardian group records.

| Column | Type | Null | Index/Constraint | Notes |
| --- | --- | --- | --- | --- |
| `id` | integer | no | primary key, index | Family id. |
| `parent_name` | varchar(120) | no | index | Parent/guardian name. |
| `parent_phone` | varchar(30) | no | unique, index | Unique parent contact key. |
| `parent_email` | varchar(255) | yes | none | Optional parent email. |
| `parent_address` | varchar(255) | yes | none | Optional address. |
| `parent_relationship` | varchar(60) | no | none | Default `parent`. |
| `notes` | text | yes | none | Optional notes. |
| `created_at` | timestamptz | no | none | From `TimestampMixin`. |
| `updated_at` | timestamptz | no | none | From `TimestampMixin`. |

### `members`

Stores gym member profiles.

| Column | Type | Null | Index/Constraint | Notes |
| --- | --- | --- | --- | --- |
| `id` | integer | no | primary key, index | Member id. |
| `name` | varchar(120) | no | index | Member name. |
| `phone` | varchar(30) | no | unique, index | Primary contact, also WhatsApp recipient. |
| `email` | varchar(255) | yes | index | Email recipient. |
| `telegram_chat_id` | varchar(64) | yes | none | Telegram recipient. |
| `parent_phone` | varchar(30) | yes | index | Parent phone denormalized for compatibility/search. |
| `family_id` | integer | yes | FK to `families.id`, index | Links member to family group. |
| `gender` | `gender_enum` | yes | none | `male`, `female`, `other`. |
| `medical_issues` | text | yes | none | Medical notes. |
| `plan_id` | integer | yes | FK to `membership_plans.id` | Assigned membership plan. |
| `expiry_date` | date | yes | index | Membership expiration date. |
| `is_frozen` | boolean | no | none | Frozen members cannot be enrolled. |
| `messaging_opt_in` | boolean | no | none | Controls notification fan-out. |
| `age` | integer | no | none | Validated by API as 0 to 130. |
| `created_at` | timestamptz | no | none | From `TimestampMixin`. |
| `updated_at` | timestamptz | no | none | From `TimestampMixin`. |

### `schedule_templates`

Stores reusable class templates.

| Column | Type | Null | Index/Constraint | Notes |
| --- | --- | --- | --- | --- |
| `id` | integer | no | primary key, index | Template id. |
| `title` | varchar(120) | no | none | Class title. |
| `type` | `schedule_type_enum` | no | none | `group` or `personal`. |
| `days` | json | no | none | List of day labels. |
| `time` | varchar(20) | no | none | Time label/string. |
| `capacity` | integer | no | none | Enrollment capacity. |
| `created_at` | timestamptz | no | none | From `TimestampMixin`. |
| `updated_at` | timestamptz | no | none | From `TimestampMixin`. |

### `sessions`

Stores dated class sessions.

| Column | Type | Null | Index/Constraint | Notes |
| --- | --- | --- | --- | --- |
| `id` | integer | no | primary key, index | Session id. |
| `template_id` | integer | yes | FK to `schedule_templates.id` | Optional link to recurring template. |
| `date` | date | no | index | Session date. |
| `trainer_name` | varchar(120) | no | none | Trainer/instructor. |
| `status` | `session_status_enum` | no | none | `upcoming`, `in_progress`, `completed`, `cancelled`. |
| `checklist_data` | json | no | none | Arbitrary session checklist/progress data. |
| `created_at` | timestamptz | no | none | From `TimestampMixin`. |
| `updated_at` | timestamptz | no | none | From `TimestampMixin`. |

### `enrollments`

Connects members to either schedule templates or sessions.

| Column | Type | Null | Index/Constraint | Notes |
| --- | --- | --- | --- | --- |
| `id` | integer | no | primary key, index | Enrollment id. |
| `member_id` | integer | no | FK to `members.id` | Enrolled member. |
| `template_id` | integer | yes | FK to `schedule_templates.id` | Recurring-template target. |
| `session_id` | integer | yes | FK to `sessions.id` | Specific-session target. |
| `created_at` | timestamptz | no | none | From `TimestampMixin`. |
| `updated_at` | timestamptz | no | none | From `TimestampMixin`. |

Table constraint:

| Constraint | Columns | Meaning |
| --- | --- | --- |
| `uq_member_template_session` | `member_id`, `template_id`, `session_id` | Prevents duplicate triplets. Route logic also prevents duplicate member/template and member/session enrollments. |

Note: SQL nullable semantics mean this DB-level unique constraint alone does not fully prevent duplicate rows when either `template_id` or `session_id` is null. The route performs explicit duplicate checks to enforce the real business rule.

### `check_ins`

Stores attendance visits.

| Column | Type | Null | Index/Constraint | Notes |
| --- | --- | --- | --- | --- |
| `id` | integer | no | primary key, index | Check-in id. |
| `member_id` | integer | no | FK to `members.id`, index | Member who attended. |
| `check_in_time` | timestamptz | no | none | Check-in timestamp. |
| `check_out_time` | timestamptz | yes | none | Null means currently checked in. |

Check constraint:

| Constraint | Meaning |
| --- | --- |
| `ck_check_out_after_check_in` | Checkout must be null or later than/equal to check-in. |

### `notification_jobs`

Stores individual outbound message jobs.

| Column | Type | Null | Index/Constraint | Notes |
| --- | --- | --- | --- | --- |
| `id` | integer | no | primary key, index | Job id. |
| `member_id` | integer | yes | FK to `members.id`, index | Member recipient, nullable for future/system jobs. |
| `notification_type` | `notification_type_enum` | no | none | Business reason for message. |
| `channel` | `notification_channel_enum` | no | index | WhatsApp, Telegram, or email. |
| `status` | `notification_status_enum` | no | index | pending, processed, failed. |
| `recipient` | varchar(255) | yes | none | Copied delivery address/id at queue time. |
| `scheduled_for` | timestamptz | no | none | Earliest processing time. |
| `processed_at` | timestamptz | yes | none | Final processing timestamp. |
| `payload` | json | no | none | Message payload, currently `subject` and `text`. |
| `provider` | varchar(50) | no | none | Provider name or `dev-stub`. |
| `provider_message_id` | varchar(255) | yes | none | External provider message id when available. |
| `attempts` | integer | no | none | Delivery attempts. |
| `error_message` | text | yes | none | Last failure reason. |
| `created_at` | timestamptz | no | none | From `TimestampMixin`. |
| `updated_at` | timestamptz | no | none | From `TimestampMixin`. |

### `announcements`

Stores announcement campaigns created by admins.

| Column | Type | Null | Index/Constraint | Notes |
| --- | --- | --- | --- | --- |
| `id` | integer | no | primary key, index | Announcement id. |
| `subject` | varchar(200) | no | none | Message subject/title. |
| `body` | text | no | none | Message text. |
| `channels` | json | no | none | Requested channel values as strings. |
| `filters` | json | no | none | Recipient filters. |
| `status` | `announcement_status_enum` | no | none | draft, queued, sent. |
| `scheduled_for` | timestamptz | no | none | Job schedule time. |
| `recipient_count` | integer | no | none | Matching opted-in members. |
| `job_count` | integer | no | none | Jobs created after channel/reachability filtering. |
| `created_by_id` | integer | yes | FK to `app_users.id`, index | Admin who created it. |
| `created_at` | timestamptz | no | none | From `TimestampMixin`. |
| `updated_at` | timestamptz | no | none | From `TimestampMixin`. |

## 9. Core Business Workflows

### First Admin Bootstrap

1. Client calls `POST /api/v1/auth/bootstrap-admin`.
2. Backend counts `app_users`.
3. If count is greater than zero, returns `409`.
4. Otherwise hashes the password and inserts an `admin` user.
5. Returns `UserResponse`.

### Login

1. Client submits OAuth2 password form to `/api/v1/auth/login`.
2. Backend lowercases `username` and looks up `app_users.email`.
3. Password is verified against `password_hash`.
4. Inactive users are rejected.
5. Backend signs a JWT with `sub = user.email`.
6. Client sends `Authorization: Bearer <token>` on later requests.

### Individual Member Registration

1. Admin calls `POST /members/`.
2. Backend checks unique `phone`.
3. Backend inserts `members` row.
4. If `messaging_opt_in=true`, backend queues Celery task `queue_enrollment_confirmation`.
5. Celery task later creates `notification_jobs` rows for reachable channels.

### Family Registration

1. Admin calls `POST /members/families`.
2. Backend validates non-empty member list.
3. Backend verifies child member phones are unique within the request.
4. Backend verifies parent phone is not already a family.
5. Backend verifies no member phone already exists.
6. Backend inserts one `families` row.
7. Backend inserts multiple `members` rows with `family_id` and `parent_phone`.
8. Enrollment confirmations are queued per opted-in member.

### Class Enrollment

1. Admin calls `POST /enrollments/`.
2. Backend validates exactly one target: template or session.
3. Backend locks the member row with `FOR UPDATE`.
4. Frozen members are rejected.
5. Duplicate enrollment is rejected.
6. Target template/session is locked and capacity is checked.
7. Backend inserts the enrollment row.
8. If opted in, a class enrollment confirmation task is queued.

### Check-In And Check-Out

1. Admin calls `POST /check-ins/` with `member_id`.
2. Backend confirms member exists.
3. Backend checks no active check-in exists for that member.
4. Backend inserts a row with current UTC `check_in_time`.
5. For checkout, admin calls `PATCH /check-ins/{id}/check-out`.
6. Backend rejects missing/already-checked-out rows.
7. Backend sets `check_out_time` from request or current UTC.

### Announcement Fan-Out

1. Admin calls `POST /notifications/announcements`.
2. Backend inserts an announcement.
3. Backend resolves opted-in members matching filters.
4. For each member, the registry decides reachable channels:
   - WhatsApp uses `members.phone`.
   - Telegram uses `members.telegram_chat_id`.
   - Email uses `members.email`.
5. Backend inserts one `notification_jobs` row per member/channel pair.
6. Celery processing later sends those jobs.

### Notification Job Processing

1. Celery beat schedules `process_pending_notification_jobs` every 60 seconds.
2. Worker loads up to 100 pending jobs with `scheduled_for <= now`.
3. Worker gets the adapter for each job's channel.
4. Worker reconstructs `RenderedMessage` from `payload`.
5. Attempts count increments.
6. Adapter sends the message:
   - If configured, it calls the real provider.
   - If unconfigured and `MESSAGING_DEV_MODE=true`, it returns success with provider `dev-stub`.
   - If unconfigured and dev mode is false, it fails.
7. Success marks job `processed`.
8. Failure keeps job `pending` until attempts reach `NOTIFICATION_MAX_ATTEMPTS`, then marks `failed`.

## 10. Background Jobs

Celery is configured in `app/core/celery_app.py`.

| Scheduled name | Task | Schedule | Purpose |
| --- | --- | --- | --- |
| `membership-expiry-reminders-daily` | `app.tasks.send_membership_expiry_reminders` | every 24 hours | Queues reminders for memberships expiring today or in three days. |
| `process-notification-jobs-every-minute` | `app.tasks.process_pending_notification_jobs` | every 60 seconds | Processes due pending notification jobs. |

Task entry points:

| Task | Args | Returns | Purpose |
| --- | --- | --- | --- |
| `queue_enrollment_confirmation` | `member_id` | `{"created_jobs": n}` | Creates welcome/enrollment notification jobs for a member. |
| `queue_class_enrollment_confirmation` | `member_id`, `class_label` | `{"created_jobs": n}` | Creates class enrollment notification jobs. |
| `send_membership_expiry_reminders` | none | `{"queued_jobs": n}` | Finds members whose expiry date is today or in 3 days and queues jobs. |
| `process_pending_notification_jobs` | optional `limit=100` | `{"processed_jobs": n, "failed_jobs": n}` | Sends pending jobs through adapters. |

## 11. Deployment And Local Runtime

### Local Docker Compose

`backend/docker-compose.yml` defines:

| Service | Purpose |
| --- | --- |
| `api` | Runs Alembic migrations, then Uvicorn on port 8000. |
| `worker` | Runs Alembic migrations, then Celery worker. |
| `beat` | Runs Alembic migrations, then Celery beat. |
| `redis` | Redis 8 broker/backend. |
| `db` | PostgreSQL 17 with persistent `postgres_data` volume. |

Command:

```bash
cd backend
docker compose up --build
```

### Render/Neon

The Dockerfile runs:

```bash
uv run alembic upgrade head && uv run uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
```

For Neon, set:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require
```

The app normalizes the URL for asyncpg. This keeps local Docker using `POSTGRES_*` while production can use a single managed database URL.

## 12. Testing And Verification

Installed test tooling:

| Tool | Purpose |
| --- | --- |
| `pytest` | Test runner. |
| `pytest-asyncio` | Async tests. |
| `aiosqlite` | Lightweight async DB testing support. |

Current tests focus on notifications and messaging:

```text
backend/tests/test_messaging.py
backend/tests/test_notifications_api.py
backend/tests/test_notifications_flow.py
```

Smoke testing script:

```bash
cd backend
python scripts/smoke_test_api.py
```

The smoke test is intended to exercise auth, users, members, families, schedule, enrollments, check-ins, dashboard, analytics, notifications, and task endpoints against a running server.

## 13. Important Implementation Notes

| Area | Note |
| --- | --- |
| CORS | `app.main` currently allows all origins, credentials, methods, and headers. `settings.cors_origin_list` exists but is not used by middleware. |
| Admin dashboard | `/admin` is served by the backend from static files and is separate from the Vite React frontend. |
| DB sessions | `expire_on_commit=False`, so committed ORM objects keep loaded values after commit. |
| SQL logging | `settings.debug` controls SQLAlchemy `echo`. |
| Notification delivery | Announcement status does not prove provider delivery; provider delivery is tracked per `notification_jobs` row. |
| Message recipients | Recipients are copied into jobs at queue time, so later member contact edits do not change already queued jobs. |
| Deleting members | ORM relationships cascade enrollments, check-ins, and notification jobs when deleting via the session. |
| Plan deletion | Plans assigned to members cannot be deleted through the API; they should be deactivated instead. |
| Enrollment uniqueness | API logic enforces target uniqueness more strictly than the nullable DB unique constraint can. |
| Ready health | `/health/ready` only checks database connectivity, not Redis or external messaging providers. |

## 14. Mental Model

The backend can be understood as five connected domains:

1. Identity: `app_users`, JWT auth, admin/staff roles.
2. Membership: `members`, `families`, `membership_plans`, freezes, expiry dates.
3. Attendance and classes: `schedule_templates`, `sessions`, `enrollments`, `check_ins`.
4. Reporting: dashboard counts and analytics queries over members, check-ins, sessions, and notifications.
5. Communications: announcements create notification jobs; Celery delivers jobs through channel adapters.

Most endpoint handlers are intentionally thin. They validate input, enforce a few business rules, use SQLAlchemy directly, commit, and return schema models. The heavier cross-cutting workflow is notifications, where HTTP requests mostly create durable rows and Celery handles delivery separately.
