import $ from 'jquery';

//const SONGLIST_REQUEST_URL = "php/songlistmanager.php";
const SONGLIST_REQUEST_URL = "api/songs/";

const SONGLIST_RELEASE_ANY = 1;		//no matter whether released
const SONGLIST_RELEASE_TRUE = 2;		//released songs only
const SONGLIST_RELEASE_FALSE = 3;	//not released songs only

const SONGLIST_TARGET_ALL = 1;
const SONGLIST_TARGET_MY = 2;
const SONGLIST_TARGET_SPECIFIED_USER = 3;

const SONGLIST_SORT_LAST_UPDATED_DATE = 1;
const SONGLIST_SORT_RELEASED_DATE = 2;
const SONGLIST_SORT_CREATED_DATE = 3;
const SONGLIST_SORT_VOTE = 4;

const SONGLIST_TOP = 1;
const SONGLIST_MY = 2;

class IndexMain {

    initializer(){
        this.requestTopSongList();
        this.requestMySongList();
    }

    requestTopSongList(){
        let data = {
            target: SONGLIST_TARGET_ALL,
            release: SONGLIST_RELEASE_TRUE,
            sort: SONGLIST_SORT_RELEASED_DATE,
            offset: 0,
            num: 20
        }

        this.requestSongList(data, SONGLIST_TOP);
    }

    requestMySongList(){
        let data = {
            target: SONGLIST_TARGET_MY,
            release: SONGLIST_RELEASE_ANY,
            sort: SONGLIST_SORT_LAST_UPDATED_DATE,
            offset: 0,
            num: 30
        }

        this.requestSongList(data, SONGLIST_MY);
    }

    //sends GET request to download song list
    requestSongList(parameters, mode){
        $.ajax(
            {
                url: SONGLIST_REQUEST_URL,
                type:'GET',
                data: parameters,
                cache: false,
                error:function(){},
                complete: this.processSongListResponse.bind(this, mode),
            }
        );
    }

    checkResponseValidity(res){
        if(res.charAt(0) == "!"){   //error
            alert(res.substring(1));
            return false;
        }
        if(res.charAt(0) != "{"){   //not json
            alert("Invalid response: " + res);
            return false;
        }
        return true;
    }

    processSongListResponse(mode, response){
        let res = response.responseText;
        console.debug(res);

        if(!this.checkResponseValidity(res)){
            return;
        }

        let obj = JSON.parse(res);
        let song_list = obj.songs;

        this.setSongListToHTML(song_list, mode);
    }

    setSongListToHTML(song_list, mode){
        let html = "";
        song_list.forEach(element => {
            html += this.generateSongListRowHTML(element);
        });

        if(mode == SONGLIST_TOP){
            $("#top_song_list").html(html);
        }
        else if(mode == SONGLIST_MY){
            $("#my_song_list").html(html);
        }
    }

    generateSongListRowHTML(row){
        return '<a href="sequencer.html?song_id=' + row.songID + '">' + row.name + '</a><br>\n';
    }
}

let indexMain = new IndexMain();

window.addEventListener("load", indexMain.initializer.bind(indexMain));