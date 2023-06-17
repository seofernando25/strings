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
