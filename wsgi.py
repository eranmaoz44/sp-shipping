import json
import os
import flask
from flask import Flask, Response, request, flash, redirect, url_for, render_template
from flask_cors import CORS
from werkzeug.urls import url_parse

from Availability import Availability
from AwsConnector import AwsConnector
from Scheduler import Scheduler

from Shipping import Shipping

from flask_login import LoginManager, current_user, login_user, logout_user, login_required

from User import User

_secret_key = 'SECRET_KEY'

application = Flask(__name__)
cors = CORS(application, resources={r"/api/*": {"origins": "*"}})

application.secret_key = os.environ.get(_secret_key)

login = LoginManager(application)
login.login_view = 'login'
users = {}


@login.user_loader
def load_user(id):
    res = None
    if id in users:
        res = users[id]
    return res


@application.route('/index')
@application.route('/')
@login_required
def index():
    return render_template('index.html',
                           title="סליפ דיפו - הובלות")


def send_login_html():
    is_login_page = True
    return render_template('login.html',
                           is_login_page=is_login_page,
                           title="סליפ דיפו - הובלות - התחברות")


@application.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    if request.method == 'POST':
        request_json = request.get_json()
        user_id = request_json['id']
        password = request_json['password']
        remember_me = request_json['remember_me']
        user = User(user_id, password)
        users[user_id] = user
        if not user.is_authenticated():
            flash('Invalid username or password')
            return Response(status=401)
        login_user(user, remember=remember_me)
        next_page = extract_next_page_from_login_referer()

        if not next_page or url_parse(next_page).netloc != '':
            next_page = url_for('index')
        return Response(status=200, response=next_page)
    return send_login_html()


def extract_next_page_from_login_referer():
    referer_args = url_parse(request.headers['Referer']).decode_query()
    res = None
    if 'next' in referer_args:
        res = referer_args['next']
    return res


@application.route('/user/id', methods=['GET'])
def get_user_id():
    res = 'Not signed in, please do'
    if current_user is not None and current_user.is_authenticated:
        res = current_user.id
    return Response(status=200, response=res)


@application.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('login'))


@application.route('/coordination')
@login_required
def render_coordination_template():
    return flask.send_file('templates/coordination.html', mimetype='text.html')


@application.route('/api/shipping', methods=['GET'])
def get_shipping():
    shippingID = request.args.get('shippingID')
    state = request.args.get('state')
    if shippingID is None:
        all_shippings = Shipping.get_shippings_by_state(state)
        res = json.dumps([x.to_dict() for x in all_shippings])
    else:
        single_element = Shipping.get_element_with_id(shippingID)
        res = single_element.to_json_str()
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


@application.route('/api/maintenance/remove_old_shipments', methods=['DELETE'])
def remove_old_shipments():
    Shipping.remove_and_clean_old_elements()
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
    application.run(host='0.0.0.0', port=8005)
    # WhatsappConnector.send_message("hello whatsapp", WhatsappConnector.TWILIO_SANDBOX_TEST_NUMBER, WhatsappConnector.MY_WHATSAPP)
    # DBConnecter.execute_write_query("DROP TABLE availabilities")
    # DBConnecter.execute_write_query("DROP TABLE shipping")
    # DBConnecter.execute_write_query("CREATE TABLE shipping (id varchar PRIMARY KEY, order_number varchar, order_image_aws_path varchar, date varchar, state varchar, phone_number varchar, price varchar, who_pays varchar, extra_info varchar);")
    # DBConnecter.execute_write_query(
    #     "CREATE TABLE availabilities (id varchar, shipping_id varchar REFERENCES shipping(id) ON DELETE CASCADE, "
    #     "date varchar, from_hour varchar, to_hour varchar, PRIMARY KEY (id,shipping_id));")
    # DBConnecter.execute_write_query("DROP TABLE users")
    # DBConnecter.execute_write_query("CREATE TABLE users (id varchar PRIMARY KEY, password_hash varchar);")
    # user = User.create_new_user('admin', 'admin')
    # user.insert_or_update()
    # print(User.get_all_elements())

    # shipping = Shipping.fromJson({
    #         'id': 'abcdefghijklmnop',
    #          'orderNumber': '22222',
    #          'orderImageAwsPath': "orderImages/default.png"
    #      })
    # shipping.insert_or_update()
    # print(DBConnecter.execute_read_query("select * from shipping;"))
