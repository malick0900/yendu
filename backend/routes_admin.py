from fastapi import APIRouter, HTTPException, Request
from datetime import datetime, timezone, timedelta
from typing import List, Dict
import uuid

from db import db
from auth_utils import require_admin, serialize_doc
from models import PromoCodeCreate, PromoCodeUpdate

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/stats")
async def stats(request: Request):
    await require_admin(request, db)
    total_users = await db.users.count_documents({})
    total_travelers = await db.users.count_documents({"role": "TRAVELER"})
    total_properties = await db.properties.count_documents({})
    total_experiences = await db.experiences.count_documents({})
    total_bookings = await db.bookings.count_documents({})
    pending_bookings = await db.bookings.count_documents({"status": "pending"})
    confirmed_bookings = await db.bookings.count_documents({"status": "confirmed"})
    paid_bookings = await db.bookings.count_documents({"payment_status": "paid"})
    property_bookings = await db.bookings.count_documents({"type": "property"})
    experience_bookings = await db.bookings.count_documents({"type": "experience"})

    # Revenue (paid)
    revenue_pipeline = [
        {"$match": {"payment_status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$total_price"}}},
    ]
    revenue_agg = await db.bookings.aggregate(revenue_pipeline).to_list(1)
    revenue = revenue_agg[0]["total"] if revenue_agg else 0

    # Average stay duration (nights)
    avg_pipeline = [
        {"$match": {"type": "property", "nights": {"$gt": 0}}},
        {"$group": {"_id": None, "avg": {"$avg": "$nights"}}},
    ]
    avg_agg = await db.bookings.aggregate(avg_pipeline).to_list(1)
    avg_stay = round(avg_agg[0]["avg"], 1) if avg_agg else 0

    # Bookings per day (last 14 days)
    since = datetime.now(timezone.utc) - timedelta(days=14)
    series_pipeline = [
        {"$match": {"created_at": {"$gte": since.isoformat()}}},
        {"$group": {"_id": {"$substr": ["$created_at", 0, 10]}, "count": {"$sum": 1}, "revenue": {"$sum": "$total_price"}}},
        {"$sort": {"_id": 1}},
    ]
    series = await db.bookings.aggregate(series_pipeline).to_list(50)
    chart_data = [{"date": s["_id"], "count": s["count"], "revenue": s["revenue"]} for s in series]

    # Top destinations (count + revenue)
    top_pipeline = [
        {"$match": {"type": "property"}},
        {"$lookup": {"from": "properties", "localField": "target_id", "foreignField": "id", "as": "prop"}},
        {"$unwind": "$prop"},
        {"$group": {"_id": "$prop.destination_slug", "count": {"$sum": 1}, "revenue": {"$sum": "$total_price"}}},
        {"$sort": {"count": -1}},
        {"$limit": 5},
    ]
    top = await db.bookings.aggregate(top_pipeline).to_list(10)
    top_destinations = [{"destination": t["_id"], "count": t["count"], "revenue": t["revenue"]} for t in top]

    # Top properties (by bookings)
    top_prop_pipeline = [
        {"$match": {"type": "property"}},
        {"$group": {"_id": "$target_id", "count": {"$sum": 1}, "revenue": {"$sum": "$total_price"}, "title": {"$first": "$target_title"}}},
        {"$sort": {"count": -1}},
        {"$limit": 5},
    ]
    top_props = await db.bookings.aggregate(top_prop_pipeline).to_list(10)
    top_properties = [{"id": p["_id"], "title": p["title"], "count": p["count"], "revenue": p["revenue"]} for p in top_props]

    # Top experiences
    top_exp_pipeline = [
        {"$match": {"type": "experience"}},
        {"$group": {"_id": "$target_id", "count": {"$sum": 1}, "revenue": {"$sum": "$total_price"}, "title": {"$first": "$target_title"}}},
        {"$sort": {"count": -1}},
        {"$limit": 5},
    ]
    top_exps = await db.bookings.aggregate(top_exp_pipeline).to_list(10)
    top_experiences = [{"id": e["_id"], "title": e["title"], "count": e["count"], "revenue": e["revenue"]} for e in top_exps]

    # Occupancy rate (last 30 days, properties only)
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    occupied_pipeline = [
        {"$match": {"type": "property", "status": {"$in": ["confirmed", "completed"]}, "created_at": {"$gte": thirty_days_ago.isoformat()}}},
        {"$group": {"_id": None, "total_nights": {"$sum": "$nights"}}},
    ]
    occ_agg = await db.bookings.aggregate(occupied_pipeline).to_list(1)
    booked_nights = occ_agg[0]["total_nights"] if occ_agg else 0
    available_capacity = max(total_properties * 30, 1)
    occupancy_rate = round((booked_nights / available_capacity) * 100, 1)

    # Pending revenue (confirmed but not paid)
    pending_rev_pipeline = [
        {"$match": {"status": "confirmed", "payment_status": {"$ne": "paid"}}},
        {"$group": {"_id": None, "total": {"$sum": "$total_price"}}},
    ]
    pr_agg = await db.bookings.aggregate(pending_rev_pipeline).to_list(1)
    pending_revenue = pr_agg[0]["total"] if pr_agg else 0

    return {
        "total_users": total_users,
        "total_travelers": total_travelers,
        "total_properties": total_properties,
        "total_experiences": total_experiences,
        "total_bookings": total_bookings,
        "pending_bookings": pending_bookings,
        "confirmed_bookings": confirmed_bookings,
        "paid_bookings": paid_bookings,
        "property_bookings": property_bookings,
        "experience_bookings": experience_bookings,
        "revenue": revenue,
        "pending_revenue": pending_revenue,
        "avg_stay": avg_stay,
        "occupancy_rate": occupancy_rate,
        "chart_data": chart_data,
        "top_destinations": top_destinations,
        "top_properties": top_properties,
        "top_experiences": top_experiences,
    }


@router.get("/users")
async def list_users(request: Request):
    await require_admin(request, db)
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(500)
    return [serialize_doc(u) for u in users]


@router.patch("/users/{user_id}")
async def update_user_role(user_id: str, payload: dict, request: Request):
    await require_admin(request, db)
    update = {}
    if "role" in payload and payload["role"] in ["TRAVELER", "ADMIN"]:
        update["role"] = payload["role"]
    if update:
        await db.users.update_one({"user_id": user_id}, {"$set": update})
    item = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return serialize_doc(item)


# ---------- Promo Codes ----------
@router.get("/promo-codes")
async def list_promo_codes(request: Request):
    await require_admin(request, db)
    items = await db.promo_codes.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [serialize_doc(i) for i in items]


@router.post("/promo-codes")
async def create_promo_code(payload: PromoCodeCreate, request: Request):
    await require_admin(request, db)
    code = payload.code.strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="Code requis")
    if not (1 <= payload.discount_percent <= 100):
        raise HTTPException(status_code=400, detail="La remise doit être entre 1 et 100%")
    existing = await db.promo_codes.find_one({"code": code})
    if existing:
        raise HTTPException(status_code=409, detail="Ce code existe déjà")
    doc = {
        "id": uuid.uuid4().hex[:16],
        "code": code,
        "discount_percent": payload.discount_percent,
        "valid_until": payload.valid_until,
        "is_active": payload.is_active,
        "used_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.promo_codes.insert_one(doc)
    doc.pop("_id", None)
    return serialize_doc(doc)


@router.patch("/promo-codes/{promo_id}")
async def update_promo_code(promo_id: str, payload: PromoCodeUpdate, request: Request):
    await require_admin(request, db)
    update = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if "discount_percent" in update and not (1 <= update["discount_percent"] <= 100):
        raise HTTPException(status_code=400, detail="La remise doit être entre 1 et 100%")
    if update:
        await db.promo_codes.update_one({"id": promo_id}, {"$set": update})
    item = await db.promo_codes.find_one({"id": promo_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Code promo introuvable")
    return serialize_doc(item)


@router.delete("/promo-codes/{promo_id}")
async def delete_promo_code(promo_id: str, request: Request):
    await require_admin(request, db)
    res = await db.promo_codes.delete_one({"id": promo_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Code promo introuvable")
    return {"ok": True}


# ---------- Manual trigger for the review-request email (testing) ----------
@router.post("/bookings/{booking_id}/send-review-email")
async def admin_send_review_email(booking_id: str, request: Request):
    await require_admin(request, db)
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Réservation introuvable")
    from scheduler import send_review_email_for_booking
    ok = await send_review_email_for_booking(booking)
    if not ok:
        raise HTTPException(status_code=400, detail="Email manquant sur la réservation")
    return {"ok": True}
