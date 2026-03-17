// test/counter/counter_view.test.ts
import { describe, expect, beforeEach } from "vitest";
import { CounterView } from "../../src/counter/view/counter_view.js";
import { Counter } from "../../src/counter/counter.js";
import { CounterTest } from "./counter_test.js";
import type { ICounter } from "../../src/counter/counter.js";
import { Uri, createMockWebviewPanel } from "../__mocks__/vscode.js";
import type { WebviewPanel } from "../__mocks__/vscode.js";

describe("CounterView", () => {
  let posted: unknown[];
  let mockPanel: WebviewPanel;
  const mockExtensionUri = Uri.file("/tmp/ext");

  beforeEach(() => {
    posted = [];
    mockPanel = createMockWebviewPanel(posted);
  });

  class CounterViewTest extends CounterTest {
    private _view?: CounterView;

    protected createCounter(): ICounter {
      const counter = new Counter();
      this._view = new CounterView(
        mockPanel as unknown as import("vscode").WebviewPanel,
        counter,
        mockExtensionUri as unknown as import("vscode").Uri
      );
      return this._view;
    }

    protected override assertTotal(counter: ICounter, expected: number): void {
      // First: standard domain assertion
      super.assertTotal(counter, expected);

      // Server view adds: verify postMessage was called with total
      // (only when there are messages - "starts at zero" has no operations)
      if (posted.length > 0) {
        expect(posted).toContainEqual({ total: expected });
      }

      // Skip HTML check since it requires template file on disk
      // In a real setup, getHtml() would be tested with proper fixtures
    }
  }

  new CounterViewTest().registerTests();
});
