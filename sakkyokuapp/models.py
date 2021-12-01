from django.db import models

# Create your models here.
class Song(models.Model):
    #曲データ
    songID = models.IntegerField('曲ID', primary_key=True)
    userID = models.IntegerField('ユーザーID')
    name = models.CharField('曲名', max_length=255)
    isOnRelease = models.BooleanField('公開設定')
    createdDate = models.DateTimeField('作成日時')
    releasedDate = models.DateTimeField('公開日時')
    lastUpdatedDate = models.DateTimeField('更新日時')

    def __str__(self):
        return self.name

    def as_dict(self):
        return {
            'songID': self.songID,
            'userID': self.userID,
            'name': self.name,
            'isOnRelease': self.isOnRelease,
            'createdDate': self.createdDate,
            'releasedDate': self.releasedDate,
            'lastUpdatedDate': self.lastUpdatedDate
        }


class User(models.Model):
    #ユーザーデータ
    userID = models.IntegerField('ユーザーID', primary_key=True)
    name = models.CharField('ユーザー名', max_length=255)

    def __str__(self):
        return str(self.user_id)