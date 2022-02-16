1. djangoをインストール
2. スーパーユーザー noverdi を作成
        python3 manage.py createsuperuser
3. mysqlpassword_.pyにパスワードを入力し、mysqlpassword.pyにファイル名を変更する
4. secretkey_.pyに秘密鍵を入力し、secretkey.pyに変更
5. python3 manage.py makemigrations
6. python3 manage.py migrate
7. サーバーを起動し、データベースを構築する
   /admin/db/にアクセスし、SQLパスワードを入力
8. Typescript ファイルをビルドする
```bash
cd scripts
npm install --also=dev
npm run build
```
   
# サーバーの起動
    python3 manage.py runserver