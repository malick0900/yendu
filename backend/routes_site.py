from fastapi import APIRouter, UploadFile, File, Request, HTTPException, Response
from datetime import datetime, timezone
from typing import List, Optional
from pydantic import BaseModel
import csv
import io
import uuid

from db import db
from auth_utils import require_admin, get_current_user, serialize_doc
import storage as st

router = APIRouter(prefix="/api", tags=["site"])

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}
MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB


# ---------- UPLOAD ----------
@router.post("/admin/upload")
async def upload_image(request: Request, file: UploadFile = File(...)):
    admin = await require_admin(request, db)
    if not st.is_available():
        # try lazy init
        st.init_storage()
        if not st.is_available():
            raise HTTPException(status_code=503, detail="Object storage indisponible")
    if "." not in (file.filename or ""):
        raise HTTPException(status_code=400, detail="Extension de fichier manquante")
    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Format non supporté: {ext}")
    data = await file.read()
    if len(data) > MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="Fichier trop volumineux (max 10MB)")
    content_type = file.content_type or st.MIME_TYPES.get(ext, "application/octet-stream")
    path = st.build_upload_path(admin["user_id"], ext)
    try:
        result = st.put_object(path, data, content_type)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Échec upload: {e}")
    file_id = uuid.uuid4().hex[:16]
    doc = {
        "id": file_id,
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": content_type,
        "size": result.get("size", len(data)),
        "uploaded_by": admin["user_id"],
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.files.insert_one(doc)
    doc.pop("_id", None)
    # Public URL = backend route
    backend_url = request.url_for("download_file", file_id=file_id).__str__() if False else f"/api/files/{file_id}"
    # Note: relative URL; frontend will prefix with REACT_APP_BACKEND_URL
    return {"id": file_id, "url": backend_url, "size": doc["size"], "content_type": content_type}


@router.get("/files/{file_id}", name="download_file")
async def download_file(file_id: str):
    record = await db.files.find_one({"id": file_id, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="Fichier introuvable")
    try:
        data, content_type = st.get_object(record["storage_path"])
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Échec lecture: {e}")
    headers = {"Cache-Control": "public, max-age=86400"}
    return Response(content=data, media_type=record.get("content_type", content_type), headers=headers)


@router.delete("/admin/files/{file_id}")
async def delete_file(file_id: str, request: Request):
    await require_admin(request, db)
    await db.files.update_one({"id": file_id}, {"$set": {"is_deleted": True}})
    return {"ok": True}


# ---------- SITE CONTENT (CMS) ----------
DEFAULT_SITE_CONTENT = {
    "hero_title": "Vivez une destination, pas seulement un séjour.",
    "hero_subtitle": "Hébergements premium et expériences locales, soigneusement sélectionnés pour vous faire ressentir la chaleur du Teranga.",
    "hero_badge": "Bienvenue au Sénégal",
    "hero_image": "https://images.unsplash.com/photo-1716997338016-93b456b3ea8f?w=2000&auto=format&fit=crop",
    "destinations_title": "Destinations vedettes",
    "destinations_subtitle": "Quatre joyaux du Sénégal à découvrir.",
    "properties_title": "Hébergements premium",
    "properties_subtitle": "Une sélection signée par notre équipe.",
    "experiences_title": "Expériences tendances",
    "experiences_subtitle": "Vivez la culture sénégalaise autrement.",
    "teranga_title": "L’hospitalité fait notre identité.",
    "teranga_text": "« Teranga », en wolof, signifie hospitalité. C’est cette valeur fondatrice que nous portons à chaque étape : du choix des hébergements aux expériences locales, en passant par l’équipe à votre service.",
    "teranga_image": "https://images.unsplash.com/photo-1545912452-8aea7e25a3d3?w=1400&auto=format&fit=crop",
    "testimonials_title": "Ils ont vécu Yendu",
    "testimonials": [
        {"name": "Camille L.", "city": "Paris", "text": "Une villa de rêve aux Almadies, des expériences vraiment immersives. Je reviens !", "img": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&auto=format&fit=crop", "rating": 5},
        {"name": "Mohamed K.", "city": "Casablanca", "text": "Le coucher de soleil yoga à Saly… indescriptible. Service au top de bout en bout.", "img": "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&auto=format&fit=crop", "rating": 5},
        {"name": "Sophie M.", "city": "Bruxelles", "text": "Saint-Louis hors saison c’est magique. La maison coloniale recommendée était parfaite.", "img": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop", "rating": 5},
    ],
    "about_title": "L’hospitalité, fil rouge de Yendu.",
    "about_kicker": "Notre histoire",
    "about_text": "Yendu est né d’une conviction : un voyage réussi est un voyage vécu. Notre mission est de connecter les voyageurs aux meilleures adresses du Sénégal — logements premium et expériences immersives — dans une plateforme exigeante sur la qualité et chaleureuse comme une journée à Saly.\n\nChaque hébergement et chaque expérience est sélectionné par notre équipe. Nous ne sommes pas une marketplace ouverte : nous publions, nous validons, nous vous accompagnons. C’est notre garantie d’un séjour sans accroc.\n\nVision : devenir la référence du voyage premium en Afrique de l’Ouest — à commencer par le Sénégal, terre de Teranga.",
    "contact_email": "contact@terangastay.sn",
    "contact_phone": "+221 33 800 00 00",
    "contact_address": "Almadies, Dakar, Sénégal",
    "faqs": [
        {"q": "Comment fonctionne le paiement ?", "a": "Pour le MVP, le paiement est confirmé manuellement par notre équipe Yendu après votre réservation. Nous vous contacterons pour finaliser la transaction."},
        {"q": "Puis-je annuler ma réservation ?", "a": "Oui, tant que la réservation est « en attente », contactez-nous pour l’annuler sans frais."},
        {"q": "Qui sélectionne les hébergements ?", "a": "Tous les hébergements et expériences sont sélectionnés par notre équipe. Yendu n’est pas une marketplace ouverte."},
        {"q": "Proposez-vous des voyages sur-mesure ?", "a": "Oui, contactez-nous via le formulaire et nous construirons votre séjour avec vous."},
        {"q": "Comment laisser un avis ?", "a": "Après confirmation de votre réservation, vous pouvez laisser un avis depuis votre tableau de bord."},
    ],
    "footer_tagline": "La plateforme africaine qui permet de vivre une destination, pas seulement d’y dormir.",
}


class SiteContentUpdate(BaseModel):
    content: dict


@router.get("/site/content")
async def get_site_content():
    doc = await db.site_content.find_one({"key": "main"}, {"_id": 0})
    if not doc:
        # seed with defaults
        await db.site_content.insert_one({"key": "main", "content": DEFAULT_SITE_CONTENT, "updated_at": datetime.now(timezone.utc).isoformat()})
        return DEFAULT_SITE_CONTENT
    content = doc.get("content", {})
    # merge with defaults to ensure new keys are present
    merged = {**DEFAULT_SITE_CONTENT, **content}
    return merged


@router.post("/admin/site/content/reset")
async def reset_site_content(request: Request):
    admin = await require_admin(request, db)
    await db.site_content.update_one(
        {"key": "main"},
        {"$set": {"content": DEFAULT_SITE_CONTENT, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    await _log_admin(admin, "reset_site_content", None)
    return DEFAULT_SITE_CONTENT


@router.patch("/admin/site/content")
async def update_site_content(payload: SiteContentUpdate, request: Request):
    admin = await require_admin(request, db)
    current = await db.site_content.find_one({"key": "main"}, {"_id": 0})
    new_content = {**(current.get("content") if current else DEFAULT_SITE_CONTENT), **payload.content}
    await db.site_content.update_one(
        {"key": "main"},
        {"$set": {"content": new_content, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    await _log_admin(admin, "update_site_content", {"keys": list(payload.content.keys())})
    return new_content


# ---------- ADMIN LOGS ----------
async def _log_admin(admin: dict, action: str, meta: Optional[dict] = None):
    try:
        await db.admin_logs.insert_one({
            "id": uuid.uuid4().hex[:16],
            "admin_id": admin.get("user_id"),
            "admin_email": admin.get("email"),
            "admin_name": admin.get("name"),
            "action": action,
            "meta": meta or {},
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    except Exception:
        pass


@router.get("/admin/logs")
async def list_admin_logs(request: Request, limit: int = 100):
    await require_admin(request, db)
    logs = await db.admin_logs.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return [serialize_doc(l) for l in logs]


# ---------- CSV EXPORTS ----------
def _csv_response(rows: List[dict], filename: str) -> Response:
    if not rows:
        return Response(content="", media_type="text/csv", headers={"Content-Disposition": f"attachment; filename={filename}"})
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=list(rows[0].keys()))
    writer.writeheader()
    for r in rows:
        writer.writerow({k: ("" if v is None else (",".join(map(str, v)) if isinstance(v, list) else v)) for k, v in r.items()})
    return Response(content=output.getvalue(), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename={filename}"})


@router.get("/admin/export/bookings.csv")
async def export_bookings(request: Request):
    admin = await require_admin(request, db)
    bookings = await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)
    rows = []
    for b in bookings:
        rows.append({
            "id": b.get("id"), "type": b.get("type"), "target_title": b.get("target_title"),
            "user_name": b.get("user_name"), "user_email": b.get("user_email"),
            "check_in": b.get("check_in"), "check_out": b.get("check_out"),
            "experience_date": b.get("experience_date"), "guests": b.get("guests"),
            "participants": b.get("participants"), "nights": b.get("nights"),
            "unit_price": b.get("unit_price"), "total_price": b.get("total_price"),
            "status": b.get("status"), "payment_status": b.get("payment_status"),
            "created_at": b.get("created_at"),
        })
    await _log_admin(admin, "export_bookings_csv", {"count": len(rows)})
    return _csv_response(rows, "teranga-bookings.csv")


@router.get("/admin/export/users.csv")
async def export_users(request: Request):
    admin = await require_admin(request, db)
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).sort("created_at", -1).to_list(2000)
    rows = [{"user_id": u.get("user_id"), "email": u.get("email"), "name": u.get("name"), "phone": u.get("phone"), "role": u.get("role"), "provider": u.get("provider"), "created_at": u.get("created_at")} for u in users]
    await _log_admin(admin, "export_users_csv", {"count": len(rows)})
    return _csv_response(rows, "teranga-users.csv")


# ---------- AVAILABILITY ----------
class AvailabilityBlock(BaseModel):
    property_id: str
    start_date: str  # YYYY-MM-DD
    end_date: str    # YYYY-MM-DD
    reason: Optional[str] = None


@router.get("/admin/properties/{prop_id}/availability")
async def list_availability(prop_id: str, request: Request):
    await require_admin(request, db)
    items = await db.availability_blocks.find({"property_id": prop_id}, {"_id": 0}).sort("start_date", 1).to_list(500)
    return [serialize_doc(i) for i in items]


@router.post("/admin/properties/{prop_id}/availability")
async def add_availability(prop_id: str, payload: AvailabilityBlock, request: Request):
    admin = await require_admin(request, db)
    doc = {
        "id": uuid.uuid4().hex[:16],
        "property_id": prop_id,
        "start_date": payload.start_date,
        "end_date": payload.end_date,
        "reason": payload.reason or "",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.availability_blocks.insert_one(doc)
    doc.pop("_id", None)
    await _log_admin(admin, "block_availability", {"property_id": prop_id, "start": payload.start_date, "end": payload.end_date})
    return serialize_doc(doc)


@router.delete("/admin/availability/{block_id}")
async def remove_availability(block_id: str, request: Request):
    admin = await require_admin(request, db)
    await db.availability_blocks.delete_one({"id": block_id})
    await _log_admin(admin, "unblock_availability", {"id": block_id})
    return {"ok": True}


@router.get("/properties/{prop_id}/availability")
async def public_availability(prop_id: str):
    items = await db.availability_blocks.find({"property_id": prop_id}, {"_id": 0, "id": 0}).to_list(500)
    # also include bookings as blocked
    bookings = await db.bookings.find({
        "type": "property", "target_id": prop_id, "status": {"$in": ["pending", "confirmed"]},
    }, {"_id": 0, "check_in": 1, "check_out": 1}).to_list(500)
    for b in bookings:
        if b.get("check_in") and b.get("check_out"):
            items.append({"start_date": b["check_in"], "end_date": b["check_out"], "reason": "Réservé"})
    return items


# ---------- NOTIFICATIONS (in-DB log; SMTP optional) ----------
import os, smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def _smtp_configured() -> bool:
    return bool(os.environ.get("SMTP_HOST")) and bool(os.environ.get("SMTP_USER"))


def _send_smtp(to_email: str, subject: str, html: str):
    host = os.environ.get("SMTP_HOST", "")
    port = int(os.environ.get("SMTP_PORT", "587"))
    user = os.environ.get("SMTP_USER", "")
    pwd = os.environ.get("SMTP_PASSWORD", "")
    sender = os.environ.get("MAIL_FROM", user)
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = sender
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html"))
    with smtplib.SMTP(host, port, timeout=20) as server:
        server.starttls()
        server.login(user, pwd)
        server.sendmail(sender, [to_email], msg.as_string())


async def enqueue_notification(to_email: str, subject: str, html: str, type_: str = "generic", meta: Optional[dict] = None):
    status = "queued"
    error: Optional[str] = None
    sent = False
    if _smtp_configured():
        try:
            _send_smtp(to_email, subject, html)
            status = "sent"; sent = True
        except Exception as e:
            status = "failed"; error = str(e)[:300]
    else:
        status = "log-only"
    doc = {
        "id": uuid.uuid4().hex[:16], "to": to_email, "subject": subject, "type": type_,
        "meta": meta or {}, "status": status, "error": error, "sent": sent,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.notifications.insert_one(doc)
    return status


@router.get("/admin/notifications")
async def list_notifications(request: Request, limit: int = 100):
    await require_admin(request, db)
    items = await db.notifications.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return [serialize_doc(i) for i in items]


@router.get("/admin/notifications/status")
async def notif_status(request: Request):
    await require_admin(request, db)
    return {"smtp_configured": _smtp_configured(), "from": os.environ.get("MAIL_FROM", "")}
