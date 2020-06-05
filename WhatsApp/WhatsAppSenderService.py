from flask import Flask, Response, request
from flask_cors import CORS

from WhatsApp.WhatsAppSender import WhatsAppSender
import sys
import os

from WhatsApp.WhatsAppSenderFirefox import WhatsAppSenderFirefox

application = Flask(__name__)
cors = CORS(application, resources={r"/api/*": {"origins": "*"}})

application.secret_key = 'super secret key2'

@application.route("/")
def hello():
    return "Hello from FastCGI via IIS!"

@application.route('/api/send', methods=['POST'])
def set_availability():
    request_json = request.get_json()
    payload = request_json['message']

    WhatsAppSenderFirefox.send_message_local(payload)
    return Response(status=200)


def fix_python_path_to_allow_import():
    pass


if __name__ == '__main__':
    fix_python_path_to_allow_import()
    #application.run(host='0.0.0.0', port='5005')
    application.run()

