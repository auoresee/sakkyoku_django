# 開発用 (docker-compose.yml) は dev、本番用 (docker-compose.prod.yml) は prod のステージを使う
# 本番用は音源(SoundFont)を scripts/sf2js/ に別途置いてからビルドする。
# ファイル名は SF2 で指定する (既定は FluidR3_GM.sf2。docker-compose.prod.yml は .env の SAKKYOKU_SF2 を渡す)

FROM node:24-alpine AS js
WORKDIR /home/node/app

COPY scripts/package.json scripts/package-lock.json ./
RUN npm ci

COPY scripts ./
RUN npm run build


FROM emscripten/emsdk:6.0.12 AS em
ARG SF2=FluidR3_GM.sf2
WORKDIR /usr/src/app
COPY scripts/sf2js ./
RUN make -B wasm SF2="$SF2" && mkdir build && cp tfs.data tfs.js tfs.wasm build/


FROM python:3.13-alpine AS base
WORKDIR /usr/src/app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# アプリは root ではなく専用ユーザーで動かす
RUN addgroup -S -g 1000 app && adduser -S -D -u 1000 -G app app


# 開発用: ソースはホストのディレクトリを /usr/src/app にマウントして使う
FROM base AS dev
USER app
EXPOSE 8000
CMD ["sh", "-c", "python manage.py migrate && exec python manage.py runserver 0.0.0.0:8000"]


FROM base AS prod
COPY sakkyoku ./sakkyoku
COPY sakkyokuapp ./sakkyokuapp
COPY manage.py start.sh ./
COPY --from=js /home/node/app/dist ./sakkyokuapp/static/sakkyokuapp/javascript/
COPY --from=em /usr/src/app/build ./sakkyokuapp/static/sakkyokuapp/javascript/

# 静的ファイルを STATIC_ROOT に集める (設定の読み込みに必要なだけの仮の値を渡す)
RUN DEPLOY_ENV=dev SAKKYOKU_SECRET_KEY=collectstatic-only SAKKYOKU_SQL_PASSWORD=collectstatic-only \
    python manage.py collectstatic --noinput

# ソースは root の所有のまま読み取り専用にし、曲ファイルの保存先(ボリューム)だけを書き込めるようにする
RUN chown app:app sakkyokuapp/songs
USER app
EXPOSE 8000
CMD ["sh", "start.sh"]
