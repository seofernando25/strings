import MATLAB_JET from './matlabJet';

type ArrayLike = number[] | Uint8Array | Uint8ClampedArray | Iterable<number>;

export class SpectrogramGen {
	nextLine = 0;
	readonly lines = 200;
	readonly rhc = false; // right hand column
	readonly vert = false; // vertical display
	interval = 0; // msec
	sgTime = 0;
	sgStartTime = 0;
	sgDiff = 0;
	running = false;
	sgMode: 'WF' | 'RS' = 'WF';
	timerID: null | ReturnType<typeof setTimeout> = null;
	lineRate = 30; // requested line rate for dynamic waterfalls

	pxPerLine = 200;
	ipBuf8: Uint8ClampedArray | Uint8Array = new Uint8ClampedArray(0);
	lineBuf = new ArrayBuffer(this.pxPerLine * 4); // 1 line
	lineBuf8 = new Uint8ClampedArray(this.lineBuf);
	tmpImgData: ImageData | null = null;
	lineImgData = new ImageData(this.lineBuf8, this.pxPerLine, 1); // 1 line of canvas pixels

	clearBuf = new ArrayBuffer(this.pxPerLine * this.lines * 4); // fills with 0s ie. rgba 0,0,0,0 = transparent
	clearBuf8 = new Uint8ClampedArray(this.clearBuf);
	blankBuf = new ArrayBuffer(this.pxPerLine * 4);
	blankBuf8 = new Uint8ClampedArray(this.blankBuf);
	blankImgData = new ImageData(this.blankBuf8, this.pxPerLine, 1); // 1 line of canvas pixels

	clearImgData: ImageData = new ImageData(this.blankBuf8, this.pxPerLine, this.lines);

	ipObj: { buffer: ArrayLike } = { buffer: [] };

	startOfs = 0;

	offScreenCtx: CanvasRenderingContext2D;
	offScreenCvs: HTMLCanvasElement;

	constructor(buf: { buffer: ArrayLike }) {
		this.ipObj = buf;

		this.offScreenCvs = this.createOffScreenCanvas();
		const ctx = this.offScreenCvs.getContext('2d');
		if (!ctx) {
			throw new Error('Could not create offscreen canvas');
		}
		this.offScreenCtx = ctx;
	}

	newLine() {
		return this.vert ? this.verticalNewLine() : this.horizontalNewLine();
	}

	verticalNewLine() {
		if (this.sgMode == 'WF') {
			if (this.rhc) {
				// shift the current display down 1 line, oldest line drops off
				this.tmpImgData = this.offScreenCtx.getImageData(0, 0, this.pxPerLine, this.lines - 1);
				this.offScreenCtx.putImageData(this.tmpImgData, 0, 1);
			} else {
				// shift the current display up 1 line, oldest line drops off
				this.tmpImgData = this.offScreenCtx.getImageData(0, 1, this.pxPerLine, this.lines - 1);
				this.offScreenCtx.putImageData(this.tmpImgData, 0, 0);
			}
		}
		this.ipBuf8 = Uint8ClampedArray.from(this.ipObj.buffer);
		for (
			let sigVal, rgba, opIdx = 0, ipIdx = this.startOfs;
			ipIdx < this.pxPerLine + this.startOfs;
			opIdx += 4, ipIdx++
		) {
			sigVal = this.ipBuf8[ipIdx] || 0; // if input line too short add zeros
			rgba = MATLAB_JET[sigVal]; // array of rgba values
			// byte reverse so number aa bb gg rr
			this.lineBuf8[opIdx] = rgba[0]; // red
			this.lineBuf8[opIdx + 1] = rgba[1]; // green
			this.lineBuf8[opIdx + 2] = rgba[2]; // blue
			this.lineBuf8[opIdx + 3] = rgba[3]; // alpha
		}
		this.offScreenCtx.putImageData(this.lineImgData, 0, this.nextLine);
		if (this.sgMode === 'RS') {
			this.incrementLine();
			// if not static draw a white line in front of the current line to indicate new data point
			if (this.lineRate) {
				this.offScreenCtx.putImageData(this.blankImgData, 0, this.nextLine);
			}
		}
	}

	horizontalNewLine() {
		if (this.sgMode == 'WF') {
			if (this.rhc) {
				// shift the current display right 1 line, oldest line drops off
				this.tmpImgData = this.offScreenCtx.getImageData(0, 0, this.lines - 1, this.pxPerLine);
				this.offScreenCtx.putImageData(this.tmpImgData, 1, 0);
			} else {
				// shift the current display left 1 line, oldest line drops off
				this.tmpImgData = this.offScreenCtx.getImageData(1, 0, this.lines - 1, this.pxPerLine);
				this.offScreenCtx.putImageData(this.tmpImgData, 0, 0);
			}
		}
		// refresh the page image (it was just shifted)
		const pageImgData = this.offScreenCtx.getImageData(0, 0, this.lines, this.pxPerLine);
		if (this.ipObj.buffer.constructor !== Uint8Array) {
			this.ipBuf8 = Uint8ClampedArray.from(this.ipObj.buffer); // clamp input values to 0..255 range
		} else {
			this.ipBuf8 = this.ipObj.buffer; // conversion already done
		}

		for (let sigVal, rgba, opIdx, ipIdx = 0; ipIdx < this.pxPerLine; ipIdx++) {
			sigVal = this.ipBuf8[ipIdx + this.startOfs] || 0; // if input line too short add zeros
			rgba = MATLAB_JET[sigVal]; // array of rgba values
			opIdx = 4 * ((this.pxPerLine - ipIdx - 1) * this.lines + this.nextLine);
			// byte reverse so number aa bb gg rr
			pageImgData.data[opIdx] = rgba[0]; // red
			pageImgData.data[opIdx + 1] = rgba[1]; // green
			pageImgData.data[opIdx + 2] = rgba[2]; // blue
			pageImgData.data[opIdx + 3] = rgba[3]; // alpha
		}
		if (this.sgMode === 'RS') {
			this.incrementLine();
			// if not draw a white line in front of the current line to indicate new data point
			if (this.lineRate) {
				for (let j = 0; j < this.pxPerLine; j++) {
					let opIdx: number;
					if (this.rhc) {
						opIdx = 4 * (j * this.lines + this.nextLine);
					} else {
						opIdx = 4 * ((this.pxPerLine - j - 1) * this.lines + this.nextLine);
					}
					// byte reverse so number aa bb gg rr
					pageImgData.data[opIdx] = 255; // red
					pageImgData.data[opIdx + 1] = 255; // green
					pageImgData.data[opIdx + 2] = 255; // blue
					pageImgData.data[opIdx + 3] = 255; // alpha
				}
			}
		}
		this.offScreenCtx.putImageData(pageImgData, 0, 0);
	}

	incrementLine() {
		if ((this.vert && !this.rhc) || (!this.vert && this.rhc)) {
			this.nextLine++;
			if (this.nextLine >= this.lines) {
				this.nextLine = 0;
			}
		} else {
			this.nextLine--;
			if (this.nextLine < 0) {
				this.nextLine = this.lines - 1;
			}
		}
	}

	updateWaterfall() {
		// grab latest line of data, write it to off screen buffer, inc 'nextLine'
		this.newLine();
		// loop to write data data at the desired rate, data is being updated asynchronously
		// ref for accurate timeout: http://www.sitepoint.com/creating-accurate-timers-in-javascript
		this.sgTime += this.interval;
		this.sgDiff = Date.now() - this.sgStartTime - this.sgTime;
		if (this.running) {
			this.timerID = setTimeout(this.updateWaterfall, this.interval - this.sgDiff);
		}
	}

	createOffScreenCanvas(): HTMLCanvasElement {
		const cvs = document.createElement('canvas');
		if (this.vert) {
			cvs.setAttribute('width', this.pxPerLine.toString()); // reset canvas pixels width
			cvs.setAttribute('height', this.lines.toString()); // don't use style for this
			this.clearImgData = new ImageData(this.clearBuf8, this.pxPerLine, this.lines);
		} // data written in columns
		else {
			cvs.setAttribute('width', this.lines.toString()); // reset canvas pixels width
			cvs.setAttribute('height', this.pxPerLine.toString()); // don't use style for this
			this.clearImgData = new ImageData(this.clearBuf8, this.lines, this.pxPerLine);
		}
		const ctx = cvs.getContext('2d');
		if (!ctx) {
			throw new Error('Could not create offscreen canvas');
		}
		this.offScreenCtx = ctx;

		return cvs;
	}

	stop() {
		this.running = false;
		if (this.timerID) {
			clearTimeout(this.timerID);
		}
		// reset where the next line is to be written
		if (this.sgMode === 'RS') {
			if (this.vert) {
				this.nextLine = this.rhc ? this.lines - 1 : 0;
			} else {
				this.nextLine = this.rhc ? 0 : this.lines - 1;
			}
		} // WF
		else {
			this.nextLine = this.rhc ? 0 : this.lines - 1;
		}
	}

	start() {
		this.sgStartTime = Date.now();
		this.sgTime = 0;
		this.running = true;
		this.updateWaterfall(); // start the update loop
	}

	clear() {
		this.offScreenCtx.putImageData(this.clearImgData, 0, 0);
	}

	setLineRate(newRate: number) {
		if (isNaN(newRate) || newRate > 50 || newRate < 0) {
			console.error('invalid line rate [0 <= lineRate < 50 lines/sec]');
			// don't change the lineRate;
		} else if (newRate === 0) {
			// static (one pass) raster
			this.lineRate = 0;
		} else {
			this.lineRate = newRate;
			this.interval = 1000 / this.lineRate; // msec
		}
	}

	drawToCanvas(canvas: HTMLCanvasElement) {
		const ctx = canvas.getContext('2d');
		if (!ctx) {
			throw new Error('Could not create canvas context');
		}
		ctx.drawImage(this.offScreenCvs, 0, 0);
	}
}

export default SpectrogramGen;
