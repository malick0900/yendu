import os
import socket
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# Atlas M0 free clusters DO NOT accept IPv6 connections. Railway containers
# default to IPv6 outbound, which causes pymongo to fail the TLS handshake
# with TLSV1_ALERT_INTERNAL_ERROR (Atlas's L7 proxy aborts non-IPv4 sessions).
# Patch getaddrinfo to force IPv4-only lookups. No-op effect on localhost dev.
_orig_getaddrinfo = socket.getaddrinfo


def _ipv4_only_getaddrinfo(*args, **kwargs):
    results = _orig_getaddrinfo(*args, **kwargs)
    ipv4 = [r for r in results if r[0] == socket.AF_INET]
    return ipv4 or results  # fall back to any if no IPv4 (e.g. localhost ::1)


socket.getaddrinfo = _ipv4_only_getaddrinfo

mongo_url = os.environ["MONGO_URL"]
db_name = os.environ.get("DB_NAME", "teranga_stay")

# Atlas SRV URLs imply TLS — pin certifi's CA bundle to avoid system-CA
# issues in minimal containers. Plain `mongodb://` URLs (Railway internal,
# local dev) do NOT use TLS, so we must skip tlsCAFile or pymongo enables
# TLS implicitly and the handshake fails against a plaintext server.
_client_kwargs = {}
if mongo_url.startswith("mongodb+srv://") or "tls=true" in mongo_url or "ssl=true" in mongo_url:
    _client_kwargs["tlsCAFile"] = certifi.where()

client = AsyncIOMotorClient(mongo_url, **_client_kwargs)
db = client[db_name]


async def ensure_indexes():
    await db.users.create_index("user_id", unique=True)
    await db.users.create_index("email", unique=True)
    await db.user_sessions.create_index("session_token", unique=True)
    await db.user_sessions.create_index("user_id")
    await db.destinations.create_index("slug", unique=True)
    await db.destinations.create_index("id", unique=True)
    await db.properties.create_index("id", unique=True)
    await db.properties.create_index("destination_slug")
    await db.experiences.create_index("id", unique=True)
    await db.experiences.create_index("destination_slug")
    await db.experiences.create_index("category")
    await db.bookings.create_index("id", unique=True)
    await db.bookings.create_index("user_id")
    await db.reviews.create_index("id", unique=True)
    await db.reviews.create_index([("type", 1), ("target_id", 1)])
    await db.favorites.create_index("id", unique=True)
    await db.favorites.create_index([("user_id", 1), ("type", 1), ("target_id", 1)], unique=True)
