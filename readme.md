# デプロイ方法 (Docker)
.env.example を .env にコピーし、DBのパスワードを設定する (.env はコミットしない)
docker-compose build
docker-compose up -d
別途 nginx などを設定して、80 or 443番ポートを http://127.0.0.1:5200 に転送するようにする。
DBのポートは 127.0.0.1:5201 にのみ公開される。

.env のパスワードがDBに反映されるのは、DBのボリュームを初めて作るときだけ。
既存のボリュームのパスワードを変える場合は、DBに接続して ALTER USER で変更してから .env を合わせる。

# デプロイ方法 (手動, 開発時)
1. djangoをインストール
2. スーパーユーザー noverdi を作成
        python3 manage.py createsuperuser
3. mysqlpassword_.pyにパスワードを入力し、mysqlpassword.pyにファイル名を変更する (環境変数 SAKKYOKU_SQL_PASSWORD でもよい)
4. secretkey_.pyに秘密鍵を入力し、secretkey.pyに変更
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

9. サーバーを起動する
    python3 manage.py runserver