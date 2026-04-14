// test/instructions/instructions_view.test.ts — View layer tests
import { describe, expect, beforeEach } from "vitest";
import * as path from "path";
import { InstructionsView } from "../../src/instructions/view/instructions_view.js";
import { Instructions } from "../../src/instructions/instructions.js";
import { InstructionsTest } from "./instructions_test.js";
import type { IInstructions } from "../../src/instructions/instructions.js";
import { Uri, createMockWebviewPanel } from "../__mocks__/vscode.js";
import type { WebviewPanel } from "../__mocks__/vscode.js";

describe("InstructionsView", () => {
  let posted: unknown[];
  let mockPanel: WebviewPanel;
  // Point to project root so getHtml() can find templates
  const extensionUri = Uri.file(path.resolve(__dirname, "../.."));

  beforeEach(() => {
    posted = [];
    mockPanel = createMockWebviewPanel(posted);
  });

  class InstructionsViewTest extends InstructionsTest {
    private _view?: InstructionsView;

    protected createInstructions(): IInstructions {
      const instructions = new Instructions();
      this._view = new InstructionsView(
        mockPanel as unknown as import("vscode").WebviewPanel,
        instructions,
        extensionUri as unknown as import("vscode").Uri
      );
      return this._view;
    }

    protected override assertBehaviorInstructions(instructions: IInstructions, expected: string[]): void {
      super.assertBehaviorInstructions(instructions, expected);

      // View adds: verify postMessage was called with behaviorInstructions
      if (posted.length > 0) {
        expect(posted).toContainEqual(expect.objectContaining({ behaviorInstructions: expected }));
      }
    }

    protected override assertActionInstructions(instructions: IInstructions, expected: string[]): void {
      super.assertActionInstructions(instructions, expected);

      // View adds: verify postMessage was called with actionInstructions
      if (posted.length > 0) {
        expect(posted).toContainEqual(expect.objectContaining({ actionInstructions: expected }));
      }
    }

    protected override assertIsEmpty(instructions: IInstructions, expected: boolean): void {
      super.assertIsEmpty(instructions, expected);

      // View adds: verify getHtml contains the instructions panel
      if (this._view) {
        const html = this._view.getHtml();
        expect(html).toContain("instructions-panel");
      }
    }
  }

  new InstructionsViewTest().registerTests();
});
