// instructions/adapters/instructions_tty.ts — Human-readable terminal output
import type { IInstructions } from "../instructions.js";
import type { IInstructionsOutputAdapter } from "./instructions_adapter.js";

export class InstructionsTty implements IInstructionsOutputAdapter {
  constructor(private _instructions: IInstructions) {}

  get behaviorInstructions(): string {
    const items = this._instructions.behaviorInstructions;
    if (items.length === 0) return "Behavior Instructions: (none)\n";
    return `Behavior Instructions:\n${items.map((i) => `  - ${i}`).join("\n")}\n`;
  }

  get actionInstructions(): string {
    const items = this._instructions.actionInstructions;
    if (items.length === 0) return "Action Instructions: (none)\n";
    return `Action Instructions:\n${items.map((i) => `  - ${i}`).join("\n")}\n`;
  }

  get allInstructions(): string {
    return this.behaviorInstructions + this.actionInstructions;
  }

  get internals(): IInstructions {
    return this._instructions;
  }
}
