from django.db import models

# Create your models here.
class Song(models.Model):
    """曲データ"""
    song_id = models.IntegerField('曲ID', primary_key=True)
    user_id = models.IntegerField('ユーザーID')
    name = models.CharField('曲名', max_length=255)
    is_on_release = models.BooleanField('公開設定')
    created_date = models.DateTimeField('作成日時')
    released_date = models.DateTimeField('公開日時')
    last_updated_date = models.DateTimeField('更新日時')

    def __str__(self):
        return self.name

    def as_dict(self):
        