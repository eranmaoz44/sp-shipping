import json
import os
import flask
from flask import Flask, Response, request
from flask_cors import CORS

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
            'orderNumber': '11111'
        },
        {
            'id': 'abcdefghijklmnop',
            'orderNumber': '22222'
        }
    ]
    return Response(status=200, response=json.dumps(res))


@application.route('/api/shipping', methods=['POST'])
def set_shipping():
    print(request.get_json())
    return Response(status=200)


@application.route('/api/image', methods=['post'])
def post_image():
    file = request.files['file']
    fileName = file.filename

    # to store it on server use getvalue() and write it to the file object
    filedata = file.getvalue()

    print(fileName)
    print(filedata)
    return Response(status=200, response="great")


if __name__ == '__main__':
    application.run(host='0.0.0.0')
