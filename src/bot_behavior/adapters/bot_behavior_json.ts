// bot_behavior/adapters/bot_behavior_json.ts — Machine-readable; for tooling
import type { IBotBehavior } from "../bot_behavior.js";
import type { IBotBehaviorOutputAdapter } from "./bot_behavior_adapter.js";

export class BotBehaviorJson implements IBotBehaviorOutputAdapter {
  constructor(private _botBehavior: IBotBehavior) {}

  get behavior(): string {
    return JSON.stringify({
      currentBehavior: this._botBehavior.currentBehavior?.name ?? "",
      behaviors: this._botBehavior.behaviors.map((b) => b.name),
    });
  }

  get action(): string {
    return JSON.stringify({
      currentAction: this._botBehavior.currentAction?.name ?? "",
      actions: this._botBehavior.actions.map((a) => a.name),
    });
  }

  get executionSetting(): string {
    return JSON.stringify({
      executionSetting: this._botBehavior.currentAction?.executionSetting ?? "",
    });
  }

  get position(): string {
    return JSON.stringify(this._botBehavior.pos());
  }

  get tree(): string {
    return JSON.stringify({ tree: this._botBehavior.tree() });
  }

  get navigation(): string {
    return JSON.stringify({
      behavior: this._botBehavior.currentBehavior?.name ?? "",
      action: this._botBehavior.currentAction?.name ?? "",
    });
  }

  get internals(): IBotBehavior {
    return this._botBehavior;
  }
}
