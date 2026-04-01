// bot_behavior/adapters/bot_behavior_adapter.ts — CLI output adapter interface
import type { IBotBehavior } from "../bot_behavior.js";

/** CLI output adapters: wrap IBotBehavior, expose formatted behavior/action (strings). */
export interface IBotBehaviorOutputAdapter {
  readonly behavior: string;
  readonly action: string;
  readonly executionSetting: string;
  readonly internals: IBotBehavior;
}
