from .models import Song

class SongManager:
    SONGLIST_RELEASE_ANY = 1		#no matter whether released
    SONGLIST_RELEASE_TRUE = 2		#released songs only
    SONGLIST_RELEASE_FALSE = 3	#not released songs only

    SONGLIST_TARGET_ALL = 1
    SONGLIST_TARGET_MY = 2
    SONGLIST_TARGET_SPECIFIED_USER = 3

    SONGLIST_SORT_LAST_UPDATED_DATE = 1
    SONGLIST_SORT_RELEASED_DATE = 2
    SONGLIST_SORT_CREATED_DATE = 3
    SONGLIST_SORT_VOTE = 4

    def __init__(self) -> None:
        pass

    #returns: Song[]
    def get_song_list(targetUserID, release, sort, num, offset):
        songs = Song.objects

        if(targetUserID != -1):
            songs = songs.filter(user_id=targetUserID)

        if(release == SongManager.SONGLIST_RELEASE_TRUE):
            songs = songs.filter(is_on_release=True)
        elif(release == SongManager.SONGLIST_RELEASE_FALSE):
            songs = songs.filter(is_on_release=False)

        if(sort == SongManager.SONGLIST_SORT_RELEASED_DATE):
            songs = songs.order_by('released_date')
        if(sort == SongManager.SONGLIST_SORT_CREATED_DATE):
            songs = songs.order_by('created_date')
        else:
            songs = songs.order_by('last_updated_date')

        return songs[offset:offset+num]
    
