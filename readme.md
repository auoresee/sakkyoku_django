1. djangoをインストール
2. スーパーユーザー noverdi を作成
        python3 manage.py createsuperuser
3. mysqlpassword_.pyにパスワードを入力し、mysqlpassword.pyにファイル名を変更する
4. python3 manage.py makemigrations
5. python3 manage.py migrate
   
# サーバーの起動
    python3 manage.py runserver