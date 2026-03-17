// counter/adapters/counter_json.ts — Machine-readable; for tooling
import type { ICounter } from "../counter.js";
import type { ICounterOutputAdapter } from "./counter_adapter.js";

export class CounterJson implements ICounterOutputAdapter {
  constructor(private _counter: ICounter) {}

  get total(): string {
    return JSON.stringify({ total: this._counter.total });
  }

  get internals(): ICounter {
    return this._counter;
  }
}
