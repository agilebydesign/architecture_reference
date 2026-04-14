// e2e/adapters/webview_instructions_adapter.ts — IInstructions implementation via WebView DOM
import { $, $$ } from "@wdio/globals";
import type { WebView } from "wdio-vscode-service";
import type { IInstructions, InstructionsHydrateData } from "../../../src/instructions/instructions";

/**
 * Wraps WebView DOM as IInstructions for E2E tests.
 * All read operations are async (wdio calls return Promises).
 * Sync interface methods throw — use async counterparts.
 */
export class WebViewInstructionsAdapter implements IInstructions {
  constructor(private readonly webview: WebView) {}

  setBehaviorInstructions(_instructions: string[]): void {
    throw new Error("setBehaviorInstructions() not available in E2E — triggered server-side");
  }

  setActionInstructions(_instructions: string[]): void {
    throw new Error("setActionInstructions() not available in E2E — triggered server-side");
  }

  get behaviorInstructions(): string[] {
    throw new Error("Use getInstructionItemsAsync() for E2E tests - wdio is async");
  }

  get actionInstructions(): string[] {
    throw new Error("Use getInstructionItemsAsync() for E2E tests - wdio is async");
  }

  get isEmpty(): boolean {
    throw new Error("Use isInstructionsEmptyAsync() for E2E tests - wdio is async");
  }

  clear(): void {
    throw new Error("clear() not available in E2E — triggered server-side");
  }

  hydrate(_data: InstructionsHydrateData): void {
    throw new Error("hydrate() not available in E2E — triggered server-side");
  }

  // --- Async DOM readers ---

  async getInstructionItemsAsync(): Promise<string[]> {
    const items = await $$("#instructions-panel .instruction-item");
    const texts: string[] = [];
    for (const item of items) {
      texts.push(await item.getText());
    }
    return texts;
  }

  async getInstructionCountAsync(): Promise<number> {
    const items = await $$("#instructions-panel .instruction-item");
    return items.length;
  }

  async isInstructionsEmptyAsync(): Promise<boolean> {
    const emptyEl = await $("#instructions-panel .instructions-empty");
    return await emptyEl.isExisting();
  }
}
