"""Branded HTML email templates for Yendou transactional emails.

Centralises the markup shared by booking emails (creation, confirmation,
cancellation, payment) and the post-stay review email. Stdlib only.
"""
import os
from html import escape

FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://yendou.sn").rstrip("/")
LOGO_URL = f"{FRONTEND_URL}/assets/yendou-logo.png"

BRAND_GREEN = "#0c3d2e"
BRAND_ORANGE = "#c25533"
INK = "#1a1a1a"
MUTED = "#8a8a8a"


def _fmt_xof(n) -> str:
    """Format an integer amount as a fr-FR amount, e.g. "12 345 FCFA" (NBSP groups)."""
    nbsp = " "
    try:
        return f"{int(n):,}".replace(",", nbsp) + nbsp + "FCFA"
    except (TypeError, ValueError):
        return "—"


def _fmt_date(iso) -> str:
    """ISO date 'YYYY-MM-DD' (or datetime) -> 'JJ/MM/AAAA'. Best-effort."""
    if not iso:
        return ""
    s = str(iso)[:10]
    parts = s.split("-")
    if len(parts) == 3:
        return f"{parts[2]}/{parts[1]}/{parts[0]}"
    return s


def email_layout(body_html: str, *, preheader: str | None = None) -> str:
    """Wrap inner HTML in the shared branded email shell (logo + footer)."""
    pre = (
        f'<span style="display:none;max-height:0;overflow:hidden;opacity:0">{escape(preheader)}</span>'
        if preheader
        else ""
    )
    return f"""\
<!doctype html>
<html lang="fr"><body style="margin:0;background:#f4f1ec;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:{INK}">
{pre}
<div style="max-width:560px;margin:0 auto;padding:24px">
  <div style="text-align:center;padding:8px 0 16px">
    <a href="{FRONTEND_URL}" style="text-decoration:none">
      <img src="{LOGO_URL}" alt="Yendou" style="height:48px;width:auto">
    </a>
  </div>
  <div style="background:#ffffff;border-radius:16px;padding:28px 24px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
    {body_html}
  </div>
  <p style="text-align:center;font-size:12px;color:{MUTED};margin:20px 0 4px">
    Yendou — L'expérience de la qualité.<br>
    <a href="{FRONTEND_URL}" style="color:{MUTED}">yendou.sn</a>
  </p>
</div>
</body></html>
"""


CHECKIN_TIME = "15h00"
CHECKOUT_TIME = "12h00"

_TYPE_LABELS = {
    "villa": "Villa", "apartment": "Appartement", "riad": "Riad",
    "guesthouse": "Maison d'hôtes", "suite": "Suite",
}
_CATEGORY_LABELS = {
    "culture": "Culture", "gastronomie": "Gastronomie", "aventure": "Aventure",
    "nightlife": "Nightlife", "lifestyle": "Lifestyle",
}
# label -> (text colour, background colour)
_STATUS_LABELS = {
    "pending": ("En attente", "#b97914", "#fcefd6"),
    "confirmed": ("Confirmée", "#0c7a4b", "#d8f3e6"),
    "cancelled": ("Annulée", "#b3261e", "#fbe3e1"),
    "completed": ("Terminée", "#3a6ea5", "#e2edf8"),
}
_PAY_LABELS = {
    "pending": ("Paiement en attente", "#b97914", "#fcefd6"),
    "paid": ("Payé", "#0c7a4b", "#d8f3e6"),
    "refunded": ("Remboursé", "#3a6ea5", "#e2edf8"),
}


def _row(label: str, value: str) -> str:
    return (
        f'<tr><td style="padding:6px 0;color:{MUTED};font-size:14px;vertical-align:top">{escape(label)}</td>'
        f'<td style="padding:6px 0 6px 14px;text-align:right;font-size:14px;font-weight:600">{value}</td></tr>'
    )


def _badge(text: str, fg: str, bg: str) -> str:
    return (
        f'<span style="display:inline-block;padding:3px 10px;border-radius:999px;'
        f'background:{bg};color:{fg};font-size:12px;font-weight:700">{escape(text)}</span>'
    )


def _booking_ref(booking: dict) -> str:
    raw = str(booking.get("id", ""))[:8].upper()
    return f"YEN-{raw}" if raw else "—"


def _card(title: str, rows_html: str) -> str:
    if not rows_html:
        return ""
    return (
        f'<div style="margin-top:18px">'
        f'<p style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;'
        f'color:{MUTED};font-weight:700;margin:0 0 6px">{escape(title)}</p>'
        f'<table role="presentation" width="100%" cellpadding="0" cellspacing="0" '
        f'style="border-collapse:collapse">{rows_html}</table></div>'
    )


def _section_reference(booking: dict) -> str:
    rows = _row("Référence", _booking_ref(booking))
    if booking.get("created_at"):
        rows += _row("Date de réservation", _fmt_date(booking["created_at"]))
    badges = ""
    sl = _STATUS_LABELS.get(booking.get("status"))
    if sl:
        badges += _badge(*sl) + " "
    pl = _PAY_LABELS.get(booking.get("payment_status"))
    if pl:
        badges += _badge(*pl)
    if badges:
        rows += _row("Statut", badges.strip())
    return _card("Réservation", rows)


def _section_listing(booking: dict, listing: dict | None) -> str:
    img = booking.get("target_image") or ""
    img_html = ""
    if isinstance(img, str) and img.startswith("http"):
        img_html = (
            f'<img src="{img}" alt="" style="width:100%;max-height:220px;'
            'object-fit:cover;border-radius:12px;margin:18px 0 0">'
        )
    title = escape(booking.get("target_title", ""))
    rows = f'<tr><td colspan="2"><p style="font-size:16px;font-weight:700;margin:0 0 4px;color:{INK}">{title}</p></td></tr>'
    listing = listing or {}
    if booking.get("type") == "experience":
        cat = _CATEGORY_LABELS.get(listing.get("category"), listing.get("category"))
        if cat:
            rows += _row("Catégorie", escape(str(cat)))
        if listing.get("city"):
            rows += _row("Ville", escape(listing["city"]))
        if listing.get("duration_hours"):
            rows += _row("Durée", f"{listing['duration_hours']:g} h")
        if listing.get("meeting_point"):
            rows += _row("Point de rencontre", escape(listing["meeting_point"]))
        if listing.get("host_name"):
            rows += _row("Hôte", escape(listing["host_name"]))
        inc = listing.get("included") or []
        if inc:
            rows += _row("Inclus", escape(", ".join(inc[:6])))
        title_card = "Votre expérience"
    else:
        tp = _TYPE_LABELS.get(listing.get("type"), listing.get("type"))
        if tp:
            rows += _row("Type", escape(str(tp)))
        addr = ", ".join(p for p in [listing.get("address"), listing.get("city")] if p)
        if addr:
            rows += _row("Adresse", escape(addr))
        cap = []
        if listing.get("bedrooms"):
            cap.append(f"{listing['bedrooms']} ch.")
        if listing.get("beds"):
            cap.append(f"{listing['beds']} lit(s)")
        if listing.get("bathrooms"):
            cap.append(f"{listing['bathrooms']} sdb")
        if cap:
            rows += _row("Logement", " · ".join(cap))
        am = listing.get("amenities") or []
        if am:
            rows += _row("Équipements", escape(", ".join(am[:6])))
        lat, lng = listing.get("lat"), listing.get("lng")
        if lat is not None and lng is not None:
            link = f"https://www.google.com/maps/search/?api=1&query={lat},{lng}"
            rows += _row("Localisation", f'<a href="{link}" style="color:{BRAND_ORANGE}">Voir sur la carte</a>')
        title_card = "Votre hébergement"
    return img_html + _card(title_card, rows)


def _section_dates(booking: dict) -> str:
    rows = ""
    if booking.get("type") == "experience":
        if booking.get("experience_date"):
            rows += _row("Date", _fmt_date(booking["experience_date"]))
        if booking.get("participants"):
            rows += _row("Participants", str(booking["participants"]))
        return _card("Détails", rows)
    if booking.get("check_in"):
        rows += _row("Arrivée", f'{_fmt_date(booking["check_in"])} · dès {CHECKIN_TIME}')
    if booking.get("check_out"):
        rows += _row("Départ", f'{_fmt_date(booking["check_out"])} · avant {CHECKOUT_TIME}')
    if booking.get("nights"):
        n = booking["nights"]
        rows += _row("Durée", f"{n} nuit{'s' if n > 1 else ''}")
    if booking.get("guests"):
        rows += _row("Voyageurs", str(booking["guests"]))
    return _card("Séjour", rows)


def _section_guest(booking: dict) -> str:
    rows = _row("Nom", escape(booking.get("user_name", "—")))
    if booking.get("user_email"):
        rows += _row("Email", escape(booking["user_email"]))
    if booking.get("user_phone"):
        rows += _row("Téléphone", escape(str(booking["user_phone"])))
    return _card("Voyageur", rows)


def _section_price(booking: dict) -> str:
    rows = ""
    unit = booking.get("unit_price")
    if unit:
        if booking.get("type") == "experience":
            qty = booking.get("participants") or 1
            rows += _row(f"{_fmt_xof(unit)} × {qty} pers.", _fmt_xof(unit * qty))
        else:
            qty = booking.get("nights") or 1
            rows += _row(f"{_fmt_xof(unit)} × {qty} nuit(s)", _fmt_xof(unit * qty))
    if booking.get("discount_amount"):
        code = booking.get("promo_code")
        label = f"Remise ({code})" if code else "Remise"
        rows += _row(label, "-" + _fmt_xof(booking["discount_amount"]))
    rows += (
        f'<tr><td style="padding:12px 0 0;border-top:1px solid #eee;font-size:15px;font-weight:700">Total</td>'
        f'<td style="padding:12px 0 0 14px;border-top:1px solid #eee;text-align:right;font-size:16px;'
        f'font-weight:800;color:{BRAND_GREEN}">{_fmt_xof(booking.get("total_price"))}</td></tr>'
    )
    pl = _PAY_LABELS.get(booking.get("payment_status"))
    if pl:
        rows += _row("Paiement", _badge(*pl))
    return _card("Tarif", rows)


def _section_notes(booking: dict) -> str:
    notes = (booking.get("notes") or "").strip()
    if not notes:
        return ""
    body = escape(notes).replace("\n", "<br>")
    return (
        f'<div style="margin-top:18px">'
        f'<p style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;'
        f'color:{MUTED};font-weight:700;margin:0 0 6px">Demandes spéciales</p>'
        f'<div style="background:#f6f6f4;border-radius:10px;padding:12px;font-size:14px;line-height:1.5">{body}</div></div>'
    )


def _section_assistance(contact: dict | None) -> str:
    contact = contact or {}
    rows = ""
    if contact.get("email"):
        rows += _row("Email", escape(contact["email"]))
    if contact.get("phone"):
        rows += _row("Téléphone", escape(contact["phone"]))
    if contact.get("address"):
        rows += _row("Adresse", escape(contact["address"]))
    return _card("Besoin d'aide ?", rows)


def _booking_summary(booking: dict, listing: dict | None, contact: dict | None,
                     *, with_assistance: bool = True) -> str:
    parts = [
        _section_listing(booking, listing),
        _section_reference(booking),
        _section_dates(booking),
        _section_guest(booking),
        _section_price(booking),
        _section_notes(booking),
    ]
    if with_assistance:
        parts.append(_section_assistance(contact))
    return "".join(p for p in parts if p)


# Backwards-compatible alias (price/dates recap without the listing context).
def booking_details_table(booking: dict) -> str:
    return _booking_summary(booking, None, None, with_assistance=False)


def _greeting(name: str | None) -> str:
    return escape(name or "voyageur")


# ---------- CLIENT EMAILS ----------

def booking_received(booking: dict, *, listing: dict | None = None, contact: dict | None = None) -> tuple[str, str]:
    title = escape(booking.get("target_title", "votre réservation"))
    body = f"""\
<h1 style="font-size:22px;margin:0 0 8px;color:{BRAND_GREEN}">Merci, {_greeting(booking.get('user_name'))} !</h1>
<p style="font-size:15px;line-height:1.6;margin:0 0 4px">
  Nous avons bien reçu votre demande de réservation pour <strong>{title}</strong>.
  Notre équipe revient vers vous très vite pour la confirmer.
</p>
{_booking_summary(booking, listing, contact)}
"""
    return "Votre demande de réservation Yendou", email_layout(
        body, preheader=f"Demande reçue pour {booking.get('target_title', '')}"
    )


def booking_confirmed(booking: dict, *, listing: dict | None = None, contact: dict | None = None) -> tuple[str, str]:
    title = escape(booking.get("target_title", "votre réservation"))
    body = f"""\
<h1 style="font-size:22px;margin:0 0 8px;color:{BRAND_GREEN}">Réservation confirmée 🎉</h1>
<p style="font-size:15px;line-height:1.6;margin:0 0 4px">
  Bonne nouvelle, {_greeting(booking.get('user_name'))} ! Votre réservation pour
  <strong>{title}</strong> est <strong>confirmée</strong>. Nous avons hâte de vous accueillir.
</p>
{_booking_summary(booking, listing, contact)}
<p style="text-align:center;margin:24px 0 4px">
  <a href="{FRONTEND_URL}/dashboard" style="display:inline-block;background:{BRAND_ORANGE};color:#fff;
     padding:13px 26px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px">
     Voir ma réservation</a>
</p>
"""
    return "Votre réservation est confirmée 🎉", email_layout(
        body, preheader=f"{booking.get('target_title', '')} — confirmée"
    )


def booking_cancelled(booking: dict, *, listing: dict | None = None, contact: dict | None = None) -> tuple[str, str]:
    title = escape(booking.get("target_title", "votre réservation"))
    body = f"""\
<h1 style="font-size:22px;margin:0 0 8px;color:{BRAND_GREEN}">Réservation annulée</h1>
<p style="font-size:15px;line-height:1.6;margin:0 0 4px">
  Bonjour {_greeting(booking.get('user_name'))}, votre réservation pour <strong>{title}</strong>
  a été annulée. Si vous pensez qu'il s'agit d'une erreur, contactez-nous en répondant à cet email.
</p>
{_booking_summary(booking, listing, contact)}
"""
    return "Votre réservation a été annulée", email_layout(body)


def payment_received(booking: dict, *, listing: dict | None = None, contact: dict | None = None) -> tuple[str, str]:
    title = escape(booking.get("target_title", "votre réservation"))
    body = f"""\
<h1 style="font-size:22px;margin:0 0 8px;color:{BRAND_GREEN}">Paiement reçu — merci !</h1>
<p style="font-size:15px;line-height:1.6;margin:0 0 4px">
  Nous confirmons la bonne réception de votre paiement pour <strong>{title}</strong>.
  Tout est en ordre, {_greeting(booking.get('user_name'))} !
</p>
{_booking_summary(booking, listing, contact)}
"""
    return "Paiement reçu — Merci !", email_layout(body)


# ---------- ADMIN EMAIL ----------

def admin_new_booking(booking: dict, *, listing: dict | None = None, contact: dict | None = None) -> tuple[str, str]:
    title = escape(booking.get("target_title", ""))
    name = escape(booking.get("user_name", ""))
    mail = escape(booking.get("user_email", ""))
    body = f"""\
<h1 style="font-size:20px;margin:0 0 8px;color:{BRAND_GREEN}">Nouvelle réservation</h1>
<p style="font-size:15px;line-height:1.6;margin:0 0 4px">
  <strong>{name}</strong> ({mail}) vient de réserver <strong>{title}</strong>.
</p>
{_booking_summary(booking, listing, None, with_assistance=False)}
<p style="text-align:center;margin:24px 0 4px">
  <a href="{FRONTEND_URL}/admin/bookings" style="display:inline-block;background:{BRAND_GREEN};color:#fff;
     padding:13px 26px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px">
     Gérer dans l'admin</a>
</p>
"""
    return f"[Yendou] Nouvelle réservation — {booking.get('target_title', '')}", email_layout(
        body, preheader=f"{name} a réservé {booking.get('target_title', '')}"
    )


# ---------- REVIEW EMAIL (used by scheduler) ----------

def review_request(target_title: str, target_image: str | None, review_url: str, traveler_name: str) -> str:
    img_html = ""
    if target_image and str(target_image).startswith("http"):
        img_html = (
            f'<img src="{target_image}" alt="" style="width:100%;max-height:220px;'
            'object-fit:cover;border-radius:12px;margin:0 0 16px">'
        )
    body = f"""\
<h1 style="font-size:22px;margin:0 0 8px;color:{BRAND_GREEN}">Bonjour {escape(traveler_name or 'voyageur')},</h1>
<p style="font-size:15px;line-height:1.6;margin:0 0 16px">
  Comment s'est passé votre expérience avec <strong>{escape(target_title or '')}</strong> ?
</p>
{img_html}
<p style="font-size:15px;line-height:1.6;margin:0 0 8px">
  Votre avis aide les futurs voyageurs à choisir. Cela ne prend qu'une minute.
</p>
<p style="text-align:center;margin:28px 0 8px">
  <a href="{review_url}" style="display:inline-block;background:{BRAND_ORANGE};color:#fff;
     padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:600">Laisser un avis</a>
</p>
<p style="font-size:12px;color:{MUTED}">Si le bouton ne fonctionne pas, copiez ce lien :<br>
  <span style="word-break:break-all">{review_url}</span></p>
"""
    return email_layout(body, preheader="Partagez votre avis sur votre séjour")
