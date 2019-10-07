import json
import logging
import os
import flask
from flask import Flask, Response, request
from flask_cors import CORS

from AwsConnector import AwsConnector

application = Flask(__name__)
cors = CORS(application, resources={r"/api/*": {"origins": "*"}})


@application.route('/')
def index():
    print(os.getcwd())
    return flask.send_file('templates/index.html', mimetype='text.html')


@application.route('/api/shipping', methods=['GET'])
def get_shipping():
    res = [
        {
            'id': '1234567891011123',
            'orderNumber': '11111',
            'orderImageUrl': "https://cdn.onlinewebfonts.com/svg/img_234957.png"
        },
        {
            'id': 'abcdefghijklmnop',
            'orderNumber': '22222',
            'orderImageUrl': "https://cdn.onlinewebfonts.com/svg/img_234957.png"
        }
    ]
    return Response(status=200, response=json.dumps(res))


@application.route('/api/shipping', methods=['POST'])
def set_shipping():
    print(request.get_json())
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


if __name__ == '__main__':
    application.run(host='0.0.0.0')
