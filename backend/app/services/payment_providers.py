from fastapi import HTTPException, status

from app.schemas.business import BusinessAccountDetail, BusinessAccountDetailRequest, PaymentProvider


BANK_PROVIDER_NAMES = {
    "cbe": "CBE",
    "boa": "Bank of Abyssinia",
    "awash": "Awash Bank",
    "dashen": "Dashen Bank",
    "hibret": "Hibret Bank",
}


def get_payment_providers() -> list[PaymentProvider]:
    bank_variant = {
        "id": "bank_account",
        "fields": [
            {"key": "accountHolderName", "required": True},
            {"key": "accountNumber", "required": True},
        ],
        "listSummaryTemplate": "{{accountHolderName}} {{accountNumber}}",
    }
    providers = [
        PaymentProvider(
            id="telebirr",
            displayName="Telebirr",
            type="wallet",
            credentialVariants=[
                {
                    "id": "merchant_operator",
                    "fields": [
                        {"key": "accountHolderName", "required": True},
                        {"key": "merchantId", "required": True},
                        {"key": "operatorId", "required": True},
                    ],
                    "listSummaryTemplate": "MID {{merchantId}} OID {{operatorId}}",
                },
                {
                    "id": "phone",
                    "fields": [
                        {"key": "accountHolderName", "required": True},
                        {"key": "phoneNumber", "required": True},
                    ],
                    "listSummaryTemplate": "{{phoneNumber}}",
                },
            ],
        )
    ]
    providers.extend(
        PaymentProvider(id=provider_id, displayName=display_name, type="bank", credentialVariants=[bank_variant])
        for provider_id, display_name in BANK_PROVIDER_NAMES.items()
    )
    return providers


def normalize_account_details(account_details: list[BusinessAccountDetailRequest]) -> list[BusinessAccountDetail]:
    providers = {provider.id: provider for provider in get_payment_providers()}
    normalized: list[BusinessAccountDetail] = []
    seen_provider_ids: set[str] = set()

    for account in account_details:
        provider_id = account.providerId
        if account.bankName and not provider_id:
            provider_id = account.bankName.strip().lower()

        provider = providers.get(provider_id)
        if provider is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Unsupported payment provider: {provider_id}",
            )
        if provider.id in seen_provider_ids:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Only one account per provider is allowed: {provider.id}",
            )
        seen_provider_ids.add(provider.id)

        variant_id = account.credentialVariant or provider.credentialVariants[0].id
        variant = next((candidate for candidate in provider.credentialVariants if candidate.id == variant_id), None)
        if variant is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Unsupported credential variant for {provider.id}: {variant_id}",
            )

        credentials = dict(account.credentials or {})
        if account.accountNumber:
            credentials.setdefault("accountNumber", account.accountNumber)

        holder_name = account.accountHolderName
        if not holder_name or not holder_name.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Missing required field for {provider.id}: accountHolderName",
            )
        holder_name = holder_name.strip()

        for field in variant.fields:
            if field.key == "accountHolderName":
                continue
            if field.required and not str(credentials.get(field.key, "")).strip():
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Missing required field for {provider.id}: {field.key}",
                )
            if field.key in credentials:
                credentials[field.key] = str(credentials[field.key]).strip()

        normalized.append(
            BusinessAccountDetail(
                providerId=provider.id,
                providerType=provider.type,
                credentialVariant=variant.id,
                accountHolderName=holder_name,
                credentials=credentials,
                displaySummary=_render_summary(variant.listSummaryTemplate, holder_name, credentials),
                copyText=_copy_text(provider.type, variant.id, credentials),
            )
        )

    return normalized


def _render_summary(template: str, holder_name: str, credentials: dict[str, str]) -> str:
    summary = template.replace("{{accountHolderName}}", holder_name)
    for key, value in credentials.items():
        summary = summary.replace("{{" + key + "}}", value)
    return " ".join(summary.split())


def _copy_text(provider_type: str, variant_id: str, credentials: dict[str, str]) -> str:
    if provider_type == "bank":
        return credentials["accountNumber"]
    if variant_id == "merchant_operator":
        return f"{credentials['merchantId']}\n{credentials['operatorId']}"
    if variant_id == "phone":
        return credentials["phoneNumber"]
    return "\n".join(credentials.values())
