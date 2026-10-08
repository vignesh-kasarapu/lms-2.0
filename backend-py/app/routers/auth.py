"""Thin routes only — mirrors backend/src/routes/auth.routes.js +
controllers/auth.controller.js. All business logic lives in
app/services/auth_service.py; all Entra/JWT mechanics live in app/core/.
"""
import secrets

from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.db import get_db
from app.core.deps import CurrentUser, get_current_user
from app.core.entra import build_authorize_url, exchange_code_for_id_token, verify_entra_id_token
from app.core.exceptions import AppError
from app.core.responses import ok
from app.dao import employee_dao
from app.schemas.auth import AuthConfigOut, MobileTokenIn, SignOutOut, TokenOut
from app.services import auth_service

router = APIRouter()

STATE_COOKIE_NAME = "lms_oauth_state"
STATE_COOKIE_MAX_AGE = 600  # 10 minutes


def _set_session_cookie(response, token: str) -> None:
    response.set_cookie(
        settings.session_cookie_name,
        token,
        httponly=True,
        secure=settings.environment == "production",
        samesite="lax",
    )


@router.get("/config")
def get_auth_config():
    return ok(AuthConfigOut(dev_auth_bypass_enabled=settings.dev_auth_bypass_enabled).model_dump(by_alias=True))


@router.get("/login")
def redirect_to_entra():
    state = secrets.token_hex(24)
    url = build_authorize_url(
        tenant_id=settings.entra_tenant_id,
        client_id=settings.entra_client_id,
        redirect_uri=settings.entra_redirect_uri,
        state=state,
    )
    response = RedirectResponse(url, status_code=302)
    response.set_cookie(
        STATE_COOKIE_NAME, state, httponly=True,
        secure=settings.environment == "production", samesite="lax", max_age=STATE_COOKIE_MAX_AGE,
    )
    return response


@router.get("/callback")
def handle_callback(request: Request, db: Session = Depends(get_db)):
    login_error_url = f"{settings.client_base_url}/login?error="
    code = request.query_params.get("code")
    state = request.query_params.get("state")
    entra_error = request.query_params.get("error_description") or request.query_params.get("error")
    expected_state = request.cookies.get(STATE_COOKIE_NAME)

    if entra_error:
        return RedirectResponse(login_error_url + entra_error, status_code=302)
    if not code or not state or state != expected_state:
        return RedirectResponse(login_error_url + "Sign-in could not be verified. Please try again.", status_code=302)

    try:
        id_token = exchange_code_for_id_token(
            tenant_id=settings.entra_tenant_id,
            client_id=settings.entra_client_id,
            client_secret=settings.entra_client_secret,
            redirect_uri=settings.entra_redirect_uri,
            code=code,
        )
        claims = verify_entra_id_token(id_token, tenant_id=settings.entra_tenant_id, audience=settings.entra_client_id)
        employee = auth_service.resolve_employee_from_entra_claims(db, claims)
        token, _ = auth_service.sign_in(db, employee)
    except AppError as exc:
        return RedirectResponse(login_error_url + exc.message, status_code=302)
    except Exception:
        return RedirectResponse(login_error_url + "Sign-in failed. Please try again.", status_code=302)

    response = RedirectResponse(settings.client_base_url, status_code=302)
    response.delete_cookie(STATE_COOKIE_NAME)
    _set_session_cookie(response, token)
    return response


@router.get("/dev-login")
def dev_login_browser(db: Session = Depends(get_db)):
    if settings.environment == "production" or not settings.dev_auth_bypass_enabled:
        raise AppError("NOT_FOUND", "Not found.", status=404)
    employee = employee_dao.find_by_employee_code(db, settings.dev_auth_bypass_employee_code)
    if employee is None:
        raise AppError("DEV_BYPASS_MISCONFIGURED", "Dev auth bypass employee code not found.", status=401)
    token, _ = auth_service.sign_in(db, employee)
    response = RedirectResponse(settings.client_base_url, status_code=302)
    response.set_cookie(settings.session_cookie_name, token, httponly=True, secure=False, samesite="lax")
    return response


@router.post("/dev-login")
def dev_login_json(db: Session = Depends(get_db)):
    """JSON sibling of the browser dev-login, for mobile/local API testing —
    same server-side guard, never reachable in production regardless of client input."""
    if settings.environment == "production" or not settings.dev_auth_bypass_enabled:
        raise AppError("NOT_FOUND", "Not found.", status=404)
    employee = employee_dao.find_by_employee_code(db, settings.dev_auth_bypass_employee_code)
    if employee is None:
        raise AppError("DEV_BYPASS_MISCONFIGURED", "Dev auth bypass employee code not found.", status=401)
    token, expires_in = auth_service.sign_in(db, employee)
    return ok(TokenOut(access_token=token, expires_in=expires_in).model_dump())


@router.post("/mobile/token")
def mobile_token_exchange(payload: MobileTokenIn, db: Session = Depends(get_db)):
    """PKCE exchange for the Expo app's public client — see MIGRATION_PLAN.md §2.
    The backend does the /token exchange server-side; the phone never sees a secret."""
    id_token = exchange_code_for_id_token(
        tenant_id=settings.entra_tenant_id,
        client_id=settings.entra_mobile_client_id,
        redirect_uri=settings.entra_mobile_redirect_uri,
        code=payload.code,
        code_verifier=payload.code_verifier,
    )
    claims = verify_entra_id_token(id_token, tenant_id=settings.entra_tenant_id, audience=settings.entra_mobile_client_id)
    employee = auth_service.resolve_employee_from_entra_claims(db, claims)
    token, expires_in = auth_service.sign_in(db, employee)
    return ok(TokenOut(access_token=token, expires_in=expires_in).model_dump())


@router.post("/signout")
def sign_out(db: Session = Depends(get_db), user: CurrentUser = Depends(get_current_user)):
    auth_service.sign_out(db, user.employee_id if user else None)
    response = ok(SignOutOut().model_dump(by_alias=True))
    response.delete_cookie(settings.session_cookie_name)
    return response
