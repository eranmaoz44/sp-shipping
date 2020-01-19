from apscheduler.schedulers.background import BackgroundScheduler

from Shipping import Shipping


class Scheduler(object):
    def __init__(self):
        pass

    @staticmethod
    def schedule_tasks():
        scheduler = BackgroundScheduler(timezone='Asia/Jerusalem')
        job = scheduler.add_job(Shipping.remove_and_clean_old_elements, 'cron', hour='0', minute='0')
        scheduler.start()

