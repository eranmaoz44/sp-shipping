from twilio.rest import Client


class WhatsappConnector(object):

    def __init__(self):
        pass

    @staticmethod
    def send_message(body, from_whatsapp_number, to_whatsapp_number):
        client = Client()

        client.messages.create(body=body,
                               from_=from_whatsapp_number,
                               to=to_whatsapp_number)
