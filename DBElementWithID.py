import json

from DBUtils import DBUtils


class DBElementWithID(object):
    _POSTGRES_DATE_FORMAT = "'DD/MM/YYYY'"

    def __init__(self, table, tuple_key_value_list):
        self.table = table
        self.tuple_key_value_list = tuple_key_value_list

    def to_dict(self):
        return dict(self.tuple_key_value_list)

    def to_json_str(self):
        return json.dumps(dict(self.tuple_key_value_list))

    def insert_or_update(self):
        DBUtils.insert_or_update_row(self.table, list(self.to_dict().keys()),
                                     list(self.to_dict().values()))

    def check_if_element_exists(self):
        return DBUtils.check_if_row_exists(self.table, self.get_id_name(), self.get_id_value())

    def delete(self):
        DBUtils.delete_row(self.table, self.get_id_name(), self.get_id_value())

    def get_id_value(self):
        return self.tuple_key_value_list[0][1]

    def get_id_name(self):
        return self.tuple_key_value_list[0][0]

    @staticmethod
    def get_multiple_elements(table, element_class, required_equality_args=[]):
        return DBUtils.get_multiple_elements(table, element_class, required_equality_args)

    @staticmethod
    def get_all_elements(table, element_class):
        return DBUtils.get_all_elements(table, element_class)

    @staticmethod
    def get_element_with_id(table, id_key, id_value, element_class):
        return DBUtils.get_element(table, id_key, id_value, element_class)

    @staticmethod
    def get_elements_before_date(table, date_column_name, before_date, element_class):
        return DBUtils.get_elements_before_date(table, date_column_name, before_date,
                                                DBElementWithID._POSTGRES_DATE_FORMAT, element_class)

    @staticmethod
    def delete_elements_before_date(table, date_column_name, before_date):
        return DBUtils.delete_elements_before_date(table, date_column_name, before_date,
                                                DBElementWithID._POSTGRES_DATE_FORMAT)

    def get_value(self, key):
        return self.to_dict()[key]

    def get_column_index_by_name(self, column_name):
        column_names = [key for (key, value) in self.tuple_key_value_list]
        return column_names.index(column_name)
