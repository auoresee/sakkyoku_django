#!/bin/bash
python manage.py migrate && gunicorn sakkyoku.wsgi --bind 0.0.0.0
