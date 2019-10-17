import json
import logging
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
    if shippingID is None:
        all_shippings = Shipping.get_shippings()
        res = json.dumps([x.to_json() for x in all_shippings])
    else:
        shipping = Shipping.get_shipping_with_id(shippingID)
        res = json.dumps(shipping.to_json())
    print(res)
    return Response(status=200, response=res)


@application.route('/api/shipping', methods=['POST'])
def set_shipping():
    shipping = Shipping.fromJson(request.get_json())
    shipping.insert_or_update()
    return Response(status=200)


@application.route('/api/shipping', methods=['DELETE'])
def delete_shipping():
    shipping = Shipping.fromJsonString(request.args.get('shippingCard'))
    shipping.delete()
    return Response(status=200)


@application.route('/api/availability', methods=['POST'])
def set_availability():
    availability = Availability.fromJson(request.get_json())
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
    # DBConnecter.execute_write_query("CREATE TABLE shipping (id varchar PRIMARY KEY, order_number varchar, order_image_aws_path varchar);")
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
