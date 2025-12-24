import logging
from apscheduler.schedulers.background import BackgroundScheduler

logger = logging.getLogger(__name__)

def start_scanner():
    """Initialize background scanner"""
    scheduler = BackgroundScheduler()
    
    def scan_projects():
        logger.info("Scanning projects...")
        # TODO: implement scanning logic
    
    # Schedule scan job
    scheduler.add_job(scan_projects, 'interval', minutes=60, id='project_scan')
    scheduler.start()
    logger.info("Scanner started")

if __name__ == "__main__":
    start_scanner()
    try:
        import time
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        pass
