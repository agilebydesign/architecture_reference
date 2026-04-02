// bot_behavior/adapters/bot_behavior_markdown.ts — Formatted for docs/panels
import type { IBotBehavior } from "../bot_behavior.js";
import type { IBotBehaviorOutputAdapter } from "./bot_behavior_adapter.js";

export class BotBehaviorMarkdown implements IBotBehaviorOutputAdapter {
  constructor(private _botBehavior: IBotBehavior) {}

  get behavior(): string {
    const name = this._botBehavior.currentBehavior?.name ?? "(none)";
    const all = this._botBehavior.behaviors.map((b) => b.name).join(", ");
    return `## Bot Behavior\n\n**Current:** ${name}\n**All:** ${all}\n`;
  }

  get action(): string {
    const name = this._botBehavior.currentAction?.name ?? "(none)";
    const all = this._botBehavior.actions.map((a) => a.name).join(", ");
    return `## Action\n\n**Current:** ${name}\n**All:** ${all}\n`;
  }

  get executionSetting(): string {
    return `**Execution Setting:** ${this._botBehavior.currentAction?.executionSetting ?? "(none)"}\n`;
  }

  get position(): string {
    const p = this._botBehavior.pos();
    return p.status === "success" ? `**Position:** ${p.position}\n` : `**Position:** (none)\n`;
  }

  get tree(): string {
    return `## Behavior Tree\n\n\`\`\`\n${this._botBehavior.tree()}\n\`\`\`\n`;
  }

  get navigation(): string {
    const b = this._botBehavior.currentBehavior?.name ?? "(none)";
    const a = this._botBehavior.currentAction?.name ?? "(none)";
    return `**Navigated to:** ${b}.${a}\n`;
  }

  get internals(): IBotBehavior {
    return this._botBehavior;
  }
}
