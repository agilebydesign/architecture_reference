// instructions/view/instructions_client.ts — Client: extends Instructions with DOM updates and server sync

import { Instructions, type InstructionsHydrateData } from "../instructions.js";

interface VsCodeApi {
  postMessage(message: unknown): void;
}

/** Extends Instructions with DOM updates and server synchronization */
export class InstructionsClient extends Instructions {
  private vscode: VsCodeApi;
  private instructionsPanelEl: HTMLElement;

  constructor(vscode: VsCodeApi) {
    super();
    this.vscode = vscode;
    this.instructionsPanelEl = document.getElementById("instructions-panel") as HTMLElement;
  }

  private syncToServer(command: string, value?: unknown): void {
    this.vscode.postMessage(value !== undefined ? { command, value } : { command });
  }

  override setBehaviorInstructions(instructions: string[]): void {
    super.setBehaviorInstructions(instructions);
    this._updateInstructionsPanel();
  }

  override setActionInstructions(instructions: string[]): void {
    super.setActionInstructions(instructions);
    this._updateInstructionsPanel();
  }

  override clear(): void {
    super.clear();
    this._updateInstructionsPanel();
  }

  override hydrate(data: InstructionsHydrateData): void {
    super.hydrate(data);
    this._updateInstructionsPanel();
  }

  _updateInstructionsPanel(): void {
    if (!this.instructionsPanelEl) return;

    this.instructionsPanelEl.innerHTML = "";

    const allInstructions = [
      ...this.behaviorInstructions,
      ...this.actionInstructions,
    ];

    if (allInstructions.length === 0) {
      const emptyEl = document.createElement("span");
      emptyEl.className = "instructions-empty";
      emptyEl.textContent = "No instructions available";
      this.instructionsPanelEl.appendChild(emptyEl);
      return;
    }

    for (const instruction of allInstructions) {
      const itemEl = document.createElement("div");
      itemEl.className = "instruction-item";
      itemEl.textContent = instruction;
      this.instructionsPanelEl.appendChild(itemEl);
    }
  }
}

export function initInstructionsClient(vscode: VsCodeApi): InstructionsClient {
  const instructions = new InstructionsClient(vscode);

  window.addEventListener("message", (event: MessageEvent) => {
    if ("behaviorInstructions" in event.data || "actionInstructions" in event.data) {
      instructions.hydrate(event.data as InstructionsHydrateData);
    }
  });

  vscode.postMessage({ command: "instructions.requestInit" });

  return instructions;
}
