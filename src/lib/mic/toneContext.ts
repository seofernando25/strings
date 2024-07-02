import { signal } from '@preact/signals-core';
import * as Tone from 'tone';
export const toneContext = signal(Tone.getContext());
