// bot/adapters/bot_tty.ts — Human-readable terminal output
import type { IBot } from "../bot.js";
import type { IBotOutputAdapter } from "./bot_adapter.js";

export class BotTty implements IBotOutputAdapter {
  constructor(private _bot: IBot) {}

  get bot(): string {
    return `Bot: ${this._bot.name || "(none)"}\n`;
  }

  get description(): string {
    return `Description: ${this._bot.description || "(none)"}\n`;
  }

  get behaviorNames(): string {
    const names = this._bot.behaviorNames.join(", ") || "(none)";
    return `Behaviors: ${names}\n`;
  }

  get internals(): IBot {
    return this._bot;
  }
}
