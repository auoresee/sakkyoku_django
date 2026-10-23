# 開発環境 (Docker)
docker-compose.yml は開発用。Django の開発サーバー、TypeScript のビルド、MariaDB をコンテナで動かす。
ソースはホストのディレクトリをそのまま使うので、編集はすぐ反映される。

1. .env.example を .env にコピーし、DBのパスワード2つと秘密鍵を設定する (.env はコミットしない)。
   Linux では SAKKYOKU_UID / SAKKYOKU_GID にホストの利用者の `id -u` / `id -g` の値も設定する
2. 音源(SoundFont)を別途入手して scripts/sf2js/ に置き、音源(WASM)をビルドする。
   初回と、scripts/sf2js/bridge.c や音源を変えたときだけでよい。
   既定のファイル名は FluidR3_GM.sf2。別の音源を使う場合は .env の SAKKYOKU_SF2 にファイル名を設定する
   (General MIDI 配置の音源であること。楽器は instruments.ts の programChange の番号で選ばれる)
   ```bash
   docker compose run --rm wasm
   ```
3. 起動する。http://localhost:8000 で開ける
   ```bash
   docker compose up -d
   docker compose logs -f js     # TypeScript のビルドのログ
   ```
   - web: Django の開発サーバー (DEPLOY_ENV=dev、DEBUG有効)。起動時に migrate する
   - js: scripts/src を監視してビルドし、sakkyokuapp/static/sakkyokuapp/javascript/ に出力する
   - db: MariaDB。ホストからは 127.0.0.1:5201 で接続できる
4. 管理画面 (/admin/) を使う場合は、スーパーユーザーを作る
   ```bash
   docker compose exec web python manage.py createsuperuser
   ```
5. 曲ファイルはホストの sakkyokuapp/songs/ に保存される (git には含めない)。
   DBを消したなどで食い違った場合は、曲ファイルからDBを作り直す
   ```bash
   docker compose exec web python manage.py reconstruct_db
   ```
6. 停止は `docker compose down`。DBのデータも消す場合は `docker compose down -v`

# 本番 (Docker、将来用)
docker-compose.prod.yml は本番用 (gunicorn、DEPLOY_ENV=production)。
1. .env に、上記に加えて SAKKYOKU_ALLOWED_HOSTS (公開するホスト名) を設定する
2. 音源を scripts/sf2js/ に置いてからビルド・起動する (TypeScript と音源はイメージの中でビルドする)。
   FluidR3_GM.sf2 以外の音源は .env の SAKKYOKU_SF2 で指定する
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```
3. Apache や nginx で、443番ポート(HTTPS)を http://127.0.0.1:5200 に転送する。
   アプリは本番設定(DEBUG無効、HTTPSへのリダイレクト、Secure Cookie、HSTS)で起動するため、
   プロキシでは Host、X-Forwarded-Proto、X-Forwarded-For を必ず渡す
   ```
   # Apache (mod_proxy, mod_headers)。X-Forwarded-For は mod_proxy が自動で付ける
   ProxyPreserveHost On
   RequestHeader set X-Forwarded-Proto "https"
   ProxyPass        / http://127.0.0.1:5200/
   ProxyPassReverse / http://127.0.0.1:5200/

   # nginx
   proxy_set_header Host $host;
   proxy_set_header X-Forwarded-Proto $scheme;
   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   ```
   X-Forwarded-For が無いと全ての利用者が同じ接続元として扱われ、下記の作成数の上限を共有してしまう。

- アプリのポートは 127.0.0.1:5200 にのみ公開し、DBのポートは公開しない
- 曲ファイルは songs ボリュームに、DBは dbdata ボリュームに置かれる。バックアップは両方まとめて取る
- アプリはコンテナの中で root ではなく専用ユーザー (app) で動く
- .env のパスワードがDBに反映されるのは、DBのボリュームを初めて作るときだけ。
  既存のボリュームのパスワードを変える場合は、DBに接続して ALTER USER で変更してから .env を合わせる

# 本番のHTTPS設定
本番 (DEPLOY_ENV=production、wsgi.py 経由で起動した場合の既定) では、HTTPSの受け方を
環境変数 SAKKYOKU_HTTPS か sakkyoku/_env_prod.py の ENV_HTTPS で指定する。未指定では起動しない。
- proxy: Apache や nginx などのリバースプロキシでTLSを終端する。プロキシで Host と X-Forwarded-Proto を設定し、
  アプリのポートにはプロキシ以外から接続できないようにする
- direct: WSGIサーバー自身がHTTPSで受ける (Apache + mod_wsgi でTLSを扱う場合など)
- off: HTTPSを使わない (非推奨)

構成と合わない値にすると、HTTPSへのリダイレクトがループしたり、ログインや曲の保存ができなくなる。

# 曲の作成数・サイズの上限
sakkyokuapp/views.py の定数で設定している。
- 新しい曲(MIDIのインポートを含む)は、接続元ごとに1時間あたり30曲まで。数はプロセスごとのキャッシュで数えるため、
  gunicorn などを複数プロセスで動かす場合は settings.py の CACHES を共有のキャッシュ(DBやRedisなど)にする
- 1人の利用者が持てる曲は300曲まで
- インポートできるMIDIファイルは1MBまで

アプリ側の上限に加えて、プロキシでもリクエストの大きさと頻度を制限する (Apache の LimitRequestBody や mod_ratelimit / mod_evasive、nginx の client_max_body_size や limit_req)。

# デプロイ方法 (手動。Apache + mod_wsgi の本番など)
1. Python 3.10 以上の環境に requirements.txt をインストールする
        pip install -r requirements.txt
2. スーパーユーザー noverdi を作成
        python3 manage.py createsuperuser
3. mysqlpassword_.pyにパスワードを入力し、mysqlpassword.pyにファイル名を変更する (環境変数 SAKKYOKU_SQL_PASSWORD でもよい)
4. secretkey_.pyに秘密鍵を入力し、secretkey.pyに変更 (環境変数 SAKKYOKU_SECRET_KEY でもよい)
4. DBが別のマシンにある場合は、環境変数 SAKKYOKU_DB_HOST (と SAKKYOKU_DB_PORT) で接続先を指定する (同じマシンなら不要)
5. python3 manage.py makemigrations
6. python3 manage.py migrate
7. 曲ファイルからデータベースを構築する
        python3 manage.py reconstruct_db
8. Typescript ファイルをビルドする
```bash
cd scripts
npm install --also=dev
./build_dev.sh
```
   音源は scripts/sf2js/FluidR3_GM.sf2 を使う。別の音源は環境変数 SF2 で指定する (例: SF2=xxx.sf2 ./build_dev.sh)

9. 環境変数 DEPLOY_ENV を設定してサーバーを起動する (開発時は dev。未設定ではエラーになる)
    DEPLOY_ENV=dev python3 manage.py runserver
10. 本番では静的ファイルを集め、Apache で /static/ として配信する (管理画面のCSSなどを含む)
        DEPLOY_ENV=prod python3 manage.py collectstatic
    ```
    Alias /static/ /path/to/sakkyoku_django/staticfiles/
    <Directory /path/to/sakkyoku_django/staticfiles>
        Require all granted
    </Directory>
    ```
    本番 (wsgi.py 経由) では、sakkyoku/_env_prod.py に ENV_SAKKYOKU_VIEW_BASE_DIR、ENV_DOMAIN_NAME、
    ENV_DEPLOY_IP、ENV_HTTPS を書く (環境変数 SAKKYOKU_VIEW_BASE_DIR、SAKKYOKU_ALLOWED_HOSTS、SAKKYOKU_HTTPS でもよい)