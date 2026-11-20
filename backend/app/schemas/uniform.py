from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator

from app.models.enums import FeeMethod, UniformOrderStatus
from app.schemas.common import Money, OptionalPhone, OptionalText


class SizeOut(BaseModel):
    id: int
    label: str
    sort_order: int
    price: Decimal | None
    effective_price: Decimal
    is_active: bool
    pending: int  # ordered from the supplier, not arrived
    received: int
    adjusted: int
    sold: int
    in_stock: int
    low: bool


class SizeCreate(BaseModel):
    label: str = Field(min_length=1, max_length=10)
    price: Money | None = None
    sort_order: int | None = None

    @field_validator("label")
    @classmethod
    def clean(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("size cannot be empty")
        return value


class SizeUpdate(BaseModel):
    label: str | None = Field(default=None, min_length=1, max_length=10)
    price: Money | None = None
    clear_price: bool = False
    sort_order: int | None = None
    is_active: bool | None = None


class OrderLineIn(BaseModel):
    size_id: int
    quantity: int = Field(ge=1, le=10_000)


class OrderCreate(BaseModel):
    supplier: OptionalText = None
    ordered_on: date | None = None
    note: OptionalText = None
    lines: list[OrderLineIn] = Field(min_length=1, max_length=50)


class OrderReceive(BaseModel):
    received_on: date | None = None


class OrderLineOut(BaseModel):
    size_id: int
    size: str
    quantity: int


class OrderOut(BaseModel):
    id: int
    supplier: str | None
    ordered_on: date
    status: UniformOrderStatus
    received_on: date | None
    note: str | None
    total_quantity: int
    lines: list[OrderLineOut]


class SaleCreate(BaseModel):
    size_id: int
    quantity: int = Field(default=1, ge=1, le=100)
    unit_price: Money | None = None
    method: FeeMethod
    reference: str | None = Field(default=None, max_length=64)
    sold_on: date | None = None
    student_id: int | None = None
    guardian_id: int | None = None
    buyer_name: OptionalText = None
    buyer_phone: OptionalPhone = None


class SaleOut(BaseModel):
    id: int
    size_id: int
    size: str
    quantity: int
    unit_price: Decimal
    total: Decimal
    method: FeeMethod
    reference: str | None
    sold_on: date
    student_id: int | None
    guardian_id: int | None
    buyer: str
    receipt_no: str | None


class AdjustmentCreate(BaseModel):
    size_id: int
    quantity: int = Field(ge=-10_000, le=10_000)
    reason: str = Field(min_length=2, max_length=200)

    @field_validator("quantity")
    @classmethod
    def not_zero(cls, value: int) -> int:
        if value == 0:
            raise ValueError("quantity cannot be 0")
        return value


class StockCount(BaseModel):
    """Set the counted stock for a size; the difference is saved as an adjustment."""

    size_id: int
    counted: int = Field(ge=0, le=100_000)
    reason: str = Field(default="Stock count", min_length=2, max_length=200)
