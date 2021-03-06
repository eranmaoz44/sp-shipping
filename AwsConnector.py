import json
import logging
import os

import boto3
from botocore.exceptions import ClientError


class AwsConnector(object):


    @staticmethod
    def delete_file(file_name):
        s3_bucket = os.environ.get('S3_BUCKET')

        s3_client = boto3.resource("s3").Bucket(s3_bucket)

        response = s3_client.Object(file_name).delete()

        return response['ResponseMetadata']

    @staticmethod
    def create_presigned_post_file_upload(file_name):
        s3_bucket = os.environ.get('S3_BUCKET_INPUT')
        return json.dumps(AwsConnector.create_presigned_post(s3_bucket, file_name))



    @staticmethod
    def create_presigned_post(bucket_name, object_name,
                              fields=None, conditions=None, expiration=3600):
        """Generate a presigned URL S3 POST request to upload a file

        :param bucket_name: string
        :param object_name: string
        :param fields: Dictionary of prefilled form fields
        :param conditions: List of conditions to include in the policy
        :param expiration: Time in seconds for the presigned URL to remain valid
        :return: Dictionary with the following keys:
            url: URL to post to
            fields: Dictionary of form fields and values to submit with the POST
        :return: None if error.
        """

        # Generate a presigned S3 POST URL
        s3_client = boto3.client('s3')
        try:
            response = s3_client.generate_presigned_post(bucket_name,
                                                         object_name,
                                                         Fields=fields,
                                                         Conditions=conditions,
                                                         ExpiresIn=expiration)
        except ClientError as e:
            logging.error(e)
            return None

        # The response contains the presigned URL and required fields
        return response


    @staticmethod
    def create_presigned_url_file_download(file_name):
        s3_bucket = os.environ.get('S3_BUCKET')
        return AwsConnector.create_presigned_url(s3_bucket, file_name)


    @staticmethod
    def create_presigned_url(bucket_name, object_name, expiration=3600):
        """Generate a presigned URL to share an S3 object

        :param bucket_name: string
        :param object_name: string
        :param expiration: Time in seconds for the presigned URL to remain valid
        :return: Presigned URL as string. If error, returns None.
        """

        # Generate a presigned URL for the S3 object
        s3_client = boto3.client('s3')
        try:
            response = s3_client.generate_presigned_url('get_object',
                                                        Params={'Bucket': bucket_name,
                                                                'Key': object_name},
                                                        ExpiresIn=expiration)
        except ClientError as e:
            logging.error(e)
            return None

        # The response contains the presigned URL
        return response
