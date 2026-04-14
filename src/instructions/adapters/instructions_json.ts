// instructions/adapters/instructions_json.ts — Machine-readable; for tooling
import type { IInstructions } from "../instructions.js";
import type { IInstructionsOutputAdapter } from "./instructions_adapter.js";

export class InstructionsJson implements IInstructionsOutputAdapter {
  constructor(private _instructions: IInstructions) {}

  get behaviorInstructions(): string {
    return JSON.stringify({
      behaviorInstructions: this._instructions.behaviorInstructions,
    });
  }

  get actionInstructions(): string {
    return JSON.stringify({
      actionInstructions: this._instructions.actionInstructions,
    });
  }

  get allInstructions(): string {
    return JSON.stringify({
      behaviorInstructions: this._instructions.behaviorInstructions,
      actionInstructions: this._instructions.actionInstructions,
    });
  }

  get internals(): IInstructions {
    return this._instructions;
  }
}
