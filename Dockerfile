FROM node:lts AS js
WORKDIR /home/node/app

COPY scripts/package.json scripts/package-lock.json ./
RUN npm install

COPY scripts ./
RUN npm run build


FROM emscripten/emsdk:latest AS em
WORKDIR /usr/src/app
COPY scripts/sf2js ./
RUN make wasm
RUN mkdir build
RUN cp tfs.data tfs.js tfs.wasm build/


FROM python:3.9-alpine
WORKDIR /usr/src/app

COPY requirements.txt ./
RUN pip install -r requirements.txt

COPY sakkyoku ./sakkyoku
COPY sakkyokuapp ./sakkyokuapp
COPY manage.py ./
COPY start.sh ./
COPY --from=js /home/node/app/dist ./sakkyokuapp/static/sakkyokuapp/javascript/
COPY --from=em /usr/src/app/build ./sakkyokuapp/static/sakkyokuapp/javascript/

RUN sed "s/sql password here/noverdi/" ./sakkyoku/mysqlpassword_.py > ./sakkyoku/mysqlpassword.py
RUN sed "s/secret key here/ao40a34jjiojj09j0wjbksljq/" ./sakkyoku/secretkey_.py > ./sakkyoku/secretkey.py

CMD ["sh", "start.sh"]
