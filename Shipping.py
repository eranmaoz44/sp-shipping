import json
from datetime import timedelta, date

from AwsConnector import AwsConnector
from Config import Config
from DBElementWithID import DBElementWithID
from flask import request
import os

from Loggers.LoggerSelector import LoggerSelector
from WhatsApp.WhatsAppConnector import WhatsAppConnector
from WhatsApp.WhatsAppHandlerThread import WhatsAppHandlerThread


class Shipping(DBElementWithID):
    _date_format = "%d/%m/%Y"
    TABLE = "shipping"
    COLUMN_NAMES = ['id', 'order_number', 'order_image_aws_path', 'date', 'state', 'phone_number', 'price', 'who_pays',
                    'extra_info']
    _DEFAULT_IMAGE_PATH = 'orderImages/default.png'

    def __init__(self, id, order_number, order_image_aws_path, date, state, phone_number, price, who_pays, extra_info):
        tuple_key_value_list = [(Shipping.COLUMN_NAMES[0], id), (Shipping.COLUMN_NAMES[1], order_number),
                                (Shipping.COLUMN_NAMES[2], order_image_aws_path), (Shipping.COLUMN_NAMES[3], date),
                                (Shipping.COLUMN_NAMES[4], state), (Shipping.COLUMN_NAMES[5], phone_number),
                                (Shipping.COLUMN_NAMES[6], price), (Shipping.COLUMN_NAMES[7], who_pays),
                                (Shipping.COLUMN_NAMES[8], extra_info)]

        self.logger = LoggerSelector().get_logger()

        super(Shipping, self).__init__(Shipping.TABLE, tuple_key_value_list)

    def __str__(self):
        return str(self.tuple_key_value_list)

    def __unicode__(self):
        return self.__str__().decode('utf-8')

    def send_new_shipping_message(self):
        message = "נוצר משלוח חדש, קישור לפרטים נוספים:" + '\n' + os.path.join(
            '{0}/coordination?shippingID={1}'.format(request.url_root.replace("http://", "http://").rstrip('/'),
                                                     self.get_id_value()))
        # WhatsAppConnector.send_message(message)
        WhatsAppHandlerThread(message, Config.get_value('WHATSAPP_RECIPIENT')).start()

    @classmethod
    def from_dict(cls, dict_obj):
        values = list(dict_obj.values())
        return cls.from_tuple(values)
        # return cls(values[0], values[1], values[2], values[3], values[4], values[5], values[6], values[7], values[8])

    @classmethod
    def from_json_str(cls, json_str):
        return cls.from_dict(json.loads(json_str))

    @classmethod
    def from_tuple(cls, tuple_values):
        return cls(tuple_values[0], tuple_values[1], tuple_values[2], tuple_values[3], tuple_values[4], tuple_values[5],
                   tuple_values[6], tuple_values[7], tuple_values[8])

    @staticmethod
    def get_shippings_by_state(state):
        return DBElementWithID.get_multiple_elements(Shipping.TABLE, Shipping, [(Shipping.COLUMN_NAMES[4], state)])

    @staticmethod
    def get_all_elements():
        return DBElementWithID.get_all_elements(Shipping.TABLE, Shipping)

    @staticmethod
    def get_element_with_id(id_value):
        return DBElementWithID.get_element_with_id(Shipping.TABLE, Shipping.COLUMN_NAMES[0], id_value, Shipping)

    @staticmethod
    def get_shippings_before_date(before_date):
        return DBElementWithID.get_elements_before_date(Shipping.TABLE, Shipping.COLUMN_NAMES[3],
                                                        before_date, Shipping)

    @staticmethod
    def delete_shippings_before_date(before_date):
        DBElementWithID.delete_elements_before_date(Shipping.TABLE, Shipping.COLUMN_NAMES[3],
                                                        before_date)

    @staticmethod
    def remove_and_clean_old_elements():
        remove_from_date = (date.today() - timedelta(Config.get_value('SHIPPING_NUM_DAYS_ALIVE'))).strftime(
            Shipping._date_format)
        LoggerSelector().get_logger().info('Going to remove shipments older than {0}'.format(remove_from_date))
        shippings_before_date = Shipping.get_shippings_before_date(remove_from_date)
        LoggerSelector().get_logger().info(shippings_before_date)
        LoggerSelector().get_logger().info('Removing AWS data')
        for shipping in shippings_before_date:
            image_path = shipping.get_value(Shipping.COLUMN_NAMES[2])
            if image_path != Shipping._DEFAULT_IMAGE_PATH:
                AwsConnector.delete_file(image_path)
        LoggerSelector().get_logger().info('Removing SQL data')
        Shipping.delete_shippings_before_date(remove_from_date)
