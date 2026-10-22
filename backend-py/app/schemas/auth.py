from pydantic import BaseModel

from app.schemas.base import CamelOut


class AuthConfigOut(CamelOut):
    """Node hand-builds { devAuthBypassEnabled } here — camelCase, unlike
    almost every other Node response. See app/schemas/base.py."""

    dev_auth_bypass_enabled: bool


class MobileTokenIn(BaseModel):
    code: str
    code_verifier: str


class TokenOut(BaseModel):
    """Mobile-only endpoint with no Node precedent (backend-py added
    POST /api/auth/mobile/token new for the Expo app) — snake_case is fine,
    the mobile client (mobile/src/api/auth.ts) already expects it."""

    access_token: str
    expires_in: int


class SignOutOut(CamelOut):
    signed_out: bool = True
