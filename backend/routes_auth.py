from fastapi import APIRouter, HTTPException, Request, Response, status
from datetime import datetime, timedelta, timezone
import os
import uuid

from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

from models import UserCreate, UserLogin, TokenResponse, UserPublic, UserUpdate, GoogleCredentialRequest
from auth_utils import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    serialize_doc,
)
from db import db

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _public(user_doc: dict) -> dict:
    safe = {k: v for k, v in user_doc.items() if k != "password_hash"}
    return serialize_doc(safe)


@router.post("/register", response_model=TokenResponse)
async def register(payload: UserCreate):
    email = payload.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Un compte avec cet email existe déjà")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": email,
        "name": payload.name.strip() or email.split("@")[0],
        "phone": payload.phone,
        "avatar": payload.avatar,
        "role": "TRAVELER",
        "provider": "email",
        "password_hash": hash_password(payload.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    user_doc.pop("_id", None)  # Remove MongoDB ObjectId
    token = create_access_token(user_id, "TRAVELER")
    return {"access_token": token, "token_type": "bearer", "user": _public(user_doc)}


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=400, detail="Email ou mot de passe incorrect")
    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Email ou mot de passe incorrect")
    token = create_access_token(user["user_id"], user.get("role", "TRAVELER"))
    return {"access_token": token, "token_type": "bearer", "user": _public(user)}


@router.get("/me")
async def me(request: Request):
    user = await get_current_user(request, db, required=True)
    return _public(user)


@router.patch("/me")
async def update_me(payload: UserUpdate, request: Request):
    user = await get_current_user(request, db, required=True)
    update_data = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if update_data:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": update_data})
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password_hash": 0})
    return serialize_doc(updated)


@router.post("/google/session", response_model=TokenResponse)
async def google_session(payload: GoogleCredentialRequest):
    """Verify a Google Identity Services ID token and issue an app JWT."""
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    if not client_id:
        raise HTTPException(status_code=500, detail="Google OAuth non configuré")

    try:
        idinfo = google_id_token.verify_oauth2_token(
            payload.credential, google_requests.Request(), client_id
        )
    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"Credential Google invalide: {e}")

    email = (idinfo.get("email") or "").lower().strip()
    if not email or not idinfo.get("email_verified", False):
        raise HTTPException(status_code=400, detail="Email Google non vérifié")

    name = idinfo.get("name") or email.split("@")[0]
    picture = idinfo.get("picture")

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"avatar": existing.get("avatar") or picture}},
        )
        user = existing
        user["avatar"] = user.get("avatar") or picture
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "avatar": picture,
            "phone": None,
            "role": "TRAVELER",
            "provider": "google",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one(user)
        user.pop("_id", None)

    token = create_access_token(user_id, user.get("role", "TRAVELER"))
    return {"access_token": token, "token_type": "bearer", "user": _public(user)}


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie("session_token", path="/")
    return {"ok": True}
