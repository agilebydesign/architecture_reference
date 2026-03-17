// counter/adapters/counter_tty.ts — Human-readable terminal output
import type { ICounter } from "../counter.js";
import type { ICounterOutputAdapter } from "./counter_adapter.js";

export class CounterTty implements ICounterOutputAdapter {
  constructor(private _counter: ICounter) {}

  get total(): string {
    return `Total: ${this._counter.total}\n`;
  }

  get internals(): ICounter {
    return this._counter;
  }
}
