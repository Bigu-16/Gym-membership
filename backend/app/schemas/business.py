from typing import Literal

from pydantic import BaseModel


ProviderType = Literal["bank", "wallet"]


class PaymentProviderField(BaseModel):
    key: str
    required: bool


class PaymentProviderVariant(BaseModel):
    id: str
    fields: list[PaymentProviderField]
    listSummaryTemplate: str


class PaymentProvider(BaseModel):
    id: str
    displayName: str
    type: ProviderType
    credentialVariants: list[PaymentProviderVariant]


class BusinessAccountDetailRequest(BaseModel):
    providerId: str
    credentialVariant: str | None = None
    accountHolderName: str | None = None
    credentials: dict[str, str] | None = None
    bankName: str | None = None
    accountNumber: str | None = None


class BusinessAccountDetail(BaseModel):
    providerId: str
    providerType: ProviderType
    credentialVariant: str
    accountHolderName: str
    credentials: dict[str, str]
    displaySummary: str
    copyText: str


class BusinessProfileRequest(BaseModel):
    accountDetails: list[BusinessAccountDetailRequest]


class BusinessProfileResponse(BaseModel):
    accountDetails: list[BusinessAccountDetail]
    paymentProviders: list[PaymentProvider] | None = None
