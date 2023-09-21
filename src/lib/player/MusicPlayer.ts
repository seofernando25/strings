import type { Song } from '$lib/songParser/song';
import * as Tone from 'tone';

export class MusicPlayer {
	constructor(private song: Song) {
		song.init();
	}

	playPart(partId: string) {
		const part = this.song.part(partId);
		if (part == undefined) return;

		const t = 0;
	}
}
