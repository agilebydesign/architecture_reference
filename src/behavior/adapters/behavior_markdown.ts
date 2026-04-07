// behavior/adapters/behavior_markdown.ts — Formatted for docs/panels
import type { IBehavior } from "../behavior.js";
import type { IBehaviorOutputAdapter } from "./behavior_adapter.js";

export class BehaviorMarkdown implements IBehaviorOutputAdapter {
  constructor(private _behavior: IBehavior) {}

  get behavior(): string {
    const name = this._behavior.currentBehavior?.name ?? "(none)";
    const all = this._behavior.behaviors.map((b) => b.name).join(", ");
    return `## Behavior\n\n**Current:** ${name}\n**All:** ${all}\n`;
  }

  get action(): string {
    const name = this._behavior.currentAction?.name ?? "(none)";
    const all = this._behavior.actions.map((a) => a.name).join(", ");
    return `## Action\n\n**Current:** ${name}\n**All:** ${all}\n`;
  }

  get executionSetting(): string {
    return `**Execution Setting:** ${this._behavior.currentAction?.executionSetting ?? "(none)"}\n`;
  }

  get position(): string {
    const p = this._behavior.pos();
    return p.status === "success" ? `**Position:** ${p.position}\n` : `**Position:** (none)\n`;
  }

  get tree(): string {
    return `## Behavior Tree\n\n\`\`\`\n${this._behavior.tree()}\n\`\`\`\n`;
  }

  get navigation(): string {
    const b = this._behavior.currentBehavior?.name ?? "(none)";
    const a = this._behavior.currentAction?.name ?? "(none)";
    return `**Navigated to:** ${b}.${a}\n`;
  }

  get internals(): IBehavior {
    return this._behavior;
  }
}
