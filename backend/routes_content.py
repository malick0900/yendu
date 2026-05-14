from fastapi import APIRouter, HTTPException, Query, Request
from typing import Optional, List
from datetime import datetime, timezone

from db import db
from models import (
    Destination, DestinationCreate, DestinationUpdate,
    Property, PropertyCreate, PropertyUpdate,
    Experience, ExperienceCreate, ExperienceUpdate,
)
from auth_utils import require_admin, serialize_doc

router = APIRouter(prefix="/api", tags=["content"])


# ---------- DESTINATIONS ----------
@router.get("/destinations")
async def list_destinations():
    items = await db.destinations.find({}, {"_id": 0}).to_list(200)
    return [serialize_doc(i) for i in items]


@router.get("/destinations/{slug}")
async def get_destination(slug: str):
    item = await db.destinations.find_one({"slug": slug}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Destination introuvable")
    return serialize_doc(item)


@router.post("/admin/destinations")
async def create_destination(payload: DestinationCreate, request: Request):
    await require_admin(request, db)
    obj = Destination(**payload.model_dump())
    doc = obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.destinations.insert_one(doc)
    doc.pop("_id", None)  # Remove MongoDB ObjectId
    return serialize_doc(doc)


@router.patch("/admin/destinations/{dest_id}")
async def update_destination(dest_id: str, payload: DestinationUpdate, request: Request):
    await require_admin(request, db)
    update_data = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if update_data:
        await db.destinations.update_one({"id": dest_id}, {"$set": update_data})
    item = await db.destinations.find_one({"id": dest_id}, {"_id": 0})
    return serialize_doc(item)


@router.delete("/admin/destinations/{dest_id}")
async def delete_destination(dest_id: str, request: Request):
    await require_admin(request, db)
    await db.destinations.delete_one({"id": dest_id})
    return {"ok": True}


# ---------- PROPERTIES ----------
@router.get("/properties")
async def list_properties(
    destination: Optional[str] = None,
    city: Optional[str] = None,
    type: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    guests: Optional[int] = None,
    amenities: Optional[str] = None,  # comma-separated
    is_premium: Optional[bool] = None,
    sort: Optional[str] = "recent",
    limit: int = 60,
):
    query: dict = {"is_published": True}
    if destination:
        query["destination_slug"] = destination
    if city:
        query["city"] = city
    if type:
        query["type"] = type
    if guests:
        query["max_guests"] = {"$gte": guests}
    if is_premium is not None:
        query["is_premium"] = is_premium
    if min_price is not None or max_price is not None:
        price_q: dict = {}
        if min_price is not None:
            price_q["$gte"] = min_price
        if max_price is not None:
            price_q["$lte"] = max_price
        query["price_per_night"] = price_q
    if amenities:
        amen_list = [a.strip() for a in amenities.split(",") if a.strip()]
        if amen_list:
            query["amenities"] = {"$all": amen_list}

    cursor = db.properties.find(query, {"_id": 0})
    if sort == "price_asc":
        cursor = cursor.sort("price_per_night", 1)
    elif sort == "price_desc":
        cursor = cursor.sort("price_per_night", -1)
    elif sort == "rating":
        cursor = cursor.sort("rating_avg", -1)
    else:
        cursor = cursor.sort("created_at", -1)
    items = await cursor.to_list(limit)
    return [serialize_doc(i) for i in items]


@router.get("/properties/{prop_id}")
async def get_property(prop_id: str):
    item = await db.properties.find_one({"id": prop_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Hébergement introuvable")
    return serialize_doc(item)


@router.get("/admin/properties")
async def admin_list_properties(request: Request):
    await require_admin(request, db)
    items = await db.properties.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [serialize_doc(i) for i in items]


@router.post("/admin/properties")
async def create_property(payload: PropertyCreate, request: Request):
    await require_admin(request, db)
    obj = Property(**payload.model_dump())
    doc = obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.properties.insert_one(doc)
    doc.pop("_id", None)  # Remove MongoDB ObjectId
    return serialize_doc(doc)


@router.patch("/admin/properties/{prop_id}")
async def update_property(prop_id: str, payload: PropertyUpdate, request: Request):
    await require_admin(request, db)
    update_data = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if update_data:
        await db.properties.update_one({"id": prop_id}, {"$set": update_data})
    item = await db.properties.find_one({"id": prop_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Hébergement introuvable")
    return serialize_doc(item)


@router.delete("/admin/properties/{prop_id}")
async def delete_property(prop_id: str, request: Request):
    await require_admin(request, db)
    await db.properties.delete_one({"id": prop_id})
    return {"ok": True}


# ---------- EXPERIENCES ----------
@router.get("/experiences")
async def list_experiences(
    destination: Optional[str] = None,
    city: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    trending: Optional[bool] = None,
    sort: Optional[str] = "recent",
    limit: int = 60,
):
    query: dict = {"is_published": True}
    if destination:
        query["destination_slug"] = destination
    if city:
        query["city"] = city
    if category:
        query["category"] = category
    if trending is not None:
        query["is_trending"] = trending
    if min_price is not None or max_price is not None:
        price_q: dict = {}
        if min_price is not None:
            price_q["$gte"] = min_price
        if max_price is not None:
            price_q["$lte"] = max_price
        query["price"] = price_q

    cursor = db.experiences.find(query, {"_id": 0})
    if sort == "price_asc":
        cursor = cursor.sort("price", 1)
    elif sort == "price_desc":
        cursor = cursor.sort("price", -1)
    elif sort == "rating":
        cursor = cursor.sort("rating_avg", -1)
    else:
        cursor = cursor.sort("created_at", -1)
    items = await cursor.to_list(limit)
    return [serialize_doc(i) for i in items]


@router.get("/experiences/{exp_id}")
async def get_experience(exp_id: str):
    item = await db.experiences.find_one({"id": exp_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Expérience introuvable")
    return serialize_doc(item)


@router.get("/admin/experiences")
async def admin_list_experiences(request: Request):
    await require_admin(request, db)
    items = await db.experiences.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [serialize_doc(i) for i in items]


@router.post("/admin/experiences")
async def create_experience(payload: ExperienceCreate, request: Request):
    await require_admin(request, db)
    obj = Experience(**payload.model_dump())
    doc = obj.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.experiences.insert_one(doc)
    doc.pop("_id", None)  # Remove MongoDB ObjectId
    return serialize_doc(doc)


@router.patch("/admin/experiences/{exp_id}")
async def update_experience(exp_id: str, payload: ExperienceUpdate, request: Request):
    await require_admin(request, db)
    update_data = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if update_data:
        await db.experiences.update_one({"id": exp_id}, {"$set": update_data})
    item = await db.experiences.find_one({"id": exp_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Expérience introuvable")
    return serialize_doc(item)


@router.delete("/admin/experiences/{exp_id}")
async def delete_experience(exp_id: str, request: Request):
    await require_admin(request, db)
    await db.experiences.delete_one({"id": exp_id})
    return {"ok": True}
