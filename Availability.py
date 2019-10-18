import json

from DBElementWithID import DBElementWithID


class Availability(DBElementWithID):
    TABLE = "availabilities"
    COLUMN_NAMES = ['id', 'shipping_id', 'date', 'from_hour', 'to_hour']

    def __init__(self, id, shipping_id, date, from_hour, to_hour):
        tuple_key_value_list = [(Availability.COLUMN_NAMES[0], id), (Availability.COLUMN_NAMES[1], shipping_id),
                                (Availability.COLUMN_NAMES[2], date), (Availability.COLUMN_NAMES[3], from_hour),
                                (Availability.COLUMN_NAMES[4], to_hour)]

        super(Availability, self).__init__(Availability.COLUMN_NAMES.TABLE, tuple_key_value_list)

    @classmethod
    def from_dict(cls, dict_obj):
        values = list(dict_obj.values())
        return cls(values[0], values[1], values[2], values[3], values[4])

    @classmethod
    def from_json_str(cls, json_str):
        return cls.from_dict(json.loads(json_str))

    @classmethod
    def from_tuple(cls, tuple_values):
        return cls(tuple_values[0], tuple_values[1], tuple_values[2])

    @staticmethod
    def get_all_elements():
        return DBElementWithID.get_all_elements(Availability.TABLE, Availability)

    @staticmethod
    def get_element_with_id(id_value):
        return DBElementWithID.get_element_with_id(Availability.TABLE, Availability.COLUMN_NAMES[0], id_value, Availability)
