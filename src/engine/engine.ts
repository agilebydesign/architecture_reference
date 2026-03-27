// engine/engine.ts
import type { ICounter } from "../counter/counter.js";
import { Counter } from "../counter/counter.js";
import type { IContextFolder } from "../context_folder/context_folder.js";
import { ContextFolder } from "../context_folder/context_folder.js";

export class Engine {
  counter: ICounter;
  contextFolder: IContextFolder;

  constructor(counter?: ICounter, contextFolder?: IContextFolder) {
    this.counter = counter ?? new Counter();
    this.contextFolder = contextFolder ?? new ContextFolder();
  }
}
