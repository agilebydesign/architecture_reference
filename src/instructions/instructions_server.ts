// instructions/instructions_server.ts — server domain: extends Instructions
// No independent persistence — instructions are derived from behavior state.
// _load() and _save() are no-ops because instruction state is derived, not stored.
import { Instructions } from "./instructions.js";

export class InstructionsServer extends Instructions {
  private _load(): void {
    // No-op: instructions are derived from behavior state, not persisted independently.
  }

  private _save(): void {
    // No-op: instructions are derived from behavior state, not persisted independently.
  }
}
