import logging


class ConsoleLogger(object):

    _CONSOLE_LOGGER = 'CONSOLE_LOGGER'

    def __init__(self):
        pass

    @staticmethod
    def get_logger(logging_level_filter = logging.DEBUG):
        logger = logging.getLogger(ConsoleLogger._CONSOLE_LOGGER)
        logger.setLevel(logging_level_filter)
        logger.addHandler(logging.StreamHandler())
        return logger
