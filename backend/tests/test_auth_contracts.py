import pytest


pytestmark = pytest.mark.asyncio


async def test_check_email_reports_registered_and_unknown_emails(client):
    registered = await client.post("/api/v1/auth/check-email", json={"email": "ADMIN@Test.Local"})
    unknown = await client.post("/api/v1/auth/check-email", json={"email": "missing@test.local"})

    assert registered.status_code == 200
    assert registered.json() == {"success": True, "exists": True}
    assert unknown.status_code == 200
    assert unknown.json() == {"success": True, "exists": False}
