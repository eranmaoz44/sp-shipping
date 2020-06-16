import random
import threading
import time

from requests.exceptions import ConnectionError

from Loggers.LoggerSelector import LoggerSelector
from WhatsApp.WhatsAppConnector import WhatsAppConnector

exitFlag = 0


class WhatsAppHandlerThread(threading.Thread):
    _RETRY_INTERVAL_SECONDS_MIN = 30
    _RETRY_INTERVAL_SECONDS_MAX = 90
    _RETRY_COUNT_MAX = 5

    def __init__(self, message, recipient):
        threading.Thread.__init__(self)
        self.thread_id = threading.get_ident()
        self.message = message
        self.recipient = recipient
        self.logger = LoggerSelector().get_logger()

    def run(self):
        self._log('Trying to send WhatsApp message {0} to recipient {1}'
                  .format(self.message, self.recipient))

        success = self._try_sending()

        retry_count = 1

        while not success and retry_count < self._RETRY_COUNT_MAX:
            seconds_to_sleep = self._get_random_seconds_to_sleep()
            self._log('Failed to send WhatsApp message, waiting {0} seconds'.format(seconds_to_sleep))
            time.sleep(seconds_to_sleep)
            retry_count = retry_count + 1
            self._log('Retrying sending message number {0}'.format(retry_count))
            success = self._try_sending()


        if success:
            self._log('Successfully sent message')
        else:
            self._log('Reached max tries {0} attempting to send message'.format(self._RETRY_COUNT_MAX))

    def _log(self, log_message):
        self.logger.info(self.get_thread_log_message(log_message))

    def get_thread_log_message(self, log_message):
        return '{0} on thread {1}'.format(log_message, self.thread_id)

    def _try_sending(self):
        res = False
        try:
            response = WhatsAppConnector.send_message(self.message, self.recipient)
            if response.status_code == 200:
                res = True
        except ConnectionError as ex:
            self._log_exception(ex)

        return res

    def _log_exception(self, exception):
        self.logger.error(self.get_thread_log_message(type(exception).__name__))
        print(exception)

    def _get_random_seconds_to_sleep(self):
        return random.randrange(self._RETRY_INTERVAL_SECONDS_MIN, self._RETRY_INTERVAL_SECONDS_MAX + 1, 5)



