# デプロイ方法 (Docker)
.env.example を .env にコピーし、DBのパスワードと秘密鍵を設定する (.env はコミットしない)
docker-compose build
docker-compose up -d
別途 nginx などを設定して、443番ポート(HTTPS)を http://127.0.0.1:5200 に転送するようにする。
アプリは本番設定(DEBUG無効、HTTPSへのリダイレクト、Secure Cookie、HSTS)で起動するため、
プロキシでは Host と X-Forwarded-Proto を必ず設定する。
```
proxy_set_header Host $host;
proxy_set_header X-Forwarded-Proto $scheme;
```
アプリのポートは 127.0.0.1:5200、DBのポートは 127.0.0.1:5201 にのみ公開される。
(docker-compose.yml では SAKKYOKU_HTTPS=proxy を指定している。下記「本番のHTTPS設定」を参照)

.env のパスワードがDBに反映されるのは、DBのボリュームを初めて作るときだけ。
既存のボリュームのパスワードを変える場合は、DBに接続して ALTER USER で変更してから .env を合わせる。

# 本番のHTTPS設定
本番 (DEPLOY_ENV=production、wsgi.py 経由で起動した場合の既定) では、HTTPSの受け方を
環境変数 SAKKYOKU_HTTPS か sakkyoku/_env_prod.py の ENV_HTTPS で指定する。未指定では起動しない。
- proxy: nginx などのリバースプロキシでTLSを終端する。プロキシで Host と X-Forwarded-Proto を設定し、
  アプリのポートにはプロキシ以外から接続できないようにする
- direct: WSGIサーバー自身がHTTPSで受ける (Apache + mod_wsgi でTLSを扱う場合など)
- off: HTTPSを使わない (非推奨)

構成と合わない値にすると、HTTPSへのリダイレクトがループしたり、ログインや曲の保存ができなくなる。

# デプロイ方法 (手動, 開発時)
1. djangoをインストール
2. スーパーユーザー noverdi を作成
        python3 manage.py createsuperuser
3. mysqlpassword_.pyにパスワードを入力し、mysqlpassword.pyにファイル名を変更する (環境変数 SAKKYOKU_SQL_PASSWORD でもよい)
4. secretkey_.pyに秘密鍵を入力し、secretkey.pyに変更 (環境変数 SAKKYOKU_SECRET_KEY でもよい)
4. settings.py の DATABASE の HOST を変える (localhost にDBがあるなら '' でよい)
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

9. 環境変数 DEPLOY_ENV を設定してサーバーを起動する (開発時は dev。未設定ではエラーになる)
    DEPLOY_ENV=dev python3 manage.py runserver