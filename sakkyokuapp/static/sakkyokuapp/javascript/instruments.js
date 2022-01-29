var instrumentArray = [      
    {
        name: "Piano",
        displayName: "ピアノ",
        play: function(track, noteNumber, duration, volume) {
            let frequency = calculateFrequency(noteNumber);
            let pitch = frequency / 440.0;
            soundManager.playSoundPitch("piano_A4", false, pitch, duration, track.gainNode);
        },
        programChange: 0
    },
                
    {
        name: "RockOrgan",
        displayName: "オルガン",
        play: function(track, noteNumber, duration, volume) {
            let frequency = calculateFrequency(noteNumber);
            let pitch = frequency / 440.0;
            soundManager.playSoundPitch("RockOrgan_A4", false, pitch, duration, track.gainNode);
        },
        programChange: 18
    },
    
    //played 2 octave lower than note position
    {
        name: "FingerBass",
        displayName: "ベース",
        play: function(track, noteNumber, duration, volume) {
            let frequency = calculateFrequency(noteNumber);
            let pitch = frequency / 220.0;
            soundManager.playSoundPitch("FingerBass_A2", false, pitch, duration, track.gainNode);
        },
        programChange: 33
    },

    {
        name: "Percussion",
        displayName: "ドラム",
        play: function(track, noteNumber, duration, volume) {
            let frequency = calculateFrequency(noteNumber);
            let pitch = 1;
            if(frequency >= 1000){
                soundManager.playSoundPitch("CrashCymbal", false, pitch, duration, track.gainNode);
            }else if(frequency >= 700){
                soundManager.playSoundPitch("HihatOpen", false, pitch, duration, track.gainNode);
            }else if(frequency >= 450){
                soundManager.playSoundPitch("HihatClosed", false, pitch, duration, track.gainNode);
            }else if(frequency >= 250){
                soundManager.playSoundPitch("Snare", false, pitch, duration, track.gainNode);
            }else{
                soundManager.playSoundPitch("BassDrum", false, pitch, duration, track.gainNode);
            }
        },
        programChange: null, // TODO: GM Drumset
        mapNote: (freq, midiNoteNumber) => {
            if(frequency >= 1000){
                return 49;
            }else if(frequency >= 700){
                return 46;
            }else if(frequency >= 450){
                return 42;
            }else if(frequency >= 250){
                return 38;
            }else{
                return 35;
            }
        }
    },

    {
        name: "Strings",
        displayName: "ストリングス",
        play: function(track, noteNumber, duration, volume) {
            let frequency = calculateFrequency(noteNumber);
            let pitch = frequency / 440.0;
            soundManager.playSoundPitch("Strings_A4", false, pitch, duration, track.gainNode);
        },
        programChange: 48
    },

    {
        name: "SopranoSax",
        displayName: "サックス",
        play: function(track, noteNumber, duration, volume) {
            let frequency = calculateFrequency(noteNumber);
            let pitch = frequency / 440.0;
            soundManager.playSoundPitch("SopranoSax_A4", false, pitch, duration, track.gainNode);
        },
        programChange: 64
    },

    {
        name: "ODGuitar",
        displayName: "エレキギター",
        play: function(track, noteNumber, duration, volume) {
            let frequency = calculateFrequency(noteNumber);
            let pitch = frequency / 440.0;
            soundManager.playSoundPitch("ODGuitar_A4", false, pitch, duration, track.gainNode);
        },
        programChange: 29
    },

    {
        name: "EPiano2",
        displayName: "Eピアノ",
        play: function(track, noteNumber, duration, volume) {
            let frequency = calculateFrequency(noteNumber);
            let pitch = frequency / 440.0;
            soundManager.playSoundPitch("EPiano2_A4", false, pitch, duration, track.gainNode);
        },
        programChange: 5
    },

    {
        name: "SquareLead",
        displayName: "シンセリード",
        play: function(track, noteNumber, duration, volume) {
            let frequency = calculateFrequency(noteNumber);
            let pitch = frequency / 440.0;
            soundManager.playSoundPitch("SquareLead_A4", false, pitch, duration, track.gainNode);
        },
        programChange: 80
    },

    {
        name: "SynthBell",
        displayName: "ベル",
        play: function(track, noteNumber, duration, volume) {
            let frequency = calculateFrequency(noteNumber);
            let pitch = frequency / 440.0;
            soundManager.playSoundPitch("SynthBell_A6", false, pitch, duration, track.gainNode);
        },
        programChange: 84
    },
];

instrumentList = [];
instrumentNameToID = [];
for (let i = 0; i < instrumentArray.length; i++){
    let instr = instrumentArray[i];
    instrumentList[instr.name] = instr;
    instrumentNameToID[instr.name] = i;
}

function calculateFrequency(noteNumber){
    const c4 = 60;
    let c4rel = noteNumber - c4;
    let octave = Math.floor(c4rel / 12.0);
    let octavemul = (1 << (octave + 10)) / 1024.0;
    let key = (c4rel + 120) % 12;    //floor remainder
    let freq = [261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00, 415.30, 440.00, 466.16, 493.88];
    
    let result = freq[key] * octavemul;
    /*if(sequencer != null && sequencer.song.songID == 20) {
        $("#status-text").append(""+result+"<br>");
    }*/
    return result;
}

function loadSoundFiles(){
    soundManager.loadSound("piano_A4", "sound/piano_A4.wav");
    soundManager.loadSound("RockOrgan_A4", "sound/RockOrgan_A4.wav");
    soundManager.loadSound("SopranoSax_A4", "sound/SopranoSax_A4.wav");
    soundManager.loadSound("Strings_A4", "sound/Strings_A4.wav");
    soundManager.loadSound("FingerBass_A2", "sound/FingerBass_A2.wav");
    soundManager.loadSound("CrashCymbal", "sound/CrashCymbal.wav");
    soundManager.loadSound("HihatOpen", "sound/HihatOpen.wav");
    soundManager.loadSound("HihatClosed", "sound/HihatClosed.wav");
    soundManager.loadSound("Snare", "sound/Snare.wav");
    soundManager.loadSound("BassDrum", "sound/BassDrum.wav");
    soundManager.loadSound("ODGuitar_A4", "sound/ODGuitar_A4.wav");
    soundManager.loadSound("EPiano2_A4", "sound/EPiano2_A4.ogg");
    soundManager.loadSound("SquareLead_A4", "sound/SquareLead_A4.wav");
    soundManager.loadSound("SynthBell_A6", "sound/SynthBell_A6.ogg");
}


