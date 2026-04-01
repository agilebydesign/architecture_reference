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

  get internals(): IBotBehavior {
    return this._botBehavior;
  }
}
