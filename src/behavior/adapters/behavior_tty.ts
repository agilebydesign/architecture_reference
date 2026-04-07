// behavior/adapters/behavior_tty.ts — Human-readable terminal output
import type { IBehavior } from "../behavior.js";
import type { IBehaviorOutputAdapter } from "./behavior_adapter.js";

export class BehaviorTty implements IBehaviorOutputAdapter {
  constructor(private _behavior: IBehavior) {}

  get behavior(): string {
    return `Behavior: ${this._behavior.currentBehavior?.name ?? "(none)"}\n`;
  }

  get action(): string {
    return `Action: ${this._behavior.currentAction?.name ?? "(none)"}\n`;
  }

  get executionSetting(): string {
    return `Execution Setting: ${this._behavior.currentAction?.executionSetting ?? "(none)"}\n`;
  }

  get position(): string {
    const p = this._behavior.pos();
    return p.status === "success" ? `Position: ${p.position}\n` : `Position: (none)\n`;
  }

  get tree(): string {
    return this._behavior.tree() + "\n";
  }

  get navigation(): string {
    const b = this._behavior.currentBehavior?.name ?? "(none)";
    const a = this._behavior.currentAction?.name ?? "(none)";
    return `Navigated to: ${b}.${a}\n`;
  }

  get internals(): IBehavior {
    return this._behavior;
  }
}
