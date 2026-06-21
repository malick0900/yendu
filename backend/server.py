from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import os
import logging

from db import client, ensure_indexes
from routes_auth import router as auth_router
from routes_content import router as content_router
from routes_bookings import router as bookings_router
from routes_admin import router as admin_router
from routes_site import router as site_router
import storage as st

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("teranga")

app = FastAPI(title="Yendou API", version="1.0")


@app.get("/api/")
async def root():
    return {"message": "Yendou API", "status": "ok"}


@app.get("/api/health")
async def health():
    return {"status": "healthy"}


app.include_router(auth_router)
app.include_router(content_router)
app.include_router(bookings_router)
app.include_router(admin_router)
app.include_router(site_router)

# CORS - allow_credentials requires explicit origins (not *)
origins_env = os.environ.get("CORS_ORIGINS", "*")
if origins_env.strip() == "*":
    # When using credentials we must echo back the origin; use regex to match any
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=".*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[o.strip() for o in origins_env.split(",") if o.strip()],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.on_event("startup")
async def on_startup():
    try:
        await ensure_indexes()
        logger.info("MongoDB indexes ensured.")
    except Exception as e:
        logger.error(f"Index ensure failed: {e}")

    # Init object storage
    try:
        st.init_storage()
    except Exception as e:
        logger.error(f"Storage init failed: {e}")

    # Auto-seed if empty
    try:
        from db import db as _db
        count = await _db.properties.count_documents({})
        if count == 0:
            logger.info("Empty DB detected — running seed...")
            from seed import seed
            await seed()
            logger.info("Seed complete.")
    except Exception as e:
        logger.error(f"Seed failed: {e}")

    # Background scheduler (daily review-request emails)
    try:
        from scheduler import start_scheduler
        start_scheduler()
    except Exception as e:
        logger.error(f"Scheduler start failed: {e}")


@app.on_event("shutdown")
async def on_shutdown():
    try:
        from scheduler import shutdown_scheduler
        shutdown_scheduler()
    except Exception:
        pass
    client.close()
