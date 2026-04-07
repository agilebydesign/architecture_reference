// bot/adapters/bot_adapter.ts — CLI output adapter interface
import type { IBot } from "../bot.js";

/** CLI output adapters: wrap IBot, expose formatted bot info (strings). */
export interface IBotOutputAdapter {
  readonly bot: string;
  readonly description: string;
  readonly behaviorNames: string;
  readonly internals: IBot;
}
