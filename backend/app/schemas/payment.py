from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import PaymentKind, PaymentMethod


class PaymentCreate(BaseModel):
    member_id: int
    plan_id: int | None = None
    amount: Decimal = Field(ge=0)
    currency: str = Field(default="AED", min_length=3, max_length=3)
    method: PaymentMethod = PaymentMethod.cash
    kind: PaymentKind = PaymentKind.new
    paid_on: date | None = None
    period_start: date | None = None
    period_end: date | None = None
    note: str | None = None


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    member_id: int
    plan_id: int | None
    amount: Decimal
    currency: str
    method: PaymentMethod
    kind: PaymentKind
    paid_on: date
    period_start: date | None
    period_end: date | None
    note: str | None
    created_at: datetime
