import base64
import logging
import pickle
import time

from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.action_chains import ActionChains




class WhatsAppSenderFirefox(object):
    DRIVER_PATH_FIREFOX = 'C:\\FirefoxDriver\\geckodriver.exe'
    CHROME_USERDATA_PATH = 'UserData'
    CHROME_PROFILE_DIR = 'Profile'
    WHATSAPP_URL = "https://web.whatsapp.com/"
    GROUP_X_PATH = "//div[span/@title='{0}']"
    GROUP_NAME = 'test'
    CHAT_BOX_X_PATH = '//*[@id="main"]/footer/div[1]/div[2]/div/div[2]'
    QR_CODE_IMG_PATH = 'qr_code\\img.png'

    def __init__(self):
        pass

    @staticmethod
    def _set_browser():
        # chrome_options = webdriver.ChromeOptions()
        # chrome_options.add_argument(r"user-data-dir={0}".format(WhatsAppSender.CHROME_USERDATA_PATH))
        # chrome_options.add_argument('--profile-directory={0}'.format(WhatsAppSender.CHROME_PROFILE_DIR))
        # chrome_options.add_argument("--window-size=1920,1080")
        # chrome_options.add_argument("--disable-extensions")
        # chrome_options.add_argument("--proxy-server='direct://'")
        # chrome_options.add_argument("--proxy-bypass-list=*")
        # chrome_options.add_argument("--start-maximized")
        # chrome_options.add_argument('--headless')
        # chrome_options.add_argument('--disable-gpu')
        # chrome_options.add_argument('--disable-dev-shm-usage')
        # chrome_options.add_argument('--no-sandbox')
        # chrome_options.add_argument('--ignore-certificate-errors')
        # chrome_options.add_argument("--remote-debugging-port=9222")
        #
        # browser = webdriver.Chrome(chrome_options=chrome_options, executable_path=WhatsAppSender.CHROMEDRIVER_PATH)
        #
        # return browser

        options = Options()
        #options.headless = True
        browser = webdriver.Firefox(options=options, executable_path=WhatsAppSenderFirefox.DRIVER_PATH_FIREFOX)

        cookies = pickle.load(open("cookies.pkl", "rb"))
        for cookie in cookies:
            browser.add_cookie(cookie)

        return browser

    @staticmethod
    def send_message_local(message):
        try:
            logging.info('Waiting for Browser')
            browser = WhatsAppSenderFirefox._set_browser()

            browser.get(WhatsAppSenderFirefox.WHATSAPP_URL)

            WhatsAppSenderFirefox._handle_qrcode(browser)

            pickle.dump(browser.get_cookies(), open("cookies.pkl", "wb"))

            WhatsAppSenderFirefox._get_group_element(browser)

            WhatsAppSenderFirefox._send_message_aux(browser, message)

        finally:
            WhatsAppSenderFirefox._close_browser(browser)

    @staticmethod
    def _close_browser(browser):
        browser.quit()

    @staticmethod
    def _send_message_aux(browser, message):
        chatbox_x_path = WhatsAppSenderFirefox.CHAT_BOX_X_PATH
        chatbox_delay = 100000
        try:
            chatbox = WebDriverWait(browser, chatbox_delay).until(
                EC.presence_of_element_located((By.XPATH, chatbox_x_path)))
            for part in message.split('\n'):
                chatbox.send_keys(part)
                ActionChains(browser).key_down(Keys.SHIFT).key_down(Keys.ENTER).key_up(Keys.SHIFT).key_up(
                    Keys.ENTER).perform()
            chatbox.send_keys(Keys.ENTER)
        except TimeoutException:
            logging.error('Was not able to load WhatsApp checkbox when trying to load it')

    @staticmethod
    def _get_group_element(browser):
        group_x_path = WhatsAppSenderFirefox.GROUP_X_PATH.format(WhatsAppSenderFirefox.GROUP_NAME)
        group_delay = 20  # seconds
        try:
            group = WebDriverWait(browser, group_delay).until(EC.presence_of_element_located((By.XPATH, group_x_path)))
            group.click()
        except TimeoutException:
            logging.error('Was not able to load the WhatsApp website when trying to find group element')

    @staticmethod
    def _handle_qrcode(browser):
        logging.info('Waiting for QE')
        try:
            WebDriverWait(browser, 13).until(EC.presence_of_element_located((By.CSS_SELECTOR, "canvas")))

        except TimeoutException:
            logging.info('No QR Code needed')
            return

        canvas = browser.find_element_by_css_selector("canvas")
        # get the canvas as a PNG base64 string
        canvas_base64 = browser.execute_script("return arguments[0].toDataURL('image/png').substring(21);", canvas)

        # decode
        canvas_png = base64.b64decode(canvas_base64)

        # save to a file
        with open(WhatsAppSenderFirefox.QR_CODE_IMG_PATH, 'wb') as f:
            f.write(canvas_png)

        time.sleep(20)


