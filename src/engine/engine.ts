// engine/engine.ts
import type { ICounter } from "../counter/counter.js";
import { Counter } from "../counter/counter.js";
import type { IContextFolder } from "../context_folder/context_folder.js";
import { ContextFolder } from "../context_folder/context_folder.js";
import type { IBotBehavior } from "../bot_behavior/bot_behavior.js";
import { BotBehavior } from "../bot_behavior/bot_behavior.js";

export class Engine {
  counter: ICounter;
  contextFolder: IContextFolder;
  botBehavior: IBotBehavior;

  constructor(counter?: ICounter, contextFolder?: IContextFolder, botBehavior?: IBotBehavior) {
    this.counter = counter ?? new Counter();
    this.contextFolder = contextFolder ?? new ContextFolder();
    this.botBehavior = botBehavior ?? new BotBehavior();
  }
}
