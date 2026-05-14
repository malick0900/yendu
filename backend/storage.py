"""Object storage wrapper — Cloudflare R2 (S3-compatible) via boto3.

Env vars:
  R2_ACCOUNT_ID       Cloudflare account id
  R2_BUCKET           bucket name
  R2_ACCESS_KEY_ID    R2 token access key
  R2_SECRET_ACCESS_KEY
  R2_ENDPOINT         optional override; defaults to https://<account>.r2.cloudflarestorage.com
  APP_NAME            prefix for object keys (default: teranga-stay)

Falls back to AWS S3 if R2_* env vars absent and AWS_* are present (boto3 picks them up).
"""
import os
import uuid
import logging
from typing import Tuple

import boto3
from botocore.client import Config
from botocore.exceptions import BotoCoreError, ClientError

logger = logging.getLogger("teranga.storage")

APP_NAME = os.environ.get("APP_NAME", "teranga-stay")

MIME_TYPES = {
    "jpg": "image/jpeg", "jpeg": "image/jpeg", "png": "image/png",
    "gif": "image/gif", "webp": "image/webp",
}

_client = None
_bucket = None
_available = False


def _build_client():
    account_id = os.environ.get("R2_ACCOUNT_ID")
    bucket = os.environ.get("R2_BUCKET")
    key_id = os.environ.get("R2_ACCESS_KEY_ID")
    secret = os.environ.get("R2_SECRET_ACCESS_KEY")
    endpoint = os.environ.get("R2_ENDPOINT")

    if not bucket:
        logger.warning("R2_BUCKET missing; storage disabled.")
        return None, None

    if account_id and key_id and secret:
        endpoint = endpoint or f"https://{account_id}.r2.cloudflarestorage.com"
        client = boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=key_id,
            aws_secret_access_key=secret,
            region_name="auto",
            config=Config(signature_version="s3v4"),
        )
        return client, bucket

    if os.environ.get("AWS_ACCESS_KEY_ID") and os.environ.get("AWS_SECRET_ACCESS_KEY"):
        client = boto3.client("s3", region_name=os.environ.get("AWS_REGION", "eu-west-1"))
        return client, bucket

    logger.warning("No R2 or AWS credentials; storage disabled.")
    return None, None


def init_storage() -> str:
    global _client, _bucket, _available
    if _client is not None:
        return "ok" if _available else ""
    client, bucket = _build_client()
    _client = client
    _bucket = bucket
    _available = client is not None and bucket is not None
    if _available:
        logger.info(f"Storage initialised: bucket={bucket}")
    return "ok" if _available else ""


def is_available() -> bool:
    return _available


def put_object(path: str, data: bytes, content_type: str) -> dict:
    if not init_storage():
        raise RuntimeError("Storage unavailable")
    try:
        _client.put_object(
            Bucket=_bucket,
            Key=path,
            Body=data,
            ContentType=content_type,
            CacheControl="public, max-age=86400",
        )
    except (BotoCoreError, ClientError) as e:
        raise RuntimeError(f"R2 put failed: {e}") from e
    return {"path": path, "size": len(data)}


def get_object(path: str) -> Tuple[bytes, str]:
    if not init_storage():
        raise RuntimeError("Storage unavailable")
    try:
        resp = _client.get_object(Bucket=_bucket, Key=path)
    except (BotoCoreError, ClientError) as e:
        raise RuntimeError(f"R2 get failed: {e}") from e
    return resp["Body"].read(), resp.get("ContentType", "application/octet-stream")


def build_upload_path(user_id: str, ext: str) -> str:
    return f"{APP_NAME}/uploads/{user_id}/{uuid.uuid4().hex}.{ext.lower()}"
