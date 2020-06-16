import logging

from Loggers.ConsoleLogger import ConsoleLogger
from MetaTypes.Singleton import Singleton


class LoggerSelector(object, metaclass=Singleton):
    def __init__(self):
        self.logger = ConsoleLogger.get_logger(logging_level_filter=logging.DEBUG)

    def get_logger(self):
        return self.logger
