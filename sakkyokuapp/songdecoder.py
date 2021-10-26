import json
from .models import Song

class SongJSONEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, Song): # NotSettedParameterは'NotSettedParameter'としてエンコード
            return super(MyJSONEncoder, self).default(o.as_dict())
        return super(MyJSONEncoder, self).default(o) # 他の型はdefaultのエンコード方式を使用