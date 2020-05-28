import logging
import time

from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException
from selenium.webdriver.common.action_chains import ActionChains




class WhatsAppSender(object):
    CHROMEDRIVER_PATH = 'C:\\Users\\User\\Desktop\\chromedriver.exe'
    CHROME_PROFILE_PATH = r'C:\Users\User\AppData\Local\Google\Chrome\User Data\Profile 3'
    WHATSAPP_URL = "https://web.whatsapp.com/"
    GROUP_X_PATH = "//div[span/@title='{0}']"
    GROUP_NAME = 'test'
    CHAT_BOX_X_PATH = '//*[@id="main"]/footer/div[1]/div[2]/div/div[2]'

    def __init__(self):
        pass

    @staticmethod
    def _set_browser():
        chrome_options = webdriver.ChromeOptions()
        #chrome_options.add_argument('profile-directory=Default')
        chrome_options.add_argument("disable-extensions")
        chrome_options.add_argument(r"user-data-dir=C:\Users\User\AppData\Local\Google\Chrome\User Data")
        chrome_options.add_argument('--profile-directory=Profile 3')
        browser = webdriver.Chrome(chrome_options=chrome_options, executable_path=WhatsAppSender.CHROMEDRIVER_PATH)

        return browser

    @staticmethod
    def send_message_local(message):
        try:
            browser = WhatsAppSender._set_browser()

            browser.get(WhatsAppSender.WHATSAPP_URL)

            # Replace 'Friend's Name' with the name of your friend
            # or the name of a group

            WhatsAppSender._get_group_element(browser)

            WhatsAppSender._send_message_aux(browser, message)
        finally:
            WhatsAppSender._close_browser(browser)

    @staticmethod
    def _close_browser(browser):
        browser.quit()

    @staticmethod
    def _send_message_aux(browser, message):
        chatbox_x_path = WhatsAppSender.CHAT_BOX_X_PATH
        chatbox_delay = 15
        try:
            chatbox = WebDriverWait(browser, chatbox_delay).until(
                EC.presence_of_element_located((By.XPATH, chatbox_x_path)))
            for part in message.split('\n'):
                chatbox.send_keys(part)
                ActionChains(browser).key_down(Keys.SHIFT).key_down(Keys.ENTER).key_up(Keys.SHIFT).key_up(
                    Keys.ENTER).perform()
            chatbox.send_keys(Keys.ENTER)
        except TimeoutException:
            logging.ERROR('Was not able to load WhatsApp checkbox when trying to load it')

    @staticmethod
    def _get_group_element(browser):
        group_x_path = WhatsAppSender.GROUP_X_PATH.format(WhatsAppSender.GROUP_NAME)
        group_delay = 20  # seconds
        try:
            group = WebDriverWait(browser, group_delay).until(EC.presence_of_element_located((By.XPATH, group_x_path)))
            group.click()
        except TimeoutException:
            logging.ERROR('Was not able to load the WhatsApp website when trying to find group element')



