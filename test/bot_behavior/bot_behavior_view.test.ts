// test/bot_behavior/bot_behavior_view.test.ts
import { describe, expect, beforeEach } from "vitest";
import * as path from "path";
import { BotBehaviorView } from "../../src/bot_behavior/view/bot_behavior_view.js";
import { BotBehavior } from "../../src/bot_behavior/bot_behavior.js";
import { BotBehaviorTest, testAllowedBehaviors, testBehaviorConfigs, testBaseActionConfigs } from "./bot_behavior_test.js";
import type { IBotBehavior } from "../../src/bot_behavior/bot_behavior.js";
import { Uri, createMockWebviewPanel } from "../__mocks__/vscode.js";
import type { WebviewPanel } from "../__mocks__/vscode.js";

describe("BotBehaviorView", () => {
  let posted: unknown[];
  let mockPanel: WebviewPanel;
  // Point to project root so getHtml() can find templates
  const extensionUri = Uri.file(path.resolve(__dirname, "../.."));

  beforeEach(() => {
    posted = [];
    mockPanel = createMockWebviewPanel(posted);
  });

  class BotBehaviorViewTest extends BotBehaviorTest {
    private _view?: BotBehaviorView;

    protected createBotBehavior(): IBotBehavior {
      const botBehavior = new BotBehavior();
      this._view = new BotBehaviorView(
        mockPanel as unknown as import("vscode").WebviewPanel,
        botBehavior,
        extensionUri as unknown as import("vscode").Uri
      );
      return this._view;
    }

    protected override assertCurrentBehavior(botBehavior: IBotBehavior, expected: string): void {
      // First: standard domain assertion
      super.assertCurrentBehavior(botBehavior, expected);

      // Server view adds: verify postMessage was called with currentBehavior
      if (posted.length > 0) {
        expect(posted).toContainEqual(expect.objectContaining({ currentBehavior: expected }));
      }

      // Verify the actual getHtml() renders the expected behavior
      const html = this._view!.getHtml();
      expect(html).toContain(expected);
    }

    protected override assertCurrentAction(botBehavior: IBotBehavior, expected: string): void {
      // First: standard domain assertion
      super.assertCurrentAction(botBehavior, expected);

      // Server view adds: verify postMessage was called with currentAction
      if (posted.length > 0) {
        expect(posted).toContainEqual(expect.objectContaining({ currentAction: expected }));
      }
    }
  }

  new BotBehaviorViewTest().registerTests();
});
