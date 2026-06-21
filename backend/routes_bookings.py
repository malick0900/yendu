from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone
from typing import Optional

from db import db
from models import (
    BookingCreate, Booking, BookingStatusUpdate,
    ReviewCreate, Review,
    FavoriteCreate, Favorite,
    PromoValidateRequest,
    ReviewFromToken,
)
from auth_utils import (
    get_current_user, require_admin, serialize_doc,
    create_review_token, decode_review_token,
)
from routes_site import enqueue_notification, _log_admin, _site_contact
from email_templates import (
    booking_received, booking_confirmed, booking_cancelled,
    payment_received, admin_new_booking,
)

router = APIRouter(prefix="/api", tags=["bookings"])


def _parse_date(s: str) -> datetime:
    return datetime.fromisoformat(s)


def _ranges_overlap(a_start: str, a_end: str, b_start: str, b_end: str) -> bool:
    """Half-open intervals [a_start, a_end) vs [b_start, b_end). Same-day checkin/checkout is OK."""
    try:
        return _parse_date(a_start) < _parse_date(b_end) and _parse_date(b_start) < _parse_date(a_end)
    except Exception:
        return False


async def _resolve_promo(code: Optional[str]) -> tuple[Optional[dict], int]:
    """Returns (promo_doc, discount_percent). discount_percent=0 means no valid promo."""
    if not code:
        return None, 0
    normalized = code.strip().upper()
    if not normalized:
        return None, 0
    doc = await db.promo_codes.find_one({"code": normalized}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=400, detail="Code promo invalide")
    if not doc.get("is_active", True):
        raise HTTPException(status_code=400, detail="Ce code promo est désactivé")
    try:
        if datetime.fromisoformat(doc["valid_until"]) < datetime.now(timezone.utc).replace(tzinfo=None):
            raise HTTPException(status_code=400, detail="Ce code promo a expiré")
    except HTTPException:
        raise
    except Exception:
        pass  # malformed date stored — skip date check rather than block
    return doc, int(doc.get("discount_percent", 0))


@router.post("/promo-codes/validate")
async def validate_promo(payload: PromoValidateRequest):
    doc, percent = await _resolve_promo(payload.code)
    return {"valid": True, "code": doc["code"], "discount_percent": percent}


async def _ensure_property_available(prop_id: str, check_in: str, check_out: str):
    """Reject booking if dates collide with an admin block or an existing pending/confirmed booking."""
    blocks = await db.availability_blocks.find({"property_id": prop_id}, {"_id": 0}).to_list(500)
    for b in blocks:
        if _ranges_overlap(check_in, check_out, b.get("start_date", ""), b.get("end_date", "")):
            raise HTTPException(status_code=409, detail="Ces dates ne sont pas disponibles pour ce logement.")

    existing = await db.bookings.find({
        "type": "property", "target_id": prop_id,
        "status": {"$in": ["pending", "confirmed"]},
    }, {"_id": 0, "check_in": 1, "check_out": 1}).to_list(500)
    for e in existing:
        if not e.get("check_in") or not e.get("check_out"):
            continue
        if _ranges_overlap(check_in, check_out, e["check_in"], e["check_out"]):
            raise HTTPException(status_code=409, detail="Ce logement est déjà réservé sur cette période.")


@router.post("/bookings")
async def create_booking(payload: BookingCreate, request: Request):
    user = await get_current_user(request, db, required=True)
    if payload.type == "property":
        item = await db.properties.find_one({"id": payload.target_id}, {"_id": 0})
        if not item:
            raise HTTPException(status_code=404, detail="Logement introuvable")
        if not payload.check_in or not payload.check_out:
            raise HTTPException(status_code=400, detail="Dates de séjour requises")
        try:
            d_in = _parse_date(payload.check_in)
            d_out = _parse_date(payload.check_out)
        except Exception:
            raise HTTPException(status_code=400, detail="Format de date invalide")
        if d_out <= d_in:
            raise HTTPException(status_code=400, detail="La date de départ doit être après la date d'arrivée")
        await _ensure_property_available(payload.target_id, payload.check_in, payload.check_out)
        nights = max((d_out - d_in).days, 1)
        unit_price = int(item["price_per_night"])
        total = unit_price * nights
        title = item["title"]
        image = (item.get("images") or [None])[0]
    elif payload.type == "experience":
        item = await db.experiences.find_one({"id": payload.target_id}, {"_id": 0})
        if not item:
            raise HTTPException(status_code=404, detail="Expérience introuvable")
        if not payload.experience_date:
            raise HTTPException(status_code=400, detail="Date de l'expérience requise")
        nights = 0
        unit_price = int(item["price"])
        total = unit_price * max(payload.participants, 1)
        title = item["title"]
        image = (item.get("images") or [None])[0]
    else:
        raise HTTPException(status_code=400, detail="Type de réservation invalide")

    # Apply promo code (raises 400 if invalid/expired/disabled)
    promo_doc, promo_percent = await _resolve_promo(payload.promo_code)
    gross = total
    discount_amount = (gross * promo_percent) // 100
    total = gross - discount_amount

    booking = Booking(
        type=payload.type,
        target_id=payload.target_id,
        check_in=payload.check_in,
        check_out=payload.check_out,
        experience_date=payload.experience_date,
        guests=payload.guests,
        participants=payload.participants,
        notes=payload.notes,
        user_id=user["user_id"],
        user_email=user["email"],
        user_name=user["name"],
        target_title=title,
        target_image=image,
        nights=nights,
        unit_price=unit_price,
        total_price=total,
        promo_code=promo_doc["code"] if promo_doc else None,
        discount_percent=promo_percent,
        discount_amount=discount_amount,
    )
    doc = booking.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["user_phone"] = user.get("phone")  # snapshot for emails
    await db.bookings.insert_one(doc)
    doc.pop("_id", None)  # Remove MongoDB ObjectId
    if promo_doc:
        await db.promo_codes.update_one({"id": promo_doc["id"]}, {"$inc": {"used_count": 1}})
    # Notify the traveler (branded acknowledgement) — `item` is the listing doc
    contact = await _site_contact()
    try:
        subj, html = booking_received(doc, listing=item, contact=contact)
        await enqueue_notification(doc["user_email"], subj, html, type_="booking_created", meta={"booking_id": doc["id"]})
    except Exception:
        pass
    # Notify the admin of the new booking
    try:
        asubj, ahtml = admin_new_booking(doc, listing=item)
        await enqueue_notification(contact["email"], asubj, ahtml, type_="admin_new_booking", meta={"booking_id": doc["id"]}, reply_to=doc.get("user_email"))
    except Exception:
        pass
    return serialize_doc(doc)


@router.get("/bookings/me")
async def my_bookings(request: Request):
    user = await get_current_user(request, db, required=True)
    items = await db.bookings.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return [serialize_doc(i) for i in items]


@router.get("/admin/bookings")
async def admin_list_bookings(request: Request, status: Optional[str] = None):
    await require_admin(request, db)
    query: dict = {}
    if status:
        query["status"] = status
    items = await db.bookings.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [serialize_doc(i) for i in items]


@router.patch("/admin/bookings/{booking_id}")
async def update_booking_status(booking_id: str, payload: BookingStatusUpdate, request: Request):
    admin = await require_admin(request, db)
    update_data = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Aucun changement")
    await db.bookings.update_one({"id": booking_id}, {"$set": update_data})
    item = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Réservation introuvable")
    # Notify the traveler on status changes
    try:
        await _log_admin(admin, "update_booking", {"booking_id": booking_id, **update_data})
        coll = db.properties if item.get("type") == "property" else db.experiences
        listing = await coll.find_one({"id": item.get("target_id")}, {"_id": 0})
        contact = await _site_contact()
        subj = None; html = None
        if update_data.get("status") == "confirmed":
            subj, html = booking_confirmed(item, listing=listing, contact=contact)
        elif update_data.get("status") == "cancelled":
            subj, html = booking_cancelled(item, listing=listing, contact=contact)
        elif update_data.get("payment_status") == "paid":
            subj, html = payment_received(item, listing=listing, contact=contact)
        if subj and html and item.get("user_email"):
            await enqueue_notification(item["user_email"], subj, html, type_="booking_update", meta={"booking_id": booking_id, **update_data})
    except Exception:
        pass
    return serialize_doc(item)


# ---------- REVIEWS ----------
@router.get("/reviews")
async def list_reviews(type: str, target_id: str):
    items = await db.reviews.find({"type": type, "target_id": target_id, "is_visible": True}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return [serialize_doc(i) for i in items]


@router.post("/reviews")
async def create_review(payload: ReviewCreate, request: Request):
    user = await get_current_user(request, db, required=True)
    if payload.rating < 1 or payload.rating > 5:
        raise HTTPException(status_code=400, detail="La note doit être entre 1 et 5")
    review = Review(
        type=payload.type,
        target_id=payload.target_id,
        user_id=user["user_id"],
        user_name=user["name"],
        user_avatar=user.get("avatar"),
        rating=payload.rating,
        comment=payload.comment,
    )
    doc = review.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.reviews.insert_one(doc)
    doc.pop("_id", None)  # Remove MongoDB ObjectId

    # Recompute aggregate
    collection_name = "properties" if payload.type == "property" else "experiences"
    pipeline = [
        {"$match": {"type": payload.type, "target_id": payload.target_id, "is_visible": True}},
        {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}},
    ]
    agg = await db.reviews.aggregate(pipeline).to_list(1)
    if agg:
        await db[collection_name].update_one(
            {"id": payload.target_id},
            {"$set": {"rating_avg": round(agg[0]["avg"], 2), "rating_count": agg[0]["count"]}},
        )
    return serialize_doc(doc)


@router.post("/reviews/from-token")
async def create_review_from_token(payload: ReviewFromToken):
    """Public endpoint — let a guest submit a review using the token emailed after their stay."""
    booking_id = decode_review_token(payload.token)
    if not booking_id:
        raise HTTPException(status_code=400, detail="Lien invalide ou expiré")
    if payload.rating < 1 or payload.rating > 5:
        raise HTTPException(status_code=400, detail="La note doit être entre 1 et 5")

    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Réservation introuvable")

    # One review per booking
    already = await db.reviews.find_one({"booking_id": booking_id}, {"_id": 0})
    if already:
        raise HTTPException(status_code=409, detail="Un avis a déjà été déposé pour cette réservation")

    review = Review(
        type=booking["type"],
        target_id=booking["target_id"],
        user_id=booking.get("user_id", ""),
        user_name=booking.get("user_name", ""),
        user_avatar=None,
        rating=payload.rating,
        comment=payload.comment,
    )
    doc = review.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["booking_id"] = booking_id  # track origin so we don't accept a second one
    await db.reviews.insert_one(doc)
    doc.pop("_id", None)

    # Recompute aggregate (same as /reviews)
    collection_name = "properties" if booking["type"] == "property" else "experiences"
    pipeline = [
        {"$match": {"type": booking["type"], "target_id": booking["target_id"], "is_visible": True}},
        {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}},
    ]
    agg = await db.reviews.aggregate(pipeline).to_list(1)
    if agg:
        await db[collection_name].update_one(
            {"id": booking["target_id"]},
            {"$set": {"rating_avg": round(agg[0]["avg"], 2), "rating_count": agg[0]["count"]}},
        )
    return serialize_doc(doc)


@router.get("/reviews/token/{token}")
async def get_review_target(token: str):
    """Public — given a token, return the booking's target title/image so the review page can show context."""
    booking_id = decode_review_token(token)
    if not booking_id:
        raise HTTPException(status_code=400, detail="Lien invalide ou expiré")
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Réservation introuvable")
    already = await db.reviews.find_one({"booking_id": booking_id}, {"_id": 0})
    return {
        "target_title": booking.get("target_title"),
        "target_image": booking.get("target_image"),
        "type": booking.get("type"),
        "already_reviewed": bool(already),
    }


@router.get("/admin/reviews")
async def admin_list_reviews(request: Request):
    await require_admin(request, db)
    items = await db.reviews.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [serialize_doc(i) for i in items]


@router.patch("/admin/reviews/{review_id}")
async def moderate_review(review_id: str, payload: dict, request: Request):
    await require_admin(request, db)
    update = {}
    if "is_visible" in payload:
        update["is_visible"] = bool(payload["is_visible"])
    if not update:
        raise HTTPException(status_code=400, detail="Aucun changement")
    await db.reviews.update_one({"id": review_id}, {"$set": update})
    item = await db.reviews.find_one({"id": review_id}, {"_id": 0})
    return serialize_doc(item)


# ---------- FAVORITES ----------
@router.get("/favorites/me")
async def my_favorites(request: Request):
    user = await get_current_user(request, db, required=True)
    favs = await db.favorites.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(200)
    # Hydrate
    result = []
    for f in favs:
        if f["type"] == "property":
            target = await db.properties.find_one({"id": f["target_id"]}, {"_id": 0})
        else:
            target = await db.experiences.find_one({"id": f["target_id"]}, {"_id": 0})
        if target:
            result.append({**serialize_doc(f), "target": serialize_doc(target)})
    return result


@router.post("/favorites")
async def add_favorite(payload: FavoriteCreate, request: Request):
    user = await get_current_user(request, db, required=True)
    existing = await db.favorites.find_one({"user_id": user["user_id"], "type": payload.type, "target_id": payload.target_id})
    if existing:
        return {"ok": True, "already": True}
    fav = Favorite(user_id=user["user_id"], type=payload.type, target_id=payload.target_id)
    doc = fav.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.favorites.insert_one(doc)
    doc.pop("_id", None)  # Remove MongoDB ObjectId
    return serialize_doc(doc)


@router.delete("/favorites")
async def remove_favorite(type: str, target_id: str, request: Request):
    user = await get_current_user(request, db, required=True)
    await db.favorites.delete_one({"user_id": user["user_id"], "type": type, "target_id": target_id})
    return {"ok": True}
