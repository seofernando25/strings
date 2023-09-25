import {
	getParserContext,
	pushEvent,
	type TempoChangeEvent,
	type DirectionWordEvent,
	setParserContext
} from '../song';
import { runSelectors } from '../utils';

export function handleDirection(directionEl: Element) {
	const selectors: [string[], (el: Element) => unknown][] = [
		[['direction-type', 'words'], handleWord],
		[['sound'], handleSound]
	];

	// Handle selectors
	const selectorAny = runSelectors(directionEl, selectors);

	if (!selectorAny) {
		console.log('Unhandled note type:', directionEl);
	}
}

function handleSound(directionEl: Element) {
	// Get sound object and check if it has a tempo
	const soundEl = directionEl.querySelector('sound')!;
	const tempo = soundEl.getAttribute('tempo');
	if (tempo) {
		const tempoEvent: TempoChangeEvent = {
			type: 'tempo_change',
			bpm: parseInt(tempo),
			time: getParserContext<number>('noteOffset') ?? 0,
			measure: getParserContext('measure')!
		};
		setParserContext<number>('tempo', parseInt(tempo));
		pushEvent(tempoEvent);
	}
}

function handleWord(directionEl: Element) {
	const wordsEl = directionEl.querySelector('words')!;
	const ev: DirectionWordEvent = {
		type: 'direction_word',
		chord: wordsEl.textContent ?? '',
		time: getParserContext<number>('noteOffset') ?? 0,
		measure: getParserContext('measure')!
	};
	pushEvent(ev);
}
