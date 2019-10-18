import json

from DBElementWithID import DBElementWithID


class Shipping(DBElementWithID):
    TABLE = "shipping"
    COLUMN_NAMES = ['id', 'order_number', 'order_image_aws_path']

    def __init__(self, id, order_number, order_image_aws_path):
        tuple_key_value_list = [(Shipping.COLUMN_NAMES[0], id), (Shipping.COLUMN_NAMES[1], order_number),
                                (Shipping.COLUMN_NAMES[2], order_image_aws_path)]

        super(Shipping, self).__init__(Shipping.TABLE, tuple_key_value_list)

    @classmethod
    def from_dict(cls, dict_obj):
        values = list(dict_obj.values())
        return cls(values[0], values[1], values[2])

    @classmethod
    def from_json_str(cls, json_str):
        return cls.from_dict(json.loads(json_str))


    @classmethod
    def from_tuple(cls, tuple_values):
        return cls(tuple_values[0], tuple_values[1], tuple_values[2])

    @staticmethod
    def get_all_elements():
        return DBElementWithID.get_all_elements(Shipping.TABLE, Shipping)

    @staticmethod
    def get_element_with_id(id_value):
        return DBElementWithID.get_element_with_id(Shipping.TABLE, Shipping.COLUMN_NAMES[0], id_value, Shipping)
