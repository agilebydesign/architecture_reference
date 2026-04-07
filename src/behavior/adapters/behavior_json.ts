// behavior/adapters/behavior_json.ts — Machine-readable; for tooling
import type { IBehavior } from "../behavior.js";
import type { IBehaviorOutputAdapter } from "./behavior_adapter.js";

export class BehaviorJson implements IBehaviorOutputAdapter {
  constructor(private _behavior: IBehavior) {}

  get behavior(): string {
    return JSON.stringify({
      currentBehavior: this._behavior.currentBehavior?.name ?? "",
      behaviors: this._behavior.behaviors.map((b) => b.name),
    });
  }

  get action(): string {
    return JSON.stringify({
      currentAction: this._behavior.currentAction?.name ?? "",
      actions: this._behavior.actions.map((a) => a.name),
    });
  }

  get executionSetting(): string {
    return JSON.stringify({
      executionSetting: this._behavior.currentAction?.executionSetting ?? "",
    });
  }

  get position(): string {
    return JSON.stringify(this._behavior.pos());
  }

  get tree(): string {
    return JSON.stringify({ tree: this._behavior.tree() });
  }

  get navigation(): string {
    return JSON.stringify({
      behavior: this._behavior.currentBehavior?.name ?? "",
      action: this._behavior.currentAction?.name ?? "",
    });
  }

  get internals(): IBehavior {
    return this._behavior;
  }
}
