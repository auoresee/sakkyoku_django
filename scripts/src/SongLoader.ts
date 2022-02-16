import { sequencer } from "./SequencerInit";
import { Song } from "./Song";

const DOWNLOAD_URL = "api/songs/";

class SongLoader {
    requestSong(song_id: number) {
        $.ajax(
            {
                url: DOWNLOAD_URL + song_id,
                type:'GET',
                //data: "song_id="+song_id,
                data: "",
                cache: false,
                error:function(){},
                complete: (res) => this.processResponse(res)
            }
        );
    }

    processResponse(response: JQuery.jqXHR<any>) {
        let res = response.responseText;

        if(res.charAt(0) == "!"){   //error
            alert(res.substring(1));
            return;
        }
        if(res.charAt(0) != "{"){   //not json
            alert("Invalid response: " + res);
            return;
        }

        let json = JSON.parse(res);

        if (sequencer == null) {
            console.warn("sequencer is null");
            return;
        }

        (sequencer as any).userID = json.userID; // TODO
        sequencer.setMode(json.isMySong);

        let song = new Song();
        song.loadJSONObject(json.song);
        sequencer.setSong(song);
    }
}

export const songLoader = new SongLoader();
