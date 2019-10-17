from DBConnecter import DBConnecter


class DBUtils(object):
    def __init__(self):
        pass

    @staticmethod
    def insert_or_update_row(table, arg_names, arg_values):
        exists = DBUtils.get_element_row(table, arg_names[0], arg_values[0]) is not None
        query_params = tuple(arg_values)
        if not exists:
            #"INSERT INTO shipping (id, order_number, order_image_aws_path) VALUES (%s, %s, %s);"
            args_clause = ', '.join(arg_names)
            value_clause = ', '.join(['%s'] * len(arg_names))
            query_to_execute = "INSERT INTO {0} ({1}) VALUES ({2});".format(table, args_clause, value_clause)
        else:
            #"UPDATE shipping SET id = %s, order_number = %s, order_image_aws_path = %s WHERE id=%s;";
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
    def get_all_elements(table, element_class):
        query = "SELECT * FROM {0};".format(table)
        res = DBConnecter.execute_read_query(query)
        elements = [element_class.fromTuple(x) for x in res]

        return elements

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
        return element_class.fromTuple(element_row) if element_row is not None else element_row
