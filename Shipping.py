class Shipping(object):
    def __init__(self, id, order_number):
        self.id = id
        self.order_number = order_number

    def to_json(self):
        return {
            "id": self.id,
            "orderNumber": self.order_number
        }
