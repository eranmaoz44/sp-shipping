from DBConnecter import DBConnecter


class DBUtils(object):
    def __init__(self):
        pass

    @staticmethod
    def insert_or_update_row(table, arg_names, arg_values):
        exists = DBUtils.get_element_row(table, arg_names[0], arg_values[0]) is not None
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
        print(query_to_execute)
        print(query_params)
        DBConnecter.execute_write_query(query_to_execute, query_params)

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
