import json
import os
import flask
from flask import Flask, Response
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
            'orderNumber': '11111'
        },
        {
            'orderNumber': '22222'
        }
    ]
    return Response(status=200, response=json.dumps(res))


if __name__ == '__main__':
    application.run(host='0.0.0.0')
