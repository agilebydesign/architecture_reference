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

  get position(): string {
    const p = this._botBehavior.pos();
    return p.status === "success" ? `Position: ${p.position}\n` : `Position: (none)\n`;
  }

  get tree(): string {
    return this._botBehavior.tree() + "\n";
  }

  get navigation(): string {
    const b = this._botBehavior.currentBehavior?.name ?? "(none)";
    const a = this._botBehavior.currentAction?.name ?? "(none)";
    return `Navigated to: ${b}.${a}\n`;
  }

  get internals(): IBotBehavior {
    return this._botBehavior;
  }
}
