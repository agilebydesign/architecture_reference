// engine/engine.ts
import type { ICounter } from "../counter/counter.js";
import { Counter } from "../counter/counter.js";

export class Engine {
  counter: ICounter;

  constructor(counter?: ICounter) {
    this.counter = counter ?? new Counter();
  }
}
