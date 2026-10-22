import json

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from ...models import Song
from ...songmanager import SongError, SongManager, list_song_ids
from ...views import set_cur_dir

class Command(BaseCommand):
    help = "曲ファイル(sakkyokuapp/songs/*.song)からSongテーブルを作り直す"

    def handle(self, *args, **options):
        set_cur_dir()
        sm = SongManager()
        song_ids = sorted(list_song_ids())

        #途中で失敗した場合は、削除も含めて元に戻す
        with transaction.atomic():
            Song.objects.all().delete()     #全て削除

            for song_id in song_ids:
                try:
                    song = json.loads(SongManager.get_song(song_id))
                    if(not isinstance(song, dict) or song.get('songID') != song_id):
                        raise SongError("songID does not match the file name")
                    sm.register_song(song)
                except (OSError, ValueError, SongError) as e:
                    raise CommandError("%d.song: %s" % (song_id, e))

        self.stdout.write("Registered %d songs: %s" % (len(song_ids), song_ids))
