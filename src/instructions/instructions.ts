// instructions/instructions.ts — IInstructions interface + Instructions (root domain)

export interface InstructionsHydrateData {
  behaviorInstructions?: string[];
  actionInstructions?: string[];
}

/** Shared interface: Instructions, InstructionsServer, InstructionsView, and client implement this. */
export interface IInstructions {
  setBehaviorInstructions(instructions: string[]): void;
  setActionInstructions(instructions: string[]): void;
  readonly behaviorInstructions: string[];
  readonly actionInstructions: string[];
  readonly isEmpty: boolean;
  clear(): void;
  hydrate?(data: InstructionsHydrateData): void;
}

export class Instructions implements IInstructions {
  private _behaviorInstructions: string[] = [];
  private _actionInstructions: string[] = [];

  setBehaviorInstructions(instructions: string[]): void {
    this._behaviorInstructions = [...instructions];
  }

  setActionInstructions(instructions: string[]): void {
    this._actionInstructions = [...instructions];
  }

  get behaviorInstructions(): string[] {
    return [...this._behaviorInstructions];
  }

  get actionInstructions(): string[] {
    return [...this._actionInstructions];
  }

  get isEmpty(): boolean {
    return this._behaviorInstructions.length === 0 && this._actionInstructions.length === 0;
  }

  clear(): void {
    this._behaviorInstructions = [];
    this._actionInstructions = [];
  }

  hydrate(data: InstructionsHydrateData): void {
    if (data.behaviorInstructions !== undefined) {
      this._behaviorInstructions = [...data.behaviorInstructions];
    }
    if (data.actionInstructions !== undefined) {
      this._actionInstructions = [...data.actionInstructions];
    }
  }
}
