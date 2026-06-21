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


def _row(label: str, value: str) -> str:
    return (
        f'<tr><td style="padding:6px 0;color:{MUTED};font-size:14px">{escape(label)}</td>'
        f'<td style="padding:6px 0;text-align:right;font-size:14px;font-weight:600">{value}</td></tr>'
    )


def booking_details_table(booking: dict) -> str:
    """Recap block: image + dates/participants + price breakdown."""
    img = booking.get("target_image") or ""
    img_html = ""
    if isinstance(img, str) and img.startswith("http"):
        img_html = (
            f'<img src="{img}" alt="" style="width:100%;max-height:220px;'
            'object-fit:cover;border-radius:12px;margin-bottom:16px">'
        )

    rows = []
    if booking.get("type") == "experience":
        if booking.get("experience_date"):
            rows.append(_row("Date", _fmt_date(booking["experience_date"])))
        if booking.get("participants"):
            rows.append(_row("Participants", str(booking["participants"])))
    else:
        if booking.get("check_in"):
            rows.append(_row("Arrivée", _fmt_date(booking["check_in"])))
        if booking.get("check_out"):
            rows.append(_row("Départ", _fmt_date(booking["check_out"])))
        if booking.get("nights"):
            n = booking["nights"]
            rows.append(_row("Nuits", f"{n} nuit{'s' if n > 1 else ''}"))
        if booking.get("guests"):
            rows.append(_row("Voyageurs", str(booking["guests"])))

    if booking.get("unit_price"):
        rows.append(_row("Prix unitaire", _fmt_xof(booking["unit_price"])))
    if booking.get("discount_amount"):
        code = booking.get("promo_code")
        label = f"Remise ({code})" if code else "Remise"
        rows.append(_row(label, "-" + _fmt_xof(booking["discount_amount"])))

    total_row = (
        f'<tr><td style="padding:12px 0 0;border-top:1px solid #eee;font-size:15px;font-weight:700">Total</td>'
        f'<td style="padding:12px 0 0;border-top:1px solid #eee;text-align:right;font-size:16px;'
        f'font-weight:800;color:{BRAND_GREEN}">{_fmt_xof(booking.get("total_price"))}</td></tr>'
    )

    return f"""\
{img_html}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
  {''.join(rows)}
  {total_row}
</table>
"""


def _greeting(name: str | None) -> str:
    return escape(name or "voyageur")


# ---------- CLIENT EMAILS ----------

def booking_received(booking: dict) -> tuple[str, str]:
    title = escape(booking.get("target_title", "votre réservation"))
    body = f"""\
<h1 style="font-size:22px;margin:0 0 8px;color:{BRAND_GREEN}">Merci, {_greeting(booking.get('user_name'))} !</h1>
<p style="font-size:15px;line-height:1.6;margin:0 0 18px">
  Nous avons bien reçu votre demande de réservation pour <strong>{title}</strong>.
  Notre équipe revient vers vous très vite pour la confirmer.
</p>
{booking_details_table(booking)}
<p style="font-size:13px;color:{MUTED};margin:18px 0 0">
  Une question ? Répondez simplement à cet email.
</p>
"""
    return "Votre demande de réservation Yendou", email_layout(
        body, preheader=f"Demande reçue pour {booking.get('target_title', '')}"
    )


def booking_confirmed(booking: dict) -> tuple[str, str]:
    title = escape(booking.get("target_title", "votre réservation"))
    body = f"""\
<h1 style="font-size:22px;margin:0 0 8px;color:{BRAND_GREEN}">Réservation confirmée 🎉</h1>
<p style="font-size:15px;line-height:1.6;margin:0 0 18px">
  Bonne nouvelle, {_greeting(booking.get('user_name'))} ! Votre réservation pour
  <strong>{title}</strong> est <strong>confirmée</strong>. Nous avons hâte de vous accueillir.
</p>
{booking_details_table(booking)}
<p style="text-align:center;margin:24px 0 4px">
  <a href="{FRONTEND_URL}/dashboard" style="display:inline-block;background:{BRAND_ORANGE};color:#fff;
     padding:13px 26px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px">
     Voir ma réservation</a>
</p>
"""
    return "Votre réservation est confirmée 🎉", email_layout(
        body, preheader=f"{booking.get('target_title', '')} — confirmée"
    )


def booking_cancelled(booking: dict) -> tuple[str, str]:
    title = escape(booking.get("target_title", "votre réservation"))
    body = f"""\
<h1 style="font-size:22px;margin:0 0 8px;color:{BRAND_GREEN}">Réservation annulée</h1>
<p style="font-size:15px;line-height:1.6;margin:0 0 18px">
  Bonjour {_greeting(booking.get('user_name'))}, votre réservation pour <strong>{title}</strong>
  a été annulée. Si vous pensez qu'il s'agit d'une erreur, contactez-nous en répondant à cet email.
</p>
{booking_details_table(booking)}
"""
    return "Votre réservation a été annulée", email_layout(body)


def payment_received(booking: dict) -> tuple[str, str]:
    title = escape(booking.get("target_title", "votre réservation"))
    body = f"""\
<h1 style="font-size:22px;margin:0 0 8px;color:{BRAND_GREEN}">Paiement reçu — merci !</h1>
<p style="font-size:15px;line-height:1.6;margin:0 0 18px">
  Nous confirmons la bonne réception de votre paiement pour <strong>{title}</strong>.
  Tout est en ordre, {_greeting(booking.get('user_name'))} !
</p>
{booking_details_table(booking)}
"""
    return "Paiement reçu — Merci !", email_layout(body)


# ---------- ADMIN EMAIL ----------

def admin_new_booking(booking: dict) -> tuple[str, str]:
    title = escape(booking.get("target_title", ""))
    name = escape(booking.get("user_name", ""))
    mail = escape(booking.get("user_email", ""))
    body = f"""\
<h1 style="font-size:20px;margin:0 0 8px;color:{BRAND_GREEN}">Nouvelle réservation</h1>
<p style="font-size:15px;line-height:1.6;margin:0 0 18px">
  <strong>{name}</strong> ({mail}) vient de réserver <strong>{title}</strong>.
</p>
{booking_details_table(booking)}
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
