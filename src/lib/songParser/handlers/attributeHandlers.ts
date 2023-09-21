import { getParserContext, pushEvent, setParserContext } from '../song';

export function handleAttributes(attrEl: Element) {
	for (const attributeEl of attrEl.children) {
		if (attributeEl.tagName == 'time') {
			handleTime(attributeEl);
		} else if (attributeEl.tagName == 'clef') {
			//
		} else if (attributeEl.tagName == 'key') {
			//
		} else if (attributeEl.tagName == 'divisions') {
			//
		} else {
			console.log('Unknown ATTRIBUTES attribute type', attributeEl.tagName);
			console.log(attributeEl);
		}
	}
}

function handleTime(timeEl: Element) {
	const beatsAttr = timeEl.querySelector('beats')?.textContent ?? '4';
	const beatTypeAttr = timeEl.querySelector('beat-type')?.textContent ?? '4';
	setParserContext('timeSig', {
		nBeats: parseInt(beatsAttr),
		beatType: parseInt(beatTypeAttr)
	});
	pushEvent({
		type: 'signature_change',
		nBeats: parseInt(beatsAttr),
		beatType: parseInt(beatTypeAttr),
		time: getParserContext('measureTime')!,
		measure: getParserContext('measure')!
	});
}
