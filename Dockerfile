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


FROM python:3.13-alpine
WORKDIR /usr/src/app

COPY requirements.txt ./
RUN pip install -r requirements.txt

COPY sakkyoku ./sakkyoku
COPY sakkyokuapp ./sakkyokuapp
COPY manage.py ./
COPY start.sh ./
COPY --from=js /home/node/app/dist ./sakkyokuapp/static/sakkyokuapp/javascript/
COPY --from=em /usr/src/app/build ./sakkyokuapp/static/sakkyokuapp/javascript/

CMD ["sh", "start.sh"]
