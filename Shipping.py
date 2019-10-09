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

    def to_json(self):
        return {
            "id": self.id,
            "orderNumber": self.order_number,
            "orderImageAwsPath": self.order_image_aws_path
        }

    def insert_or_update(self):
        find_query = "SELECT * FROM shipping WHERE id = %s;"
        exists = len(DBConnecter.execute_read_query(find_query, (self.id,))) > 0
        shipping_params = (self.id, self.order_number, self.order_image_aws_path)
        if not exists:
            query_to_execute = "INSERT INTO shipping (id, order_number, order_image_aws_path) VALUES (%s, %s, %s);"
        else:
            query_to_execute = "UPDATE shipping SET id = %s, order_number = %s, order_image_aws_path = %s WHERE id=%s";
            shipping_params = shipping_params + (self.id,)
        DBConnecter.execute_write_query(query_to_execute, shipping_params)


    @staticmethod
    def get_shippings():
        query = "SELECT * FROM shipping;"
        res = DBConnecter.execute_read_query(query)
        shippings = [Shipping.fromTuple(x) for x in res]

        return shippings


