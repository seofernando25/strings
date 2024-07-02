<script lang="ts">
	import Spectogram from '$lib/components/Spectogram.svelte';
	import { analyzer } from '$lib/mic';
	import { audioFrequencies, audioFrequenciesTick } from '$lib/mic/audioFrequencies';
	import { micSampleRate } from '$lib/mic/rawMicNode';
	import { frequencyToNote, noteToFreq } from '$lib/notes';

	function isActive(i: number, windowSize: number = 3, treshHold: number) {
		let acc = 0;
		for (let j = i - windowSize; j < i + windowSize; j++) {
			acc += audioFrequencies[j] ?? 999;
		}
		const avg = acc / (windowSize * 2);
		return avg > treshHold;
	}

	// Max harmonics detection at 595 after that don't check harmonics

	const noteAHz = noteToFreq({
		note: 'E',
		cents: 0,
		freq: 0,
		octave: 2
	});
	const noteBHz = noteToFreq({
		note: 'B',
		cents: 0,
		freq: 0,
		octave: 2
	});
	const noteCHz = noteToFreq({
		note: 'E',
		cents: 0,
		freq: 0,
		octave: 3
	});

	const noteDHz = noteToFreq({
		note: 'C#',
		cents: 0,
		freq: 0,
		octave: 5
	});
	const noteEHz = noteToFreq({
		note: 'A',
		cents: 0,
		freq: 0,
		octave: 4
	});
	const noteFHz = noteToFreq({
		note: 'F#',
		cents: 0,
		freq: 0,
		octave: 4
	});

	const noteToName = frequencyToNote(noteAHz);

	let noteAPressed = false;
	let noteBPressed = false;
	let noteCPressed = false;
	let noteDPressed = false;
	let noteEPressed = false;
	let noteFPressed = false;

	function isNoteTrustPressed(noteHz: number, sampleRate: number, fftSize: number) {
		const freqPerBin = sampleRate / fftSize;
		let binIdx = Math.round(noteHz / freqPerBin);
		const fftVal = audioFrequencies[binIdx];
		const baseTresh = 127;
		const checkWindow = 3;
		const hasVal = fftVal > baseTresh;
		binIdx = Math.round((noteHz * 2) / freqPerBin);
		const harmonics1Pressed = isActive(binIdx, checkWindow, baseTresh / 2);
		binIdx = Math.round((noteHz * 3) / freqPerBin);
		const harmonics2Pressed = isActive(binIdx, checkWindow, baseTresh / 4);
		binIdx = Math.round((noteHz * 4) / freqPerBin);
		const harmonics3Pressed = isActive(binIdx, checkWindow, baseTresh / 8);
		binIdx = Math.round((noteHz * 5) / freqPerBin);
		const harmonics4Pressed = isActive(binIdx, checkWindow, baseTresh / 16);

		const trust =
			+hasVal +
			+harmonics1Pressed / 2 +
			+harmonics2Pressed / 4 +
			+harmonics3Pressed / 8 +
			+harmonics4Pressed / 16;
		return trust >= 1.5;
	}

	$: {
		const fftSize = analyzer.value?.fftSize;
		$audioFrequenciesTick;
		if ($micSampleRate != undefined) {
			noteAPressed = isNoteTrustPressed(noteAHz, $micSampleRate, fftSize);
			noteBPressed = isNoteTrustPressed(noteBHz, $micSampleRate, fftSize);
			noteCPressed = isNoteTrustPressed(noteCHz, $micSampleRate, fftSize);
			noteDPressed = isNoteTrustPressed(noteDHz, $micSampleRate, fftSize);
			noteEPressed = isNoteTrustPressed(noteEHz, $micSampleRate, fftSize);
			noteFPressed = isNoteTrustPressed(noteFHz, $micSampleRate, fftSize);
		}
	}

	// 48000 / 1318.51
	// (record freq / fftSize) * index = freq
</script>

<div class="flex flex-col flex-1">
	<div class="w-full break-all">
		Chord A Pressed: {noteAPressed && noteBPressed && noteCPressed}
		<br />
		Chord B Pressed: {noteDPressed && noteEPressed && noteFPressed}
		<br />
	</div>
	<div class="flex-1 w-full">
		<Spectogram dataArray={audioFrequencies}></Spectogram>
	</div>
</div>
