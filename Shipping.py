import json

from Config import Config
from DBElementWithID import DBElementWithID
from WhatsappConnector import WhatsappConnector
from flask import request
import os


class Shipping(DBElementWithID):
    TABLE = "shipping"
    COLUMN_NAMES = ['id', 'order_number', 'order_image_aws_path', 'date', 'state', 'phone_number']

    def __init__(self, id, order_number, order_image_aws_path, date, state, phone_number):
        tuple_key_value_list = [(Shipping.COLUMN_NAMES[0], id), (Shipping.COLUMN_NAMES[1], order_number),
                                (Shipping.COLUMN_NAMES[2], order_image_aws_path), (Shipping.COLUMN_NAMES[3], date), (Shipping.COLUMN_NAMES[4], state), (Shipping.COLUMN_NAMES[5], phone_number)]

        super(Shipping, self).__init__(Shipping.TABLE, tuple_key_value_list)

    def send_new_shipping_message(self):
        message = "נוצר משלוח חדש, קישור לפרטים נוספים:" + '\n' + os.path.join(
            '{0}/coordination?shippingID={1}'.format(request.url_root.replace("://", "://www.").rstrip('/'),
                                                     self.get_id_value()))
        from_whatsapp_number = Config.get_value('FROM_WHATSAPP_NUMBER')
        to_whatsapp_number = Config.get_value('TO_WHATSAPP_NUMBER')
        WhatsappConnector.send_message(message, from_whatsapp_number, to_whatsapp_number)

    @classmethod
    def from_dict(cls, dict_obj):
        values = list(dict_obj.values())
        return cls(values[0], values[1], values[2], values[3], values[4], values[5])

    @classmethod
    def from_json_str(cls, json_str):
        return cls.from_dict(json.loads(json_str))

    @classmethod
    def from_tuple(cls, tuple_values):
        return cls(tuple_values[0], tuple_values[1], tuple_values[2], tuple_values[3], tuple_values[4], tuple_values[5])

    @staticmethod
    def get_shippings_by_state(state):
        return DBElementWithID.get_multiple_elements(Shipping.TABLE, Shipping, [(Shipping.COLUMN_NAMES[4], state)])

    @staticmethod
    def get_all_elements():
        return DBElementWithID.get_all_elements(Shipping.TABLE, Shipping)

    @staticmethod
    def get_element_with_id(id_value):
        return DBElementWithID.get_element_with_id(Shipping.TABLE, Shipping.COLUMN_NAMES[0], id_value, Shipping)
