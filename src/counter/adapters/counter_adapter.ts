// counter/adapters/counter_adapter.ts — CLI output adapter interface
import type { ICounter } from "../counter.js";

/** CLI output adapters: wrap ICounter, expose formatted total (string). */
export interface ICounterOutputAdapter {
  readonly total: string;
  readonly internals: ICounter;
}
