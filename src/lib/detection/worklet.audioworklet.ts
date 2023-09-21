const NUM_INPUT_SAMPLES = 1024;
const CONF_THRESHOLD = 0.75;

function getPitchHz(modelPitch: number) {
	const PT_OFFSET = 25.58;
	const PT_SLOPE = 63.07;
	const fmin = 10.0;
	const bins_per_octave = 12.0;
	const cqt_bin = modelPitch * PT_SLOPE + PT_OFFSET;
	return fmin * Math.pow(2.0, cqt_bin / bins_per_octave);
}

class PitchDetectionProcessor extends AudioWorkletProcessor {
	static get parameterDescriptors() {
		return [
			{
				name: 'modelUrl',
				defaultValue: ''
			}
		];
	}

	private model: tf.GraphModel | null = null;

	constructor() {
		super();
		this.port.onmessage = async (event) => {
			if (event.data.type === 'load-model') {
				const modelUrl = event.data.modelUrl;
				this.model = await tf.loadGraphModel(modelUrl);
			}
		};
	}

	process(inputs: Float32Array[][]) {
		const inputData = inputs[0][0];
		const input = tf.reshape(tf.tensor(inputData), [NUM_INPUT_SAMPLES]);
		const output = this.model?.execute({ input_audio_samples: input }) as tf.Tensor<tf.Rank>[];
		if (output === undefined) {
			return true;
		}

		const uncertainties = output[0].dataSync();
		const pitchesFetched = output[1].dataSync() as unknown as number[];
		const confidentPitchHzs = pitchesFetched
			.filter((pitch, i) => {
				const confidence = 1.0 - uncertainties[i];
				return confidence >= CONF_THRESHOLD;
			})
			.map((pitch) => getPitchHz(pitch));
		console.log(confidentPitchHzs);

		// pitches.set(confidentPitchHzs);

		return true;
	}
}

registerProcessor('pitch-detection-processor', PitchDetectionProcessor);
