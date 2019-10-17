import json

from DBConnecter import DBConnecter
from DBUtils import DBUtils


class Shipping(object):
    TABLE = "shipping"

    def __init__(self, id, order_number, order_image_aws_path):
        self.id = id
        self.order_number = order_number
        self.order_image_aws_path = order_image_aws_path
        self.table = Shipping.TABLE

    @classmethod
    def fromJson(cls, shipping_json):
        """creat `cls` from lat,long in degrees """
        return cls(shipping_json['id'], shipping_json['orderNumber'], shipping_json['orderImageAwsPath'])

    @classmethod
    def fromTuple(cls, shipping_tuple):
        """creat `cls` from lat,long in degrees """
        return cls(shipping_tuple[0], shipping_tuple[1], shipping_tuple[2])

    @classmethod
    def fromJsonString(cls, shipping_json_str):
        return Shipping.fromJson(json.loads(shipping_json_str))

    def to_json(self):
        return {
            "id": self.id,
            "orderNumber": self.order_number,
            "orderImageAwsPath": self.order_image_aws_path
        }

    def insert_or_update(self):
        DBUtils.insert_or_update_row(self.table, ['id', 'order_number', 'order_image_aws_path'],
                                     [self.id, self.order_number, self.order_image_aws_path])

    def delete(self):
        DBUtils.delete_row(self.table, 'id', self.id)

    @staticmethod
    def get_shippings():
        return DBUtils.get_all_elements(Shipping.TABLE, Shipping)

    def get_shipping(self):
        return DBUtils.get_element(self.table, 'id', self.id, Shipping)

    @staticmethod
    def get_shipping_with_id(shippingID):
        return DBUtils.get_element(Shipping.TABLE, 'id', shippingID, Shipping)
