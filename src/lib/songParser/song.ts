import type { NoteType } from '$lib/notes';
import { handleAttributes } from './handlers/attributeHandlers';
import { handleDirection } from './handlers/directionHandler';
import { handleNote } from './handlers/noteHandler';
import { measureDuration } from './utils';
import * as Tone from 'tone';

export type Pitch = {
	step: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'; // Note letter
	alter: number; // How many semitones the note is altered by
	octave: number; // Which octave the note is in
};

export function pitchToString(pitch: Pitch) {
	if (pitch.alter == 0) {
		return `${pitch.step}${pitch.octave}`;
	} else if (pitch.alter == 1) {
		return `${pitch.step}#${pitch.octave}`;
	} else {
		return `${pitch.step}b${pitch.octave}`;
	}
}

export type TimeMeasure = {
	nBeats: number; // How many beats per measure
	beatType: number; // What type of note is a beat
};

export type SongNote = {
	duration: number; // How many beats the note lasts
	noteType: NoteType;
	isChord: boolean;
	isRest: boolean;
	noteDescription: Pitch;
	noteFreq: number;
};

export type Measure = {
	/** Events to fire in the measure */
	events: MusicEvent[];
	/**The time this measure event should be started */
	time: number;
};

export type BaseEvent = {
	time: number; // Time event should be fired relative to measure time
	measure: Measure; // Measure event is in
};

export type SongPart = {
	id: string;
	name: string;
	measures: Measure[];
};

export type FingerTech = {
	fingering?: number;
	string?: number;
	fret?: number;
};

export type TempoChangeEvent = BaseEvent & {
	type: 'tempo_change';
	bpm: number;
};
export type DirectionWordEvent = BaseEvent & {
	type: 'direction_word';
	chord: string;
};
export type NotePlayEvent = BaseEvent & {
	type: 'note_play';
	pitch: Pitch;
	duration: number;
	fingerTech: FingerTech | undefined;
};
export type RestEvent = BaseEvent & {
	type: 'rest';
	duration: number;
};
export type SignatureChangeEvent = BaseEvent & {
	type: 'signature_change';
	nBeats: number;
	beatType: number;
	time: number;
};
export type MusicEvent =
	| TempoChangeEvent
	| NotePlayEvent
	| RestEvent
	| SignatureChangeEvent
	| DirectionWordEvent;

let _currentContext: Map<string, unknown> = new Map();

export type ParserContextKey =
	| 'lastNonChordOffset'
	| 'noteOffset'
	| 'part'
	| 'measureTime'
	| 'tempo'
	| 'timeSig'
	| 'measure';

export function setParserContext<T>(key: ParserContextKey, value: T) {
	_currentContext.set(key, value);
}

export function getParserContext<T>(key: ParserContextKey): T | undefined {
	return _currentContext.get(key) as T | undefined;
}

type MusicEventWithMaybeMeasure = MusicEvent & { measure?: Measure };

/**
 * Adds an event to the current measure
 */
export const pushEvent = (event: MusicEventWithMaybeMeasure) => {
	const songPart = getParserContext<SongPart>('part');

	if (!songPart) {
		throw new Error('No song part');
	}
	const thisMeasure = songPart.measures[songPart.measures.length - 1];
	const ev = {
		...event,
		measure: thisMeasure
	};
	thisMeasure.events.push(ev as MusicEvent);
};

export class Song {
	_title: string | undefined;
	_artist: string | undefined;
	_parts: SongPart[] = [];
	doc: Document;

	constructor(protected musicXML: string) {
		this.doc = new DOMParser().parseFromString(musicXML, 'text/xml');
		this.init();
		console.log(this.doc);
	}

	initializedBaseAttr = false;
	initBaseAttributes(): void {
		if (this.initializedBaseAttr) {
			return;
		}
		this.initializedBaseAttr = true;

		// Get artist and title
		const workTitle = this.doc.querySelector('work work-title');
		if (workTitle) {
			this._title = workTitle.innerHTML;
		}

		const identificationCreator = this.doc.querySelector('identification creator');
		if (identificationCreator) {
			this._artist = identificationCreator.innerHTML;
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

	init() {
		this.initBaseAttributes();
		for (const part of this._parts) {
			this.initPart(part.id);
		}
	}

	initPart(id: string): void {
		// If already initialized, return
		if (this._parts.find((part) => part.id == id)?.measures.length != 0) {
			return;
		}

		const thisPart = this._parts.find((part) => part.id == id);
		const partEl = this.doc.querySelector(`part[id="${id}"]`);
		if (thisPart == undefined || partEl == null) {
			console.log('Failed to find part');
			return;
		}

		// Set up context
		const ctxObj = new Map<string, unknown>();

		// Check for recursive calls
		if (_currentContext == ctxObj) {
			throw new Error('Context being set recursively');
		}

		_currentContext = ctxObj;

		setParserContext('part', thisPart);
		setParserContext('measureTime', 0);
		setParserContext('tempo', 120);
		setParserContext('timeSig', {
			nBeats: 4,
			beatType: 4
		});

		// Get all measures
		const measures = partEl.querySelectorAll('measure');
		for (const measureEl of measures) {
			_currentContext = ctxObj;

			thisPart.measures.push({
				events: [],
				time: getParserContext('measureTime') ?? 0
			});

			setParserContext('measure', thisPart.measures[thisPart.measures.length - 1]);

			setParserContext('noteOffset', 0);

			// Go over each child of the measure
			const children = measureEl.children;
			for (const child of children) {
				if (child.tagName == 'print') {
					// Ignore
				} else if (child.tagName == 'attributes') {
					handleAttributes(child);
				} else if (child.tagName == 'direction') {
					handleDirection(child);
				} else if (child.tagName == 'note') {
					handleNote(child);
				} else if (child.tagName == 'barline') {
					// Ignore
				} else {
					console.log('Unknown ROOT child type', child.tagName);
					console.log(child);
				}
			}
			const measureT: number = getParserContext('measureTime')!;

			let measureDurationSec = 0;
			const notesEls = measureEl.querySelectorAll('note');
			for (const noteEl of notesEls) {
				// Check if chord
				const chord = noteEl.querySelector('chord');
				if (chord) {
					continue;
				}
				const duration = parseInt(noteEl.querySelector('duration')?.textContent ?? '0') / 1000;
				measureDurationSec += duration;
			}

			// const measureDurationSec = measureDuration(getParserContext('tempo')!, timeSig.nBeats);
			setParserContext('measureTime', measureT + measureDurationSec);
		}

		_currentContext = new Map<string, unknown>();
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

	getPartMusicEventsRawTimed(partId: string): [number, MusicEvent][] {
		this.initPart(partId);
		const measure = this.part(partId);
		if (!measure) {
			console.log('No part found');
			return [];
		}

		const measuresArr = measure?.measures ?? [];
		const allEvents: MusicEvent[] = measuresArr.flatMap((m) => m.events);
		const ret: [number, MusicEvent][] = [];
		for (const musicEvent of allEvents) {
			const baseT = musicEvent.measure.time + musicEvent.time;
			ret.push([baseT, musicEvent]);
		}
		// ret.sort((a, b) => a[0] - b[0]);

		return ret;
	}

	async playSong(partId: string) {
		const measure = this.part(partId);
		if (!measure) {
			console.log('No part found');
			return;
		}
		const measuresArr = measure?.measures ?? [];
		const synth = new Tone.PolySynth(Tone.Synth, {
			volume: -8,
			oscillator: {
				type: 'amtriangle20'
			},
			portamento: 0,
			detune: 0,
			envelope: {
				attack: 0.01,
				decay: 0.2,
				release: 1,
				sustain: 0
			}
		}).toDestination();

		const allEvents: MusicEvent[] = measuresArr.flatMap((m) => m.events);
		Tone.Transport.loop = false;
		const songPlayback = new Tone.ToneEvent((time, ev) => {
			for (const musicEvent of ev) {
				const baseT = musicEvent.measure.time + musicEvent.time;

				if (musicEvent.type === 'rest') {
					//
				} else if (musicEvent.type === 'signature_change') {
					// Tone.Transport.timeSignature = [musicEvent.nBeats, musicEvent.beatType];
				} else if (musicEvent.type === 'tempo_change') {
					Tone.Transport.bpm.setValueAtTime(musicEvent.bpm, baseT);
				} else if (musicEvent.type === 'note_play') {
					const duration = musicEvent.duration;
					const pitch = pitchToString(musicEvent.pitch);
					synth?.triggerAttackRelease(pitch, duration, baseT);
				}
			}
		}, allEvents);

		songPlayback.start();
		console.log('Now playing:', this.title());
	}
}
