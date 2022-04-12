FROM node:lts AS js
WORKDIR /home/node/app

COPY scripts/package.json scripts/package-lock.json ./
RUN npm install

COPY scripts ./
RUN npm run build


FROM python:3.9-alpine
WORKDIR /usr/src/app

COPY sakkyoku ./sakkyoku
COPY sakkyokuapp ./sakkyokuapp
COPY manage.py ./
COPY --from=js /home/node/app/dist ./sakkyokuapp/static/sakkyokuapp/javascript/
