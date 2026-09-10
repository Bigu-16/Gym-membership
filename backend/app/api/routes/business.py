from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db_session
from app.models import BusinessProfile
from app.schemas.business import BusinessProfileRequest, BusinessProfileResponse, PaymentProvider
from app.services.payment_providers import get_payment_providers, normalize_account_details

router = APIRouter(tags=["business"])


@router.get("/payment-providers", response_model=list[PaymentProvider])
async def payment_providers() -> list[PaymentProvider]:
    return get_payment_providers()


@router.get("/business", response_model=BusinessProfileResponse)
async def get_business(db: AsyncSession = Depends(get_db_session)) -> BusinessProfileResponse:
    profile = await _get_or_create_business_profile(db)
    return BusinessProfileResponse(
        accountDetails=[normalize_account_details_item for normalize_account_details_item in profile.account_details],
        paymentProviders=get_payment_providers(),
    )


@router.patch("/business", response_model=BusinessProfileResponse)
async def patch_business(
    payload: BusinessProfileRequest,
    db: AsyncSession = Depends(get_db_session),
) -> BusinessProfileResponse:
    profile = await _get_or_create_business_profile(db)
    account_details = normalize_account_details(payload.accountDetails)
    profile.account_details = [account.model_dump(mode="json") for account in account_details]
    await db.commit()
    await db.refresh(profile)
    return BusinessProfileResponse(accountDetails=account_details, paymentProviders=get_payment_providers())


async def _get_or_create_business_profile(db: AsyncSession) -> BusinessProfile:
    profile = await db.scalar(select(BusinessProfile).order_by(BusinessProfile.id).limit(1))
    if profile is None:
        profile = BusinessProfile(account_details=[])
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
    return profile
