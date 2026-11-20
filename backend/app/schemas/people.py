from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.enums import FeeMethod
from app.schemas.common import Money, OptionalPhone, OptionalText, PersonName, Phone


class GuardianIn(BaseModel):
    name: PersonName
    phone: Phone
    phone_alt: OptionalPhone = None
    notes: OptionalText = None


class GuardianUpdate(BaseModel):
    name: PersonName | None = None
    phone: Phone | None = None
    phone_alt: OptionalPhone = None
    notes: OptionalText = None


class StudentIn(BaseModel):
    name: PersonName
    age: int | None = Field(default=None, ge=2, le=80)
    uniform_size: str | None = Field(default=None, max_length=10)
    slot_id: int
    notes: OptionalText = None
    # Sell this kid's uniform (in uniform_size) together with the enrolment.
    buy_uniform: bool = False
    # Training fee for this kid for the whole payment; None = monthly fee x months.
    amount: Money | None = None


class StudentUpdate(BaseModel):
    name: PersonName | None = None
    age: int | None = Field(default=None, ge=2, le=80)
    uniform_size: str | None = Field(default=None, max_length=10)
    slot_id: int | None = None
    notes: OptionalText = None
    is_active: bool | None = None
    # Correct a wrong expiry by hand (normally set by payments).
    expiry_date: date | None = None


class PaymentIn(BaseModel):
    method: FeeMethod
    reference: str | None = Field(default=None, max_length=64)
    months: int = Field(default=1, ge=1, le=12)
    paid_on: date | None = None
    note: OptionalText = None

    @model_validator(mode="after")
    def reference_for_transfers(self):
        if self.reference is not None:
            self.reference = self.reference.strip() or None
        return self


class EnrolmentIn(BaseModel):
    """Register one parent with one or more kids, and take the first payment."""

    guardian_id: int | None = None
    guardian: GuardianIn | None = None
    students: list[StudentIn] = Field(min_length=1, max_length=12)
    payment: PaymentIn
    # First day of training (defaults to today).
    start_date: date | None = None

    @model_validator(mode="after")
    def one_guardian(self):
        if (self.guardian_id is None) == (self.guardian is None):
            raise ValueError("give either an existing parent or a new parent")
        return self


class RenewalItem(BaseModel):
    student_id: int
    amount: Money | None = None


class RenewalIn(BaseModel):
    """Pay for one or more kids of the same parent at once."""

    items: list[RenewalItem] = Field(min_length=1, max_length=12)
    payment: PaymentIn


class SlotBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    start_time: str
    end_time: str


class StudentOut(BaseModel):
    id: int
    name: str
    age: int | None
    uniform_size: str | None
    slot_id: int | None
    guardian_id: int
    guardian_name: str
    guardian_phone: str
    joined_on: date
    expiry_date: date | None
    days_left: int | None
    classes_left: int | None
    status: str  # active | expiring | critical | expired | unpaid | inactive
    is_active: bool
    notes: str | None


class GuardianOut(BaseModel):
    id: int
    name: str
    phone: str
    phone_alt: str | None
    notes: str | None
    students: list[StudentOut] = []


class FeePaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    student_id: int
    guardian_id: int
    receipt_no: str
    amount: Decimal
    method: FeeMethod
    reference: str | None
    months: int
    paid_on: date
    period_start: date
    period_end: date
    note: str | None


class UniformSaleBrief(BaseModel):
    id: int
    size: str
    quantity: int
    total: Decimal


class EnrolmentOut(BaseModel):
    guardian: GuardianOut
    receipt_no: str
    payments: list[FeePaymentOut]
    uniform_sales: list[UniformSaleBrief]
    total: Decimal
    warnings: list[str] = []
