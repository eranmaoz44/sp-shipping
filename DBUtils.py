from DBConnecter import DBConnecter


class DBUtils(object):
    _SELECT_ALL_OPERATOR = 'SELECT *'
    _DELETE_OPERATOR = 'DELETE'
    def __init__(self):
        pass

    @staticmethod
    def insert_or_update_row(table, arg_names, arg_values):
        exists = DBUtils.check_if_row_exists(table, arg_names[0], arg_values[0])
        query_params = tuple(arg_values)
        if not exists:
            args_clause = ', '.join(arg_names)
            value_clause = ', '.join(['%s'] * len(arg_names))
            query_to_execute = "INSERT INTO {0} ({1}) VALUES ({2});".format(table, args_clause, value_clause)
        else:
            set_clause = ', '.join(['{0} = %s'.format(arg_name) for arg_name in arg_names])
            where_clause = '{0} = %s'.format(arg_names[0])
            query_to_execute = "UPDATE {0} SET {1} WHERE {2};".format(table, set_clause, where_clause)
            query_params = query_params + (arg_values[0],)
        DBConnecter.execute_write_query(query_to_execute, query_params)

    @staticmethod
    def check_if_row_exists(table, key_name, key_value):
        return DBUtils.get_element_row(table, key_name, key_value) is not None

    @staticmethod
    def delete_row(table, arg_id_name, arg_id_value):
        delete_query = "DELETE FROM {0} WHERE {1} = %s;".format(table, arg_id_name)
        DBConnecter.execute_write_query(delete_query, (arg_id_value,))

    @staticmethod
    def get_multiple_elements(table, element_class, required_equality_params=[]):
        where_clause = ''
        if required_equality_params:
            where_clause = ' WHERE ' + 'AND '.join(['{0} = %s'.format(x[0]) for x in required_equality_params])
        query = "SELECT * FROM {0}{1};".format(table, where_clause)
        res = DBConnecter.execute_read_query(query, [x[1] for x in required_equality_params])
        elements = [element_class.from_tuple(x) for x in res]

        return elements

    @staticmethod
    def get_all_elements(table, element_class):
        return DBUtils.get_multiple_elements(table, element_class)

    @staticmethod
    def get_element_row(table, arg_id_name, arg_id_value):
        query = "SELECT * FROM {0} WHERE {1} = %s;".format(table, arg_id_name)
        query_res = DBConnecter.execute_read_query(query, (arg_id_value,))
        element_row = None
        if len(query_res) > 0:
            element_row = query_res[0]
        return element_row

    @staticmethod
    def get_element(table, arg_id_name, arg_id_value, element_class):
        element_row = DBUtils.get_element_row(table, arg_id_name, arg_id_value)
        return element_class.from_tuple(element_row) if element_row is not None else element_row

    @staticmethod
    def get_elements_before_date(table, date_column_name, before_date, date_format, element_class):
        query = DBUtils.create_before_date_query(table, DBUtils._SELECT_ALL_OPERATOR, date_column_name, date_format)
        query_res = DBConnecter.execute_read_query(query, (before_date,))
        elements = [element_class.from_tuple(x) for x in query_res]
        return elements

    @staticmethod
    def create_before_date_query(table, operator_name, date_column_name, date_format):
        return "{0} FROM {1} where TO_DATE({2}, {3})<TO_DATE(%s, {3})".format(operator_name, table,
                                                                                date_column_name, date_format)

    @staticmethod
    def delete_elements_before_date(table, date_column_name, before_date, date_format):
        query = DBUtils.create_before_date_query(table, DBUtils._DELETE_OPERATOR, date_column_name, date_format)
        DBConnecter.execute_write_query(query, (before_date,))

