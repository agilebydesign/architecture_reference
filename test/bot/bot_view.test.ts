// test/bot/bot_view.test.ts
import { describe, expect, beforeEach } from "vitest";
import * as path from "path";
import { BotView } from "../../src/bot/view/bot_view.js";
import { Bot } from "../../src/bot/bot.js";
import { BotTest, testStoryBotConfig } from "./bot_test.js";
import type { IBot } from "../../src/bot/bot.js";
import { Uri, createMockWebviewPanel } from "../__mocks__/vscode.js";
import type { WebviewPanel } from "../__mocks__/vscode.js";

describe("BotView", () => {
  let posted: unknown[];
  let mockPanel: WebviewPanel;
  // Point to project root so getHtml() can find templates
  const extensionUri = Uri.file(path.resolve(__dirname, "../.."));

  beforeEach(() => {
    posted = [];
    mockPanel = createMockWebviewPanel(posted);
  });

  class BotViewTest extends BotTest {
    private _view?: BotView;

    protected createBot(): IBot {
      const bot = new Bot();
      this._view = new BotView(
        mockPanel as unknown as import("vscode").WebviewPanel,
        bot,
        extensionUri as unknown as import("vscode").Uri
      );
      return this._view;
    }

    protected override assertBotName(bot: IBot, expected: string): void {
      // First: standard domain assertion
      super.assertBotName(bot, expected);

      // Server view adds: verify postMessage was called with botName
      if (posted.length > 0) {
        expect(posted).toContainEqual(expect.objectContaining({ botName: expected }));
      }

      // Verify the actual getHtml() renders the expected bot name
      const html = this._view!.getHtml();
      if (expected) {
        expect(html).toContain(expected);
      }
    }

    protected override assertBehaviorNames(bot: IBot, expected: string[]): void {
      // First: standard domain assertion
      super.assertBehaviorNames(bot, expected);

      // Server view adds: verify postMessage contains behavior names
      if (posted.length > 0 && expected.length > 0) {
        expect(posted).toContainEqual(expect.objectContaining({ botBehaviorNames: expected.join(", ") }));
      }
    }
  }

  new BotViewTest().registerTests();
});
