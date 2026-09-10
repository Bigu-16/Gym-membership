import pytest


pytestmark = pytest.mark.asyncio


async def test_payment_providers_expose_bank_and_wallet_variants(client):
    response = await client.get("/api/v1/payment-providers")

    assert response.status_code == 200
    providers = response.json()

    telebirr = next(provider for provider in providers if provider["id"] == "telebirr")
    assert telebirr == {
        "id": "telebirr",
        "displayName": "Telebirr",
        "type": "wallet",
        "credentialVariants": [
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
    }

    cbe = next(provider for provider in providers if provider["id"] == "cbe")
    assert cbe["type"] == "bank"
    assert cbe["credentialVariants"][0]["fields"] == [
        {"key": "accountHolderName", "required": True},
        {"key": "accountNumber", "required": True},
    ]


async def test_business_patch_and_read_wallet_account_details(client):
    payload = {
        "accountDetails": [
            {
                "providerId": "telebirr",
                "credentialVariant": "merchant_operator",
                "accountHolderName": "Yohannan Ayfokiru",
                "credentials": {"merchantId": "938423", "operatorId": "273645"},
            }
        ]
    }

    patched = await client.patch("/api/v1/business", json=payload)
    read_back = await client.get("/api/v1/business")

    expected_account = {
        "providerId": "telebirr",
        "providerType": "wallet",
        "credentialVariant": "merchant_operator",
        "accountHolderName": "Yohannan Ayfokiru",
        "credentials": {"merchantId": "938423", "operatorId": "273645"},
        "displaySummary": "MID 938423 OID 273645",
        "copyText": "938423\n273645",
    }
    assert patched.status_code == 200
    assert patched.json()["accountDetails"] == [expected_account]
    assert read_back.status_code == 200
    assert read_back.json()["accountDetails"] == [expected_account]
