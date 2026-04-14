// instructions/adapters/instructions_adapter.ts — CLI output adapter interface
import type { IInstructions } from "../instructions.js";

/** CLI output adapters: wrap IInstructions, expose formatted instruction strings. */
export interface IInstructionsOutputAdapter {
  readonly behaviorInstructions: string;
  readonly actionInstructions: string;
  readonly allInstructions: string;
  readonly internals: IInstructions;
}
