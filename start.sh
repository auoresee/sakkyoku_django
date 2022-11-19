#!/bin/bash
sleep 3 && python manage.py migrate && gunicorn sakkyoku.wsgi --bind 0.0.0.0
