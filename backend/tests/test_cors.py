from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from httpx import ASGITransport, AsyncClient

from app.core.config import Settings


async def test_production_frontend_preflight_survives_cors_env_override():
    test_settings = Settings(_env_file=None, cors_origins="http://localhost:5173")
    test_app = FastAPI()
    test_app.add_middleware(
        CORSMiddleware,
        allow_origins=test_settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    async with AsyncClient(transport=ASGITransport(app=test_app), base_url="http://test") as client:
        response = await client.options(
            "/api/v1/auth/login",
            headers={
                "Origin": "https://gym-membership-beta.vercel.app",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type,authorization",
            },
        )
        actual_response = await client.post(
            "/api/v1/auth/login",
            headers={"Origin": "https://gym-membership-beta.vercel.app"},
        )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "https://gym-membership-beta.vercel.app"
    assert actual_response.headers["access-control-allow-origin"] == "https://gym-membership-beta.vercel.app"


def test_cors_origins_are_normalized_and_deduplicated():
    test_settings = Settings(
        _env_file=None,
        cors_origins=(
            "https://gym-membership-beta.vercel.app/,"
            "https://gym-membership-beta.vercel.app,http://localhost:5173/"
        ),
    )

    assert test_settings.cors_origin_list == [
        "https://gym-membership-beta.vercel.app",
        "http://localhost:5173",
    ]
