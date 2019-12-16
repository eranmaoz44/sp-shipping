import json
from werkzeug.security import generate_password_hash, check_password_hash
from DBElementWithID import DBElementWithID


class UserWithHashPassword(DBElementWithID):
    TABLE = "users"
    COLUMN_NAMES = ['id', 'password_hash']

    def __init__(self, id, password_hash):
        tuple_key_value_list = [(UserWithHashPassword.COLUMN_NAMES[0], id), (UserWithHashPassword.COLUMN_NAMES[1], password_hash)]

        super(UserWithHashPassword, self).__init__(UserWithHashPassword.TABLE, tuple_key_value_list)


    @classmethod
    def from_dict(cls, dict_obj):
        values = list(dict_obj.values())
        return cls.from_tuple(values)

    @classmethod
    def from_json_str(cls, json_str):
        return cls.from_dict(json.loads(json_str))

    @classmethod
    def from_tuple(cls, tuple_values):
        return cls(tuple_values[0], tuple_values[1])

    @classmethod
    def create_new_user(cls, id, password):
        return cls(id, UserWithHashPassword.generate_password_hash(password))

    @staticmethod
    def get_element_with_id(id_value):
        return DBElementWithID.get_element_with_id(UserWithHashPassword.TABLE, UserWithHashPassword.COLUMN_NAMES[0], id_value, UserWithHashPassword)

    def check_password(self, password):
        return check_password_hash(self.get_value(UserWithHashPassword.COLUMN_NAMES[1]), password)

    @staticmethod
    def generate_password_hash(password):
        return generate_password_hash(password)

    @staticmethod
    def get_all_elements():
        return DBElementWithID.get_all_elements(UserWithHashPassword.TABLE, UserWithHashPassword)
