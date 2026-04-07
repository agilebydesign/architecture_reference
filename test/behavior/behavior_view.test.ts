// test/behavior/behavior_view.test.ts
import { describe, expect, beforeEach } from "vitest";
import * as path from "path";
import { BehaviorView } from "../../src/behavior/view/behavior_view.js";
import { Behavior } from "../../src/behavior/behavior.js";
import { BehaviorTest, testAllowedBehaviors, testBehaviorConfigs, testBaseActionConfigs } from "./behavior_test.js";
import type { IBehavior, NavigationResult } from "../../src/behavior/behavior.js";
import { Uri, createMockWebviewPanel } from "../__mocks__/vscode.js";
import type { WebviewPanel } from "../__mocks__/vscode.js";

describe("BehaviorView", () => {
  let posted: unknown[];
  let mockPanel: WebviewPanel;
  // Point to project root so getHtml() can find templates
  const extensionUri = Uri.file(path.resolve(__dirname, "../.."));

  beforeEach(() => {
    posted = [];
    mockPanel = createMockWebviewPanel(posted);
  });

  class BehaviorViewTest extends BehaviorTest {
    private _view?: BehaviorView;

    protected createBehavior(): IBehavior {
      const behavior = new Behavior();
      this._view = new BehaviorView(
        mockPanel as unknown as import("vscode").WebviewPanel,
        behavior,
        extensionUri as unknown as import("vscode").Uri
      );
      return this._view;
    }

    protected override assertCurrentBehavior(behavior: IBehavior, expected: string): void {
      // First: standard domain assertion
      super.assertCurrentBehavior(behavior, expected);

      // Server view adds: verify postMessage was called with currentBehavior
      if (posted.length > 0) {
        expect(posted).toContainEqual(expect.objectContaining({ currentBehavior: expected }));
      }

      // Verify the actual getHtml() renders the expected behavior
      const html = this._view!.getHtml();
      expect(html).toContain(expected);
    }

    protected override assertCurrentAction(behavior: IBehavior, expected: string): void {
      // First: standard domain assertion
      super.assertCurrentAction(behavior, expected);

      // Server view adds: verify postMessage was called with currentAction
      if (posted.length > 0) {
        expect(posted).toContainEqual(expect.objectContaining({ currentAction: expected }));
      }
    }

    protected override assertNavigation(behavior: IBehavior, result: NavigationResult, expectedBehavior: string, expectedAction: string): void {
      super.assertNavigation(behavior, result, expectedBehavior, expectedAction);

      // View adds: verify postMessage contains updated state
      expect(posted).toContainEqual(expect.objectContaining({
        currentBehavior: expectedBehavior,
        currentAction: expectedAction,
      }));
    }
  }

  new BehaviorViewTest().registerTests();
});
