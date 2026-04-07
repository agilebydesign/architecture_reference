// behavior/adapters/behavior_adapter.ts — CLI output adapter interface
import type { IBehavior } from "../behavior.js";

/** CLI output adapters: wrap IBehavior, expose formatted behavior/action (strings). */
export interface IBehaviorOutputAdapter {
  readonly behavior: string;
  readonly action: string;
  readonly executionSetting: string;
  readonly position: string;
  readonly tree: string;
  readonly navigation: string;
  readonly internals: IBehavior;
}
