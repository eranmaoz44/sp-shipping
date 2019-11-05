import json
import os
import flask
from flask import Flask, Response, request
from flask_cors import CORS

from Availability import Availability
from AwsConnector import AwsConnector
from DBConnecter import DBConnecter
from Shipping import Shipping

application = Flask(__name__)
cors = CORS(application, resources={r"/api/*": {"origins": "*"}})


@application.route('/')
def index():
    print(os.getcwd())
    return flask.send_file('templates/index.html', mimetype='text.html')


@application.route('/coordination')
def render_coordination_template():
    print(os.getcwd())
    return flask.send_file('templates/coordination.html', mimetype='text.html')


@application.route('/api/shipping', methods=['GET'])
def get_shipping():
    shippingID = request.args.get('shippingID')
    state = request.args.get('state')
    print(state)
    if shippingID is None:
        all_shippings = Shipping.get_shippings_by_state(state)
        res = json.dumps([x.to_dict() for x in all_shippings])
    else:
        single_element = Shipping.get_element_with_id(shippingID)
        res = single_element.to_json_str()
    print(res)
    return Response(status=200, response=res)


@application.route('/api/availabilities', methods=['GET'])
def get_availabilities():
    shipping_id = request.args.get('shipping_id')
    availabilities = Availability.get_all_availabilities_of_shipping(shipping_id)
    res = json.dumps([x.to_dict() for x in availabilities])
    return Response(status=200, response=res)


@application.route('/api/shipping', methods=['POST'])
def set_shipping():
    shipping = Shipping.from_dict(request.get_json())
    new_shipping = False
    if not shipping.check_if_element_exists():
        new_shipping = True
    shipping.insert_or_update()
    if new_shipping:
        shipping.send_new_shipping_message()
    return Response(status=200)


@application.route('/api/shipping', methods=['DELETE'])
def delete_shipping():
    shipping = Shipping.from_json_str(request.args.get('shippingCard'))
    shipping.delete()
    return Response(status=200)


@application.route('/api/availability', methods=['DELETE'])
def delete_availability():
    availability = Availability.from_json_str(request.args.get('availability'))
    availability.delete()
    return Response(status=200)


@application.route('/api/availability', methods=['POST'])
def set_availability():
    availability = Availability.from_dict(request.get_json())
    availability.insert_or_update()
    return Response(status=200)


@application.route('/api/aws/presign_post', methods=['GET'])
def get_aws_presign_post():
    file_name = request.args.get('file_name')

    res = AwsConnector.create_presigned_post_file_upload(file_name)

    return Response(status=200, response=res)


@application.route('/api/aws/presign_get', methods=['GET'])
def get_aws_presign_get():
    file_name = request.args.get('file_name')

    res = AwsConnector.create_presigned_url_file_download(file_name)

    return Response(status=200, response=res)


@application.route('/api/aws/delete', methods=['DELETE'])
def aws_delete_file():
    file_name = request.args['file_name']

    res = AwsConnector.delete_file(file_name)

    return Response(status=200, response=res)


if __name__ == '__main__':
    application.run(host='0.0.0.0')
    # WhatsappConnector.send_message("hello whatsapp", WhatsappConnector.TWILIO_SANDBOX_TEST_NUMBER, WhatsappConnector.MY_WHATSAPP)
    #DBConnecter.execute_write_query("DROP TABLE availabilities")
    #DBConnecter.execute_write_query("DROP TABLE shipping")
    # DBConnecter.execute_write_query("CREATE TABLE shipping (id varchar PRIMARY KEY, order_number varchar, order_image_aws_path varchar, date varchar, state varchar);")
    # DBConnecter.execute_write_query(
    #     "CREATE TABLE availabilities (id varchar, shipping_id varchar REFERENCES shipping(id) ON DELETE CASCADE, "
    #     "date varchar, from_hour varchar, to_hour varchar, PRIMARY KEY (id,shipping_id));")
    # shipping = Shipping.fromJson({
    #         'id': 'abcdefghijklmnop',
    #          'orderNumber': '22222',
    #          'orderImageAwsPath': "orderImages/default.png"
    #      })
    # shipping.insert_or_update()
    # print(DBConnecter.execute_read_query("select * from shipping;"))
