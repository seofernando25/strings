import {
	getParserContext,
	pushEvent,
	type Pitch,
	type RestEvent,
	type NotePlayEvent,
	setParserContext,
	type TimeMeasure
} from '../song';
import { runSelectors } from '../utils';

export function handleNote(noteEl: Element) {
	// Check if it doesn't have a chord
	const chord = noteEl.querySelector('chord');
	if (!chord) {
		setParserContext<number>('lastNonChordOffset', getParserContext<number>('noteOffset') ?? 0);
	}

	const selectors: [string[], (el: Element) => unknown][] = [
		[['pitch', '!chord'], handleSingleNote], // has pitch, is not a chord, is not a rest
		[['chord', 'pitch'], handleChord], // has chord, has pitch
		[['rest'], handleRest] // has rest
	];

	// Handle selectors
	const selectorAny = runSelectors(noteEl, selectors);

	if (!selectorAny) {
		console.log('Unhandled note type:', noteEl);
	}
}

function getFingerTech(noteEl: Element) {
	const technical = noteEl.querySelector('technical');
	const techFingering = technical?.querySelector('fingering')?.textContent;
	const techString = technical?.querySelector('string')?.textContent;
	const techFret = technical?.querySelector('fret')?.textContent;

	const fingerTech = {
		fingering: techFingering ? parseInt(techFingering) : undefined,
		string: techString ? parseInt(techString) : undefined,
		fret: techFret ? parseInt(techFret) : undefined
	};
	return fingerTech;
}

function handleSingleNote(noteEl: Element) {
	const pitch = fetchPitch(noteEl.querySelector('pitch')!);
	const fingerTech = getFingerTech(noteEl);

	// TODO: Quadruple check this
	// Convert note duration to seconds
	const duration = parseInt(noteEl.querySelector('duration')?.textContent ?? '0') / 1000;
	const noteEvent: NotePlayEvent = {
		type: 'note_play',
		pitch,
		time: getParserContext<number>('noteOffset') ?? 0,
		duration,
		measure: getParserContext('measure')!,
		fingerTech
	};

	// Increase note offset
	setParserContext<number>('noteOffset', duration + (getParserContext<number>('noteOffset') ?? 0));
	pushEvent(noteEvent);
}

function handleRest(noteEl: Element) {
	const restDuration = noteEl.querySelector('duration')!;
	// const restDurationSeconds = calculateDuration(parseInt(restDuration.textContent ?? '0'));
	const restDurationSeconds = parseInt(restDuration.textContent ?? '1') / 1000;
	// Get note offset
	const noteOffset = getParserContext<number>('noteOffset') ?? 0;
	const restEvent: RestEvent = {
		type: 'rest',
		duration: restDurationSeconds,
		time: noteOffset,
		measure: getParserContext('measure')!
	};
	pushEvent(restEvent);
	// Increase note offset
	setParserContext<number>('noteOffset', restDurationSeconds + noteOffset);
}

function handleChord(noteEl: Element) {
	const pitch = fetchPitch(noteEl.querySelector('pitch')!);

	const noteEvent: NotePlayEvent = {
		type: 'note_play',
		pitch,
		fingerTech: getFingerTech(noteEl),
		// Chords are not affected by the note offset of the last non-chord note
		// https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/chord/
		time: getParserContext<number>('lastNonChordOffset') ?? 0,
		duration: parseInt(noteEl.textContent ?? '1') / 1000,
		measure: getParserContext('measure')!
	};
	pushEvent(noteEvent);
}

function fetchPitch(pitchEl: Element): Pitch {
	const step = pitchEl.querySelector('step')?.textContent ?? 'C';
	if (!step) throw new Error('Missing step');
	const octave = pitchEl.querySelector('octave')?.textContent ?? '4';
	if (!octave) throw new Error('Missing octave');
	const alter = pitchEl.querySelector('alter')?.textContent ?? '0';
	if (!alter) throw new Error('Missing alter');

	return {
		step: step as Pitch['step'],
		octave: parseInt(octave),
		alter: parseInt(alter)
	};
}

// function calculateDuration(nBeats: number) {
// 	const bpm = getParserContext<number>('tempo') ?? 120;
// 	const spb = 60 / bpm;
// 	const timeSig = getParserContext<TimeMeasure>('timeSig') ?? { nBeats: 4, beatType: 4 };
// 	const measureLength = spb * timeSig.nBeats;
// 	const beatsInMeasure = timeSig.nBeats * timeSig.beatType;
// 	const beatNorm = nBeats / beatsInMeasure;
// 	const totalLength = measureLength * beatNorm;
// 	return totalLength;
// }
