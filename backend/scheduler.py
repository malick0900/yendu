"""Background scheduler — daily review-request emails.

Runs inside the FastAPI process (Railway long-running). For each booking
whose stay ended ~2 days ago and that has no review-email yet, send the
"how was your stay?" email and mark review_email_sent_at.
"""
import os
import logging
from datetime import datetime, timezone, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from db import db
from auth_utils import create_review_token

logger = logging.getLogger("yendu.scheduler")

DAYS_AFTER_STAY = int(os.environ.get("REVIEW_EMAIL_DELAY_DAYS", "2"))
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://yendu.vercel.app")
FROM_NAME = "Yendou"


def _review_email_html(target_title: str, target_image: str | None, review_url: str, traveler_name: str) -> str:
    img_html = ""
    if target_image and target_image.startswith("http"):
        img_html = f'<p><img src="{target_image}" alt="" style="max-width:100%;border-radius:12px"></p>'
    return f"""\
<!doctype html>
<html><body style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#1a1a1a">
  <h1 style="font-size:24px;margin:0 0 8px">Bonjour {traveler_name},</h1>
  <p style="font-size:16px;line-height:1.5">Comment s'est passé votre expérience avec <strong>{target_title}</strong> ?</p>
  {img_html}
  <p style="font-size:16px;line-height:1.5">Votre avis aide les futurs voyageurs à choisir leur prochain séjour. Cela ne prend qu'une minute.</p>
  <p style="text-align:center;margin:32px 0">
    <a href="{review_url}" style="display:inline-block;background:#c25533;color:#fff;padding:14px 28px;border-radius:999px;text-decoration:none;font-weight:600">Laisser un avis</a>
  </p>
  <p style="font-size:12px;color:#888">Si le bouton ne fonctionne pas, copiez ce lien :<br><span style="word-break:break-all">{review_url}</span></p>
  <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
  <p style="font-size:12px;color:#888;text-align:center">— L'équipe Yendou</p>
</body></html>
"""


async def _candidate_bookings():
    """Bookings whose stay ended exactly DAYS_AFTER_STAY days ago, without a review email yet."""
    target_date = (datetime.now(timezone.utc).date() - timedelta(days=DAYS_AFTER_STAY)).isoformat()

    # For properties: check_out == target_date
    # For experiences: experience_date == target_date
    query = {
        "status": {"$in": ["confirmed", "completed"]},
        "review_email_sent_at": {"$in": [None, ""]},
        "$or": [
            {"type": "property", "check_out": target_date},
            {"type": "experience", "experience_date": target_date},
        ],
    }
    return await db.bookings.find(query, {"_id": 0}).to_list(500)


async def send_review_email_for_booking(booking: dict) -> bool:
    """Send the post-stay review email for a single booking. Returns True if sent."""
    # Late import to avoid circular import (routes_site -> scheduler -> routes_site)
    from routes_site import enqueue_notification

    email = booking.get("user_email")
    if not email:
        return False
    token = create_review_token(booking["id"])
    review_url = f"{FRONTEND_URL.rstrip('/')}/review?token={token}"
    html = _review_email_html(
        target_title=booking.get("target_title", ""),
        target_image=booking.get("target_image"),
        review_url=review_url,
        traveler_name=booking.get("user_name", "voyageur"),
    )
    subject = "Comment s'est passé votre séjour avec Yendou ?"
    await enqueue_notification(email, subject, html, type_="review_request", meta={"booking_id": booking["id"]})
    await db.bookings.update_one(
        {"id": booking["id"]},
        {"$set": {"review_email_sent_at": datetime.now(timezone.utc).isoformat()}},
    )
    return True


async def run_review_email_job():
    """The daily job entry point."""
    try:
        candidates = await _candidate_bookings()
    except Exception as e:
        logger.error(f"review_email_job: failed to query candidates: {e}")
        return
    sent = 0
    for b in candidates:
        try:
            ok = await send_review_email_for_booking(b)
            if ok:
                sent += 1
        except Exception as e:
            logger.error(f"review_email_job: failed for booking {b.get('id')}: {e}")
    if sent:
        logger.info(f"review_email_job: sent {sent} review request(s)")


_scheduler: AsyncIOScheduler | None = None


def start_scheduler():
    global _scheduler
    if _scheduler is not None:
        return _scheduler
    _scheduler = AsyncIOScheduler(timezone="UTC")
    # Daily at 10:00 UTC (noon CET, ~10:00 GMT/UTC Senegal). Adjust as needed.
    _scheduler.add_job(run_review_email_job, "cron", hour=10, minute=0, id="review_email_job", replace_existing=True)
    _scheduler.start()
    logger.info("Scheduler started — review email job at 10:00 UTC daily")
    return _scheduler


def shutdown_scheduler():
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
