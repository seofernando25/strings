import {
	getParserContext,
	pushEvent,
	type Pitch,
	type RestEvent,
	type NotePlayEvent,
	setParserContext
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

	const restDurationText = restDuration.textContent;
	if (restDurationText === null) {
		console.log("Didn't find rest duration");
		return;
	}
	// const restDurationSeconds = calculateDuration(parseInt(restDuration.textContent ?? '0'));
	const restDurationSeconds = parseInt(restDurationText) / 1000;
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

	const durationEl = noteEl.querySelector('duration')!;
	const restDurationText = durationEl.textContent;
	if (restDurationText === null) {
		console.log("Didn't find rest duration");
		return;
	}
	const duration = parseInt(restDurationText) / 1000;

	const noteEvent: NotePlayEvent = {
		type: 'note_play',
		pitch,
		fingerTech: getFingerTech(noteEl),
		// Chords are not affected by the note offset of the last non-chord note
		// https://www.w3.org/2021/06/musicxml40/musicxml-reference/elements/chord/
		time: getParserContext<number>('lastNonChordOffset') ?? 0,
		duration: duration,
		measure: getParserContext('measure')!
	};
	pushEvent(noteEvent);
}

function fetchPitch(pitchEl: Element): Pitch {
	const step = pitchEl.querySelector('step')?.textContent ?? 'C';
	const octave = pitchEl.querySelector('octave')?.textContent ?? '4';
	const alter = pitchEl.querySelector('alter')?.textContent ?? '0';

	return {
		step: step as Pitch['step'],
		octave: parseInt(octave),
		alter: parseInt(alter)
	};
}
