// bot/adapters/bot_markdown.ts — Formatted for docs/panels
import type { IBot } from "../bot.js";
import type { IBotOutputAdapter } from "./bot_adapter.js";

export class BotMarkdown implements IBotOutputAdapter {
  constructor(private _bot: IBot) {}

  get bot(): string {
    const name = this._bot.name || "(none)";
    const all = this._bot.availableBots.join(", ") || "(none)";
    return `## Bot\n\n**Current:** ${name}\n**Available:** ${all}\n`;
  }

  get description(): string {
    return `**Description:** ${this._bot.description || "(none)"}\n**Goal:** ${this._bot.goal || "(none)"}\n`;
  }

  get behaviorNames(): string {
    const names = this._bot.behaviorNames.join(", ") || "(none)";
    return `**Behaviors:** ${names}\n`;
  }

  get internals(): IBot {
    return this._bot;
  }
}
