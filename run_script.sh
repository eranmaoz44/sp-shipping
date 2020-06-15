#!/bin/bash

source /root/code/sp-shipping/venv/bin/activate

export DEPLOY_ENV=REMOTE
export SECRET_KEY=19B7BbcCJh70
export AWS_ACCESS_KEY_ID=AKIAJ3BME4K6KN7VIE6Q
export AWS_SECRET_ACCESS_KEY=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
export S3_BUCKET=spshippingbucket
export DATABASE_URL=postgres://ifuifsuambntzz:783ea378cd5d02b1064bf3e8d67f44f9889f092036a61a780d89dbcad62d7bf5@ec2-23-21-115-109.compute-1.amazonaws.com:5432/d8kgfj5125alnk

nohup /root/code/sp-shipping/venv/bin/gunicorn --bind 127.0.0.1:8005 --workers=3 wsgi:application --timeout 120 --capture-output --enable-stdio-inheritance &
