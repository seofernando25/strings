export const CHROMATIC_NOTES = [
	'C',
	'C#',
	'D',
	'D#',
	'E',
	'F',
	'F#',
	'G',
	'G#',
	'A',
	'A#',
	'B'
] as const;

export const noteStringToNoteLength = {
	'1024th': 1 / 1024,
	'512th': 1 / 512,
	'256th': 1 / 256,
	'128th': 1 / 128,
	'64th': 1 / 64,
	'32nd': 1 / 32,
	'16th': 1 / 16,
	eighth: 1 / 8,
	quarter: 1 / 4,
	half: 1 / 2,
	whole: 1,
	breve: 2,
	long: 4,
	maxima: 8
} as const;

export const noteToDivisions = {
	'1024th': 1024,
	'512th': 512,
	'256th': 256,
	'128th': 128,
	'64th': 64,
	'32nd': 32,
	'16th': 16,
	eighth: 8,
	quarter: 4,
	half: 2,
	whole: 1,
	breve: 0.5,
	long: 0.25,
	maxima: 0.125
} as const;

export type NoteType = keyof typeof noteStringToNoteLength;
export type NormalNoteLength = (typeof noteStringToNoteLength)[NoteType];

export type NoteWithOctave = `${ChromaticNote}${number}`;

export type ChromaticNote = (typeof CHROMATIC_NOTES)[number];

export const NOTES: Note[] = Array.from({ length: 9 }, (_, i) => {
	return CHROMATIC_NOTES.map((note) => {
		return {
			note,
			octave: i,
			cents: 0,
			freq: noteToFreqSimple(note, i, 0)
		};
	});
}).flat();

export type Note = {
	freq: number;
	note: ChromaticNote;
	octave: number;
	cents: number;
};

export function noteToNoteWithOctave(note: Note): NoteWithOctave {
	return `${note.note}${note.octave}` as NoteWithOctave;
}

/**
 * Converts a frequency to a note
 * eg. 82.41 -> E2
 * eg. 110 -> A2
 * @param hz
 */
export function frequencyToNote(hz: number): Note {
	const A4_INDEX = 57;

	let frequency;
	const r = Math.pow(2.0, 1.0 / 12.0);
	const cent = Math.pow(2.0, 1.0 / 1200.0);
	let r_index = 0;
	let cent_index = 0;
	let side;

	frequency = 440.0; // A4

	if (hz >= frequency) {
		while (hz >= r * frequency) {
			frequency = r * frequency;
			r_index++;
		}
		while (hz > cent * frequency) {
			frequency = cent * frequency;
			cent_index++;
		}
		if (cent * frequency - hz < hz - frequency) cent_index++;
		if (cent_index > 50) {
			r_index++;
			cent_index = 100 - cent_index;
			if (cent_index != 0) side = -1;
			else side = 1;
		} else side = 1;
	} else {
		while (hz <= frequency / r) {
			frequency = frequency / r;
			r_index--;
		}
		while (hz < frequency / cent) {
			frequency = frequency / cent;
			cent_index++;
		}
		if (hz - frequency / cent < frequency - hz) cent_index++;
		if (cent_index >= 50) {
			r_index--;
			cent_index = 100 - cent_index;
			side = 1;
		} else {
			if (cent_index != 0) side = -1;
			else side = 1;
		}
	}

	const clampedIndex = Math.min(Math.max(r_index + A4_INDEX, 0), NOTES.length - 1);
	const result = NOTES[clampedIndex];
	result.freq = hz;
	result.cents = cent_index * side;
	return result;
}

export function noteToFreqSimple(note: ChromaticNote, octave: number, cents: number): number {
	const A4 = 440;
	const A4_INDEX = 57;
	const noteIndex = CHROMATIC_NOTES.indexOf(note);
	const index = noteIndex + octave * 12 - A4_INDEX;
	const frequency = A4 * Math.pow(2, index / 12) * Math.pow(2, cents / 1200);
	return Math.round(frequency);
}

export function noteToFreq(note: Note): number {
	return noteToFreqSimple(note.note, note.octave, note.cents);
}
