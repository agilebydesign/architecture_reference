// instructions/adapters/instructions_markdown.ts — Formatted for docs/panels
import type { IInstructions } from "../instructions.js";
import type { IInstructionsOutputAdapter } from "./instructions_adapter.js";

export class InstructionsMarkdown implements IInstructionsOutputAdapter {
  constructor(private _instructions: IInstructions) {}

  get behaviorInstructions(): string {
    const items = this._instructions.behaviorInstructions;
    if (items.length === 0) return "## Behavior Instructions\n\n*No behavior instructions.*\n";
    return `## Behavior Instructions\n\n${items.map((i) => `- ${i}`).join("\n")}\n`;
  }

  get actionInstructions(): string {
    const items = this._instructions.actionInstructions;
    if (items.length === 0) return "## Action Instructions\n\n*No action instructions.*\n";
    return `## Action Instructions\n\n${items.map((i) => `- ${i}`).join("\n")}\n`;
  }

  get allInstructions(): string {
    return this.behaviorInstructions + "\n" + this.actionInstructions;
  }

  get internals(): IInstructions {
    return this._instructions;
  }
}
