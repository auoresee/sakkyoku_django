import { soundManager } from './SoundManager';
import { Track } from './Track';

export type InstrumentInfo = {
    name: string,
    displayName: string,
    play: (track: Track, noteNumber: number, duration: number, volume: number) => void,
    programChange: number | null,
    isDrum?: boolean
}

export const instrumentArray: InstrumentInfo[] = [      
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
            let pitch = 1;
            if(noteNumber == 35 || noteNumber == 36){
                soundManager.playSoundPitch("BassDrum", false, pitch, 1, track.gainNode);
            }
            else if(noteNumber == 38 || noteNumber == 40){
                soundManager.playSoundPitch("Snare", false, pitch, 1, track.gainNode);
            }
            else if(noteNumber == 42 || noteNumber == 44){
                soundManager.playSoundPitch("HihatClosed", false, pitch, 1, track.gainNode);
            }
            else if(noteNumber == 46 || noteNumber == 51 || noteNumber == 59){
                soundManager.playSoundPitch("HihatOpen", false, pitch, 5, track.gainNode);
            }
            else if(noteNumber == 49 || noteNumber == 57){
                soundManager.playSoundPitch("CrashCymbal", false, pitch, 5, track.gainNode);
            }
            if(noteNumber < 65) return;
            
            let frequency = calculateFrequency(noteNumber);
            if(frequency >= 1000){
                soundManager.playSoundPitch("CrashCymbal", false, pitch, 5, track.gainNode);
            }else if(frequency >= 700){
                soundManager.playSoundPitch("HihatOpen", false, pitch, 5, track.gainNode);
            }else if(frequency >= 450){
                soundManager.playSoundPitch("HihatClosed", false, pitch, 1, track.gainNode);
            }else if(frequency >= 250){
                soundManager.playSoundPitch("Snare", false, pitch, 1, track.gainNode);
            }else{
                soundManager.playSoundPitch("BassDrum", false, pitch, 1, track.gainNode);
            }
        },
        programChange: null, // TODO: GM Drumset
        // mapNote: (freq, midiNoteNumber) => {
        //     const frequency = calculateFrequency(midiNoteNumber);
        //     if(frequency >= 1000){
        //         return 49;
        //     }else if(frequency >= 700){
        //         return 46;
        //     }else if(frequency >= 450){
        //         return 42;
        //     }else if(frequency >= 250){
        //         return 38;
        //     }else{
        //         return 35;
        //     }
        // },
        isDrum: true
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

export const instrumentList: { [key: string]: InstrumentInfo } = {};
export const instrumentNameToID: { [key: string]: number } = {};
for (let i = 0; i < instrumentArray.length; i++){
    let instr = instrumentArray[i];
    instrumentList[instr.name] = instr;
    instrumentNameToID[instr.name] = i;
}

function calculateFrequency(noteNumber: number): number {
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

//純正律(テスト用)
function calculateFrequencyJust(noteNumber: number, tonic: number = 0): number {
    const c4 = 60;
    let c4rel = noteNumber - c4;
    let tonic4rel = c4rel - tonic;
    let octave = Math.floor(tonic4rel / 12.0);
    let octavemul = (1 << (octave + 10)) / 1024.0;
    let key = (tonic4rel + 120) % 12;    //floor remainder

    let ratio = [1, 10/9, 9/8, 6/5, 5/4, 4/3, 25/18, 3/2, 8/5, 5/3, 16/9, 15/8];

    let freq = [261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00, 415.30, 440.00, 466.16, 493.88];

    let tonicfreq = freq[tonic];

    let result = ratio[key] * tonicfreq * octavemul;
    /*if(sequencer != null && sequencer.song.songID == 20) {
        $("#status-text").append(""+result+"<br>");
    }*/
    return result;
}

export function loadSoundFiles(){
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


