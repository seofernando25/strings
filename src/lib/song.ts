import { noteToFreqSimple, type ChromaticNote } from './notes';

export type Pitch = {
	step: string; // A-G the note
	octave: number; // Which octave the note is in
	alter: number; // How many semitones the note is altered by
};

export type TimeMeasure = {
	beats: number; // How many beats per measure
	beatType: number; // What type of note gets the beat
};

export type SongNote = {
	duration: number; // How many beats the note lasts
	isChord: boolean;
	isRest: boolean;
	noteDescription: Pitch;
	noteFreq: number;
};

export type Measure = {
	tempo: number | undefined;
	timeMeasure: TimeMeasure | undefined;
	notes: SongNote[];
};

export type SongPart = {
	id: string;
	name: string;
	measures: Measure[];
};

export class Song {
	static domParser: DOMParser = new DOMParser();
	_title: string | undefined;
	_artist: string | undefined;
	_parts: SongPart[] = [];
	doc: Document;

	constructor(protected musicXML: string) {
		this.doc = Song.domParser.parseFromString(musicXML, 'text/xml');
	}

	initializedBaseAttr = false;
	initBaseAttributes(): void {
		if (this.initializedBaseAttr) {
			return;
		}
		this.initializedBaseAttr = true;

		// Get artist and title
		const credits = this.doc.querySelectorAll('credit');
		for (const credit of credits) {
			if ((credit.querySelector('credit-type')?.textContent ?? '') === 'composer') {
				this._artist = credit.querySelector('credit-words')?.innerHTML ?? 'unknown';
			} else if ((credit.querySelector('credit-type')?.textContent ?? '') === 'title') {
				this._title = credit.querySelector('credit-words')?.innerHTML ?? 'unknown';
			}
		}
		if (this._artist == undefined) {
			this._artist = 'unknown';
		}
		if (this._title == undefined) {
			this._title = 'unknown';
		}

		// Get parts
		const partsList = this.doc.querySelectorAll('part-list score-part');
		for (const partNameObj of partsList) {
			this._parts.push({
				id: partNameObj.getAttribute('id') ?? 'unknown',
				name: partNameObj.querySelector('part-name')?.innerHTML ?? 'unknown',
				measures: []
			});
		}
	}

	initPart(id: string): void {
		const thisPart = this._parts.find((part) => part.id == id);
		if (thisPart == undefined) {
			console.log('Part not found');
			return;
		}

		// Query select for part with id
		const part = this.doc.querySelector(`part[id="${id}"]`);
		if (part == null) {
			console.log('Part not found');
			return;
		}

		// Get measures
		const measures = part.querySelectorAll('measure');
		for (const measure of measures) {
			const measureObj: Measure = {
				notes: [],
				tempo: undefined,
				timeMeasure: undefined
			};

			// Check for tempo (direction -> sound [tempo])
			const tempo = measure.querySelector('direction sound[tempo]');
			if (tempo != null) {
				const tempoAttr = tempo.getAttribute('tempo');
				if (tempoAttr != null) {
					measureObj.tempo = parseInt(tempoAttr);
				}
			}

			// Check for time signature (attributes -> time)
			const timeMeasure = measure.querySelector('attributes time');
			if (timeMeasure != null) {
				const beats = timeMeasure.querySelector('beats');
				const beatType = timeMeasure.querySelector('beat-type');
				const beatsAttr = beats?.textContent ?? '4';
				const beatTypeAttr = beatType?.textContent ?? '4';
				measureObj.timeMeasure = {
					beats: parseInt(beatsAttr),
					beatType: parseInt(beatTypeAttr)
				};
			}

			// Get notes
			const noteQuery = measure.querySelectorAll('note');
			for (const noteEl of noteQuery) {
				// Get duration
				const duration = noteEl.querySelector('duration');
				const durationAttr = duration?.textContent;
				if (durationAttr == undefined) {
					console.log('Duration not found');
					return;
				}
				const durationNum = parseInt(durationAttr);
				// Get pitch
				const pitch = noteEl.querySelector('pitch');
				let pitchObj: Pitch = {
					alter: 0,
					octave: 0,
					step: ''
				};
				if (pitch != null) {
					const step = pitch.querySelector('step');
					const octave = pitch.querySelector('octave');
					const alter = pitch.querySelector('alter');
					const stepAttr = step?.textContent ?? '0';
					const octaveAttr = octave?.textContent ?? '0';
					const alterAttr = alter?.textContent ?? '0';
					pitchObj = {
						alter: parseInt(alterAttr),
						octave: parseInt(octaveAttr),
						step: stepAttr
					};
				}

				const note: SongNote = {
					duration: durationNum,
					isChord: noteEl.querySelector('chord') != null,
					noteDescription: pitchObj,
					noteFreq: noteToFreqSimple(
						pitchObj.step as ChromaticNote,
						pitchObj.octave,
						pitchObj.alter
					),
					isRest: noteEl.querySelector('rest') != null
				};
				measureObj.notes.push(note);
			}

			thisPart.measures.push(measureObj);
		}

		console.log(part);
	}

	artist(): string {
		this.initBaseAttributes();
		return this._artist ?? 'unknown';
	}

	title(): string {
		this.initBaseAttributes();
		return this._title ?? 'unknown';
	}

	partsInfo(): { id: string; name: string }[] {
		this.initBaseAttributes();
		return this._parts;
	}

	part(id: string) {
		this.initBaseAttributes();
		const thisPart = this._parts.find((part) => part.id == id);
		if (thisPart == undefined) {
			console.log('Part not found');
			return;
		}

		if (thisPart.measures.length == 0) {
			this.initPart(id);
		}
		return thisPart;
	}
}
