
/**
 * Piano Part of the Piano roll
 */
class Piano {
    constructor(sharpHeight, adgHeight, bcefHeight, track) {
        this.track = track;
        this.blackfillStyle = "#aae3ab";
        this.whitefillStyle = "#ddf4fc";
        this.strokeStyle = "#FA6";
        this.whiteWidth = 50;
        Piano.whiteWidth = this.whiteWidth;
        this.whiteCanvas = document.getElementById('white-keys');
        this.blackCanvas = document.getElementById('black-keys');
        this.whiteContext = this.whiteCanvas.getContext("2d");
        this.blackContext = this.blackCanvas.getContext("2d");
        this.keys = [];
        this.sharpHeight = sharpHeight;
        this.adgHeight = adgHeight;
        this.bcefHeight = bcefHeight;
        this.blackOffset = sharpHeight / 2;
        this.octaveHeight = 3 * this.adgHeight + 4 * this.bcefHeight; //The height of an entire octave is 7 x the height of a white key
        this.piano = document.getElementById('piano');
        this.container = document.getElementById('piano-container');
        this.blackKeyLookup = [];
        this.whiteKeyLookup = [];
        this.pastKey = null;
    }

    drawNote(key, highlight) {
        if (key == undefined) {
            return;
        }
        if (highlight) {
            if (key.black) {
                key.draw(this.blackContext, this.blackfillStyle, this.strokeStyle);
            }
            else {
                key.draw(this.whiteContext, this.whitefillStyle, this.strokeStyle);
            }
        }
        else {
            if (key.black) {
                key.draw(this.blackContext);
            }
            else {
                key.draw(this.whiteContext);
            }
        }
    }

    drawPiano(startKey, startOctave, numKeys) {
        this.height = 0;
        var notes = ['g#', 'g', 'f#', 'f', 'e', 'd#', 'd', 'c#', 'c', 'b', 'a#', 'a'];
        var mappings = [8, 7, 6, 5, 4, 3, 2, 1, 0, 11, 10, 9];
        var notesOffset = [
            this.blackOffset,
            this.adgHeight - this.blackOffset,
            this.blackOffset,
            this.bcefHeight,
            this.bcefHeight - this.blackOffset,
            this.blackOffset,
            this.adgHeight - this.blackOffset,
            this.blackOffset,
            this.bcefHeight,
            this.bcefHeight - this.blackOffset,
            this.blackOffset,
            this.adgHeight - this.blackOffset
        ];
        var startindex = notes.indexOf(startKey);
        var startNote = 12 * startOctave - 8 + mappings[startindex];
        var octave = startOctave;
        var nextY = 0;
        for (var i = 0, j = startindex; i < numKeys; i++, j = (j + 1) % 12) {
            var frequency = Math.pow(2, (Math.abs(startNote - i) - 49) / 12) * 440;
            if (notes[j][1] == '#') {
                this.keys[i] = new PianoKey(nextY, this.sharpHeight, notes[j], octave, frequency);
            }
            else if (notes[j] == 'a' || notes[j] == 'd' || notes[j] == 'g') {
                this.height += this.adgHeight;
                this.keys[i] = new PianoKey(nextY, this.adgHeight, notes[j], octave, frequency);
            }
            else {
                this.height += this.bcefHeight;
                this.keys[i] = new PianoKey(nextY, this.bcefHeight, notes[j], octave, frequency);
            }
            if (this.keys[i].note == 'c') {
                octave -= 1;
            }
            nextY += notesOffset[j];
        }

        //create lookup table for black keys
        for (var i = 0; i < 12; i++) {
            if (this.keys[i].black) {
                for (var j = 0, k = this.keys[i].y; j < this.keys[i].height; j++, k++) {
                    this.blackKeyLookup[k] = i;
                }
            }
        }
        //create lookup table for white keys
        for (var i = 0; i < 12; i++) {
            if (!this.keys[i].black) {
                for (var j = 0, k = this.keys[i].y; j < this.keys[i].height; j++, k++) {
                    this.whiteKeyLookup[k] = i;
                }
            }
        }
        if (this.keys[this.keys.length - 1].black) {
            this.height += this.blackOffset;
        }

        this.piano.style.height = this.height + "px";
        this.whiteCanvas.height = this.height;
        this.blackCanvas.height = this.height;
        for (var i = 0; i < this.keys.length; i++) {
            if (this.keys[i].black) {
                this.keys[i].draw(this.blackContext);
            }
            else {
                this.keys[i].draw(this.whiteContext);
            }
        }
        this.piano.onmousedown = (function (e) {
            var x = e.pageX - this.piano.offsetLeft;
            var y = e.pageY - this.piano.offsetTop + this.container.scrollTop;
            var key = this.getKey(x, y);
            this.playNote(key);
        }).bind(this);

        this.piano.onmousemove = (function (e) {
            var x = e.pageX - this.piano.offsetLeft;
            var y = e.pageY - this.piano.offsetTop + this.container.scrollTop;
            var key = this.getKey(x, y);
            if (key != this.pastKey) {
                this.drawNote(key, true);
                if (this.pastKey != null) {
                    this.drawNote(this.pastKey, false);
                }
                this.pastKey = key;
            }
        }).bind(this);

        this.piano.onmouseout = (function () {
            this.drawNote(this.pastKey, false);
        }).bind(this);

    }

    getHeight() {
        return this.keys[this.keys.length - 1].y + this.keys[this.keys.length - 1].height;
    }

    playNote(key) {
        if (key == undefined || key == null) {
            return;
        }
        this.track.playNote(key.frequency, 0, 1, 1);
    }

    getKey(x, y) {
        var relativeYOffset = y % this.octaveHeight;
        var octaveOffset = 12 * Math.floor(y / this.octaveHeight);
        if (x > Piano.whiteWidth / 2) {
            return this.keys[this.whiteKeyLookup[relativeYOffset] + octaveOffset];
        }
        else {
            if (y > this.octaveHeight * Math.floor(y / this.octaveHeight) && y < this.octaveHeight * Math.floor(y / this.octaveHeight) + this.blackOffset) {
                return this.keys[this.blackKeyLookup[this.octaveHeight] + octaveOffset - 12];
            }
            return this.keys[this.blackKeyLookup[relativeYOffset] + octaveOffset] || this.keys[this.whiteKeyLookup[relativeYOffset] + octaveOffset];
        }
    }
}


class PianoKey {
    constructor(y, height, note, octave, frequency) {
        this.octave = octave;
        this.frequency = frequency || 440;
        this.y = y;
        this.height = height;
        this.note = note;
        if (this.note[1] == '#') {
            this.black = true;
            this.width = Piano.whiteWidth / 2;
            this.fillStyle = '#000';
        }
        else {
            this.black = false;
            this.width = Piano.whiteWidth;
            this.fillStyle = '#FFF';
        }
    }
    draw(context, fillStyle, strokeStyle) {
        context.fillStyle = fillStyle || this.fillStyle;
        context.strokeStyle = strokeStyle || '#000';
        context.lineWidth = 0;
        context.fillRect(0, this.y, this.width, this.height);
        context.strokeRect(0, this.y, this.width, this.height);
        if (this.black) {
            context.fillStyle = "#FFF";
        }
        else {
            context.fillStyle = "#000";
        }
        context.fillText(this.note.toUpperCase() + this.octave, this.width - 25, this.y + (this.height / 2));
    }
}

const noteNumberOffset = 96;

class Grid {
    constructor() {
        this.beatsPerMeter = 4;
        this.canvas = document.getElementById('canvas-grid');
        this.noteCanvas = document.getElementById('canvas-notes');
        this.context = this.canvas.getContext("2d");
        this.noteContext = this.noteCanvas.getContext("2d");
        this.grid = document.getElementById('grid');
        this.container = document.getElementById('grid-container');
        this.drawnNotes = [];
        this.currentNoteDuration = 1;
        this.currentNoteVelocity = 90;
        this.smallestBeatIncrement = 0.25;
        this.currentSmallestBeatIncrement = 0.25;
        this.startY = 0;
        this.pastKey;
        this.measureCounter = document.getElementById("measure-counter-canvas");
        this.measureCounterContext = this.measureCounter.getContext("2d");
        this.noteXLookup = [];
    }
    drawGrid(cellWidth, cellBeatLength, piano, notes) {
        this.piano = piano;
        this.keyHeight = this.piano.blackOffset * 2;
        this.keys = piano.keys;
        this.canvas.height = piano.height;
        this.noteCanvas.height = piano.height;
        this.grid.style.height = piano.height + "px";
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.cellWidth = 40; //cellWidth || this.width / 16;
        this.cellBeatLength = cellBeatLength || 1;
        this.smallestPixelBeatIncrement = this.cellWidth * this.smallestBeatIncrement / this.cellBeatLength;
        this.currentSmallestPixelBeatIncrement = this.cellWidth * this.currentSmallestBeatIncrement / this.cellBeatLength;
        this.context.lineWidth = 0;

        if (this.keys[0].black) {
            this.startY = 0;
        }
        else {
            this.startY = this.piano.blackOffset;
        }

        for (var i = 0; i < this.keys.length; i++) {
            if (this.keys[i].black) {
                this.context.fillStyle = '#cae3eb';
            }
            else if (!this.keys[i].black) {
                this.context.fillStyle = '#ddf4fc';
            }

            if (this.keys[i].black) {
                this.context.fillRect(0, this.keys[i].y, this.width, this.keys[i].height);
                this.context.strokeRect(0, this.keys[i].y, this.width, this.keys[i].height);
            }
            else if (this.keys[i].note == 'a' || this.keys[i].note == 'd' || this.keys[i].note == 'g') {
                this.context.fillRect(0, this.keys[i].y + this.piano.blackOffset, this.width, this.keys[i].height - this.piano.blackOffset);
                this.context.strokeRect(0, this.keys[i].y + this.piano.blackOffset, this.width, this.keys[i].height - this.piano.blackOffset);
            }
            else if (this.keys[i].note == 'c' || this.keys[i].note == 'f') {
                this.context.fillRect(0, this.keys[i].y + this.piano.blackOffset, this.width, this.keys[i].height);
                this.context.strokeRect(0, this.keys[i].y + this.piano.blackOffset, this.width, this.keys[i].height);
            }
            else {
                this.context.fillRect(0, this.keys[i].y, this.width, this.keys[i].height - this.piano.blackOffset);
                this.context.strokeRect(0, this.keys[i].y, this.width, this.keys[i].height - this.piano.blackOffset);
            }
        }

        var numCells = this.width / this.cellWidth;
        var cellsInMeasure = this.beatsPerMeter / this.cellBeatLength;
        for (var i = 0; i < numCells; i++) {
            if (i % cellsInMeasure == 0) {
                this.context.strokeStyle = '#000';
                this.measureCounterContext.fillText((i / 4) + 1, i * this.cellWidth + this.cellWidth / 4, 12);
            }
            else {
                this.context.strokeStyle = '#6E6E6E';
            }
            this.context.beginPath();
            this.context.moveTo(i * this.cellWidth, 0);
            this.context.lineTo(i * this.cellWidth, this.height);
            this.context.stroke();

            this.context.fillStyle = '#000';

        }

        if (this.noteXLookup.length == 0) {
            for (var i = 0; i < this.width / this.smallestPixelBeatIncrement; i++) {
                this.noteXLookup[i] = [];
            }
        }

        if (notes) {
            for (var i = 0; i < notes.length; i++) {
                this.addNote(notes[i]);
                //console.log(notes[i]);
            }
        }
        this.grid.onmousemove = (function (e) {
            var x = e.pageX - this.grid.offsetLeft + this.container.scrollLeft;
            var y = e.pageY - this.grid.offsetTop + this.container.scrollTop;
            var key = this.keys[this.getKeyIndex(x, y)];
            if (key == undefined) {
                return;
            }
            if (key != this.pastKey) {
                this.piano.drawNote(key, true);
                if (this.pastKey != null) {
                    this.piano.drawNote(this.pastKey, false);
                }
                this.pastKey = key;
            }
        }).bind(this);

        this.grid.onmousedown = (function (e) {
            var x = e.pageX - this.grid.offsetLeft + this.container.scrollLeft;
            var y = e.pageY - this.grid.offsetTop + this.container.scrollTop;;
            this.processClick(x, y);
        }).bind(this);

        this.grid.onmouseout = (function () {
            this.piano.drawNote(this.pastKey, false);
        }).bind(this);
    }
    getKeyIndex(x, y) {
        var keyIndex = Math.floor((y - this.startY) / this.keyHeight);
        return keyIndex;
    }
    removeAll() {
        for (var i = 0; i < this.noteXLookup.length; i++) {
            this.noteXLookup[i] = [];
        }
        this.drawNotes();
    }
    drawNote(x, y, height, width) {
        this.noteContext.fillStyle = '#F00';
        this.noteContext.fillRect(x, y, height, width);
        this.noteContext.strokeRect(x, y, height, width);
    }
    processClick(x, y, draw) {
        var cellLocation = Math.floor(x / this.cellWidth) * this.cellWidth;
        var notePixelLength = this.currentNoteDuration / this.cellBeatLength * this.cellWidth;
        var cellLocationOffset = Math.floor(x % this.cellWidth / (this.smallestBeatIncrement * this.cellWidth / this.cellBeatLength)) * this.smallestPixelBeatIncrement;
        var xPosition = cellLocation + cellLocationOffset;
        var visualKeyIndex = Math.floor((y - this.startY) / this.keyHeight);
        var keyIndex = - Math.floor((y - this.startY) / this.keyHeight) + noteNumberOffset;
        if (keyIndex < 0) {
            return;
        }
        var yPosition = this.startY + visualKeyIndex * this.keyHeight;


        var beatNumber = xPosition * this.cellBeatLength / this.cellWidth;
        var noteToDraw = new DrawnNote(xPosition, yPosition, notePixelLength, true);
        var currentIndex = xPosition / this.smallestPixelBeatIncrement;
        var durationInIncrements = this.currentNoteDuration / this.smallestBeatIncrement;
        var noteToDelete = this.checkSameNote(noteToDraw, this.noteXLookup[currentIndex]);

        if (noteToDelete) {
            var startIndex = noteToDelete.x / this.smallestPixelBeatIncrement;
            var stopIndex = noteToDelete.length / this.smallestPixelBeatIncrement + startIndex;
            for (var i = startIndex; i < stopIndex; i++) {
                this.removeNote(noteToDelete.x, yPosition, this.noteXLookup[i]);
            }
            this.drawNotes();
            this.piano.track.removeNote(keyIndex, noteToDelete.x * this.cellBeatLength / this.cellWidth, this.currentNoteDuration, 1);
        }
        else {
            this.addNotes(currentIndex, durationInIncrements, noteToDraw);
            if (draw == undefined || draw == true) {
                this.drawNote(xPosition, yPosition, notePixelLength, this.keyHeight);
                this.piano.track.playNote(keyIndex, 0, this.currentNoteDuration, 1);
            }
            this.piano.track.addNote(new Note(keyIndex, beatNumber, this.currentNoteDuration, this.currentNoteVelocity));
        }
    }
    addNote(note) {
        var currentIndex = note.beat * this.cellWidth / this.cellBeatLength / this.smallestPixelBeatIncrement;
        var durationInIncrements = note.duration / this.smallestBeatIncrement;
        var notePixelLength = note.duration / this.cellBeatLength * this.cellWidth;
        var noteToDraw = new DrawnNote(note.beat * this.cellWidth / this.cellBeatLength, this.startY + (noteNumberOffset - note.noteNumber) * this.keyHeight, notePixelLength, true);
        this.addNotes(currentIndex, durationInIncrements, noteToDraw);
        //this.processClick(note.beat * this.cellWidth / this.cellBeatLength, this.startY + i * this.keyHeight , false);
    }
    addNotes(currentIndex, durationIncrements, noteToDraw) {
        if (durationIncrements == 0) {
            return;
        }
        else if (this.noteXLookup[currentIndex].length == 0) {
            this.noteXLookup[currentIndex] = [noteToDraw];
            this.addNotes(currentIndex + 1, durationIncrements - 1, noteToDraw);
        }
        else {
            this.noteXLookup[currentIndex][this.noteXLookup[currentIndex].length] = noteToDraw;
            this.addNotes(currentIndex + 1, durationIncrements - 1, noteToDraw);
        }

    }
    removeNote(x, y, notes) {
        for (var i = 0; i < notes.length; i++) {
            if (notes[i].y == y && notes[i].x == x) {
                notes.splice(i, 1);
                return;
            }
        }
    }
    checkSameNote(noteToDraw, notes) {
        for (var i = 0; i < notes.length; i++) {
            if (notes[i].y == noteToDraw.y)
                return notes[i];
        }
        return false;
    }
    drawNotes() {
        //console.log(this.noteXLookup);
        //this.noteContext.save();
        //this.noteContext.setTransform(1, 0, 0, 1, 0, 0);
        this.noteContext.clearRect(0, 0, this.width, this.height);
        //this.noteContext.restore();
        for (var i = 0; i < this.noteXLookup.length; i++) {
            for (var j = 0; j < this.noteXLookup[i].length; j++) {
                this.drawNote(this.noteXLookup[i][j].x, this.noteXLookup[i][j].y, this.noteXLookup[i][j].length, this.keyHeight);
            }
        }
    }
}


class DrawnNote {
    constructor(x, y, length, isStart, startIndex) {
        this.x = x;
        this.y = y;
        this.length = length;
        this.isStart = isStart;
        this.startIndex = startIndex;
    }
}


var initialize = function(startNote) {
    var menuHeight = document.getElementById('menu').clientHeight;
    var counterHeight = document.getElementById('measure-counter').clientHeight;
    var height = window.innerHeight - menuHeight - counterHeight - 20;
    document.getElementById('main').style.height = height + "px";
    document.getElementById('quarter').style.border = "inset";
};