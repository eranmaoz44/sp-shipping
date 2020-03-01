import json

import requests

from Config import Config


class WhatsAppConnector(object):

    def __init__(self):
        pass

    @staticmethod
    def send_message(body, from_whatsapp_number, to_whatsapp_number):
        url = Config.get_value('WHATSAPP_SENDER_ADDRESS')
        request_json = {'message': body}
        request_json_str = json.dumps(request_json)
        print(request_json)
        x = requests.post(url, headers={'content-type':'application/json'}, data=request_json_str)




