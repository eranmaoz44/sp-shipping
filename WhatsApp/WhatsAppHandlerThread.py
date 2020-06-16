import threading
import time

from WhatsApp.WhatsAppConnector import WhatsAppConnector

exitFlag = 0


class WhatsAppHandlerThread(threading.Thread):
    def __init__(self, message, recipient):
        threading.Thread.__init__(self)
        self.message = message
        self.recipient = recipient

    def run(self):
        WhatsAppConnector.send_message(self.message, self.recipient)
