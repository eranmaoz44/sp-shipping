import os


class Config(object):
    CONFIG = {
        "FROM_WHATSAPP_NUMBER": {
            "TEST": "whatsapp:+14155238886"
        },

        "TO_WHATSAPP_NUMBER": {
            "TEST": "whatsapp:+972525568537"
        },
        "SHIPPING_NUM_DAYS_ALIVE": {
            "TEST": 30,
            "REMOTE": 30
        }
        ,
        "WHATSAPP_SENDER_ADDRESS": {
            "TEST": "http://localhost:8000/api/send",
            "REMOTE": "http://139.162.138.160:81/api/send"
        }
        ,
        "WHATSAPP_RECIPIENT": {
            "TEST": "test",
            "REMOTE": "הובלות ניקולאי"
        }
    }

    @staticmethod
    def get_value(key):
        env = os.environ.get('DEPLOY_ENV')

        return Config.CONFIG[key][env]
