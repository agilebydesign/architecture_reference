// bot/adapters/bot_json.ts — Machine-readable; for tooling
import type { IBot } from "../bot.js";
import type { IBotOutputAdapter } from "./bot_adapter.js";

export class BotJson implements IBotOutputAdapter {
  constructor(private _bot: IBot) {}

  get bot(): string {
    return JSON.stringify({
      name: this._bot.name,
      availableBots: this._bot.availableBots,
    });
  }

  get description(): string {
    return JSON.stringify({
      description: this._bot.description,
      goal: this._bot.goal,
    });
  }

  get behaviorNames(): string {
    return JSON.stringify({
      behaviorNames: this._bot.behaviorNames,
    });
  }

  get internals(): IBot {
    return this._bot;
  }
}
