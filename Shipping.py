import json

from DBConnecter import DBConnecter


class Shipping(object):
    def __init__(self, id, order_number, order_image_aws_path):
        self.id = id
        self.order_number = order_number
        self.order_image_aws_path = order_image_aws_path


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
        exists = Shipping.get_shipping(self.id) is not None
        shipping_params = (self.id, self.order_number, self.order_image_aws_path)
        if not exists:
            query_to_execute = "INSERT INTO shipping (id, order_number, order_image_aws_path) VALUES (%s, %s, %s);"
        else:
            query_to_execute = "UPDATE shipping SET id = %s, order_number = %s, order_image_aws_path = %s WHERE id=%s";
            shipping_params = shipping_params + (self.id,)
        DBConnecter.execute_write_query(query_to_execute, shipping_params)

    def delete(self):
        delete_query = "DELETE FROM shipping WHERE id = %s;"
        DBConnecter.execute_write_query(delete_query, (self.id,))


    @staticmethod
    def get_shippings():
        query = "SELECT * FROM shipping;"
        res = DBConnecter.execute_read_query(query)
        shippings = [Shipping.fromTuple(x) for x in res]

        return shippings

    @staticmethod
    def get_shipping(shippingID):
        query = "SELECT * FROM shipping WHERE id = %s;"
        query_res = DBConnecter.execute_read_query(query, (shippingID,))
        shipping = None
        if len(query_res) > 0:
            shipping = Shipping.fromTuple(query_res[0])
        return shipping


