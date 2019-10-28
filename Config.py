import os


class Config(object):
    CONFIG = {
        "FROM_WHATSAPP_NUMBER": {
            "TEST": "whatsapp:+14155238886"
        },

        "TO_WHATSAPP_NUMBER": {
            "TEST": "whatsapp:+972525568537"
        }
    }

    @staticmethod
    def get_value(key):
        env = os.environ.get('DEPLOY_ENV')

        return Config.CONFIG[key][env]
