# デプロイ方法 (Docker)
docker-compose build
docker-compose up -d
別途 nginx などを設定して、80 or 443番ポートを http://127.0.0.1:5200 に転送するようにする。

# デプロイ方法 (手動, 開発時)
1. djangoをインストール
2. スーパーユーザー noverdi を作成
        python3 manage.py createsuperuser
3. mysqlpassword_.pyにパスワードを入力し、mysqlpassword.pyにファイル名を変更する
4. secretkey_.pyに秘密鍵を入力し、secretkey.pyに変更
4. settings.py の DATABASE の HOST を変える (localhost にDBがあるなら '' でよい)
5. python3 manage.py makemigrations
6. python3 manage.py migrate
7. サーバーを起動し、データベースを構築する
   /admin/db/にアクセスし、SQLパスワードを入力
8. Typescript ファイルをビルドする
```bash
cd scripts
npm install --also=dev
npm run build
cp dist/* ../sakkyokuapp/static/sakkyokuapp/javascript/
```

9. サーバーを起動する
    python3 manage.py runserver