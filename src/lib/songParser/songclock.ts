import type { MusicEvent } from './song';

type SongClockCallback = { time: number; event: MusicEvent; remaining: [number, MusicEvent][] };

export class SongClock {
	startTime: number = 0;
	oldTime: number = 0;
	elapsedTime: number = 0;
	running: boolean = false;
	subscribers: ((e: SongClockCallback) => void)[] = [];
	interval: ReturnType<typeof setInterval> | null = null;

	constructor(public timeline: [number, MusicEvent][] = []) {}

	setTimeline(timeline: [number, MusicEvent][]) {
		this.timeline = timeline;
	}

	addEventListener(cb: (e: SongClockCallback) => void) {
		this.subscribers.push(cb);

		return () => {
			this.subscribers = this.subscribers.filter((x) => x !== cb);
		};
	}

	start() {
		this.startTime = now();

		this.oldTime = this.startTime;
		this.elapsedTime = 0;
		this.running = true;

		if (this.interval) {
			clearInterval(this.interval);
		}
		this.interval = setInterval(() => {
			this.getDelta();
			while (this.timeline.length > 0 && this.timeline[0][0] < this.elapsedTime) {
				const e = this.timeline.shift();
				if (!e) {
					break;
				}
				this.subscribers.forEach((cb) =>
					cb({
						event: e[1],
						time: e[0],
						remaining: this.timeline
					})
				);
			}
			if (this.timeline.length === 0) {
				this.stop();
			}
		}, 16);
	}

	stop() {
		clearInterval(this.interval!);
		this.getElapsedTime();
		this.running = false;
	}

	getElapsedTime() {
		this.getDelta();
		return this.elapsedTime;
	}

	getDelta(): number {
		let diff = 0;

		if (!this.running) {
			this.start();
			return 0;
		}

		if (this.running) {
			const newTime = now();

			diff = (newTime - this.oldTime) / 1000;
			this.oldTime = newTime;

			this.elapsedTime += diff;
		}

		return diff;
	}
}

function now() {
	return (typeof performance === 'undefined' ? Date : performance).now(); // see #10732
}
