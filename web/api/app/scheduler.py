"""Background sync scheduler for repositories."""

import logging
import os

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Repository
from app.services_sync import sync_repository

logger = logging.getLogger(__name__)

SCAN_INTERVAL_MINUTES = int(os.getenv("SCAN_INTERVAL_MINUTES", "60"))
ENABLE_BACKGROUND_SYNC = os.getenv("ENABLE_BACKGROUND_SYNC", "true").lower() != "false"

scheduler = AsyncIOScheduler()


async def run_sync_cycle():
    """Sync all repositories (single-user mode)."""
    db: Session = SessionLocal()
    try:
        repos = db.query(Repository).all()
        for repo in repos:
            try:
                await sync_repository(db, repo)
            except Exception as exc:  # pragma: no cover - log and continue
                logger.warning("Background sync failed for repo %s: %s", repo.full_name, exc)
                db.rollback()
    finally:
        db.close()


def start_scheduler():
    if not ENABLE_BACKGROUND_SYNC:
        logger.info("Background sync disabled via ENABLE_BACKGROUND_SYNC")
        return
    if scheduler.running:
        return
    scheduler.add_job(run_sync_cycle, IntervalTrigger(minutes=SCAN_INTERVAL_MINUTES))
    scheduler.start()
    logger.info("Background sync scheduler started (every %s minutes)", SCAN_INTERVAL_MINUTES)


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Background sync scheduler stopped")
