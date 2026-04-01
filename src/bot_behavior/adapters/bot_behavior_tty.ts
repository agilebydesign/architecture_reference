// bot_behavior/adapters/bot_behavior_tty.ts — Human-readable terminal output
import type { IBotBehavior } from "../bot_behavior.js";
import type { IBotBehaviorOutputAdapter } from "./bot_behavior_adapter.js";

export class BotBehaviorTty implements IBotBehaviorOutputAdapter {
  constructor(private _botBehavior: IBotBehavior) {}

  get behavior(): string {
    return `Behavior: ${this._botBehavior.currentBehavior?.name ?? "(none)"}\n`;
  }

  get action(): string {
    return `Action: ${this._botBehavior.currentAction?.name ?? "(none)"}\n`;
  }

  get executionSetting(): string {
    return `Execution Setting: ${this._botBehavior.currentAction?.executionSetting ?? "(none)"}\n`;
  }

  get internals(): IBotBehavior {
    return this._botBehavior;
  }
}
