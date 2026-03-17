// counter/adapters/counter_markdown.ts — Formatted for docs/panels
import type { ICounter } from "../counter.js";
import type { ICounterOutputAdapter } from "./counter_adapter.js";

export class CounterMarkdown implements ICounterOutputAdapter {
  constructor(private _counter: ICounter) {}

  get total(): string {
    return `## Counter\n\n**Total:** ${this._counter.total}\n`;
  }

  get internals(): ICounter {
    return this._counter;
  }
}
