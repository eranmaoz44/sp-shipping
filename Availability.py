from DBConnecter import DBConnecter


class Availability(object):
    def __init__(self, id, date, from_hour, to_hour):
        self.id = id
        self.date = date
        self.from_hour = from_hour
        self.to_hour = to_hour

    @classmethod
    def from_json(cls, availability_json):
        return cls(availability_json['id'], availability_json['date'], availability_json['from_hour'],
                   availability_json['to_hour'])

    @classmethod
    def from_tuple(cls, availability_tuple):
        return cls(availability_tuple[0], availability_tuple[1], availability_tuple[2], availability_tuple[3])


    def insert_or_update(self):
        exists = self.get_availability() is not None
        if exists:
            query = ""
        else:
            query = ""
        params = ""
        DBConnecter.execute_write_query(query, params)

    def get_availability(self):
        query = ""
        params = ""
        query_res = DBConnecter.execute_read_query(query, params)
        res = None
        if len(query_res) > 0:
            res = Availability.fromTuple(query_res[0])
        return res


