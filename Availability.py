import json

from DBUtils import DBUtils


class Availability(object):
    TABLE = "availabilities"

    def __init__(self, id, shipping_id, date, from_hour, to_hour):
        self.id = id
        self.shipping_id = shipping_id
        self.date = date
        self.from_hour = from_hour
        self.to_hour = to_hour
        self.table = Availability.TABLE

    @classmethod
    def fromJson(cls, availability_json):
        """creat `cls` from lat,long in degrees """
        return cls(availability_json['id'], availability_json['shipping_id'], availability_json['date'],
                   availability_json['from_hour'], availability_json['to_hour'])

    @classmethod
    def fromTuple(cls, availability_tuple):
        """creat `cls` from lat,long in degrees """
        return cls(availability_tuple[0], availability_tuple[1], availability_tuple[2], availability_tuple[3],
                   availability_tuple[4])

    @classmethod
    def fromJsonString(cls, availability_json_str):
        return Availability.fromJson(json.loads(availability_json_str))

    def to_json(self):
        return {
            "id": self.id,
            "shipping_id": self.shipping_id,
            "date": self.date,
            "from_hour": self.from_hour,
            "to_hour": self.to_hour
        }

    def insert_or_update(self):
        DBUtils.insert_or_update_row(self.table, ['id', 'shipping_id', 'date', 'from_hour', 'to_hour'],
                                     [self.id, self.shipping_id, self.date, self.from_hour, self.to_hour])

    def delete(self):
        DBUtils.delete_row(self.table, 'id', self.id)

    @staticmethod
    def get_availabilities():
        return DBUtils.get_all_elements(Availability.TABLE, Availability)

    def get_availability(self):
        return DBUtils.get_element(self.table, 'id', self.id, Availability)

    @staticmethod
    def get_availability_with_id(availability_id):
        return DBUtils.get_element(Availability.TABLE, 'id', availability_id, Availability)
