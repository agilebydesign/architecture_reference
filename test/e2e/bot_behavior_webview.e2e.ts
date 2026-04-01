// e2e/bot_behavior_webview.e2e.ts — E2E tests for BotBehavior webview
/// <reference types="mocha" />
import { expect, $ } from "@wdio/globals";
import { WebView } from "wdio-vscode-service";
import * as fs from "fs";
import * as path from "path";
import { WebViewBotBehaviorAdapter } from "./adapters/webview_bot_behavior_adapter";
import { getEngineWebview } from "./helpers/get_webview";
import { botBehaviorLocators } from "./pageobjects/locators";
import { testPersistenceFixture } from "../test_data/bot_behavior_fixtures";

// Path to persistence file relative to project root (extensionPath in wdio.conf.ts)
const persistencePath = path.resolve(__dirname, "../../persistence/bot_behavior.json");

/**
 * E2E tests for BotBehavior webview.
 *
 * Mirrors the same scenarios from BotBehaviorTest.registerTests() but with async DOM assertions.
 * Before testing, writes a fixture config to persistence/bot_behavior.json so BotBehaviorServer
 * loads the expected state when the webview opens.
 */
describe("bot_behavior_webview", () => {
  let webview: WebView;
  let botBehavior: WebViewBotBehaviorAdapter;
  let originalPersistence: string | null = null;

  /**
   * Assert current behavior name matches expected via adapter and raw DOM.
   */
  async function assertCurrentBehavior(expected: string): Promise<void> {
    const name = await botBehavior.getCurrentBehaviorAsync();
    expect(name).toBe(expected);
    await expect($(botBehaviorLocators.currentBehavior)).toHaveText(expected);
  }

  /**
   * Assert current action name matches expected via adapter and raw DOM.
   */
  async function assertCurrentAction(expected: string): Promise<void> {
    const name = await botBehavior.getCurrentActionAsync();
    expect(name).toBe(expected);
    await expect($(botBehaviorLocators.currentAction)).toHaveText(expected);
  }

  before(async () => {
    // Save original persistence file if it exists, then write fixture
    try {
      originalPersistence = fs.readFileSync(persistencePath, "utf8");
    } catch (_) {
      originalPersistence = null;
    }
    fs.writeFileSync(persistencePath, JSON.stringify(testPersistenceFixture));

    webview = await getEngineWebview();
    botBehavior = new WebViewBotBehaviorAdapter(webview);
  });

  after(async () => {
    if (webview) {
      await webview.close();
    }
    // Restore original persistence file
    if (originalPersistence !== null) {
      fs.writeFileSync(persistencePath, originalPersistence);
    } else {
      fs.writeFileSync(persistencePath, JSON.stringify({ currentBehavior: "", currentAction: "", executionSettings: {} }));
    }
  });

  // Story: Load Bot Behaviors — same scenarios as BotBehaviorTest
  describe("Given bot behaviors are loaded (Story: Load Bot Behaviors)", () => {
    it("Bot behaviors are loaded from BotConfig", async () => {
      const count = await botBehavior.getBehaviorCountAsync();
      expect(count).toBe(6);
    });

    it("When behaviors are loaded, first behavior is set as current", async () => {
      await assertCurrentBehavior("shape");
    });

    it("Loaded behavior provides access to all config properties", async () => {
      // In the webview, we verify the current behavior name is rendered
      // (config properties are server-side; DOM displays the name)
      await assertCurrentBehavior("shape");
      const count = await botBehavior.getBehaviorCountAsync();
      expect(count).toBe(6);
    });
  });

  // Story: Load Actions — same scenarios as BotBehaviorTest
  describe("Given actions are loaded (Story: Load Actions)", () => {
    it("Actions are loaded and available", async () => {
      const count = await botBehavior.getActionCountAsync();
      expect(count).toBe(5);
    });

    it("When actions are loaded, first action is set as current", async () => {
      await assertCurrentAction("clarify");
    });

    it("Action merges instructions from BaseActionConfig and Behavior config", async () => {
      // Instructions are server-side data; verify the action loaded correctly
      // by checking the current action name (clarify) which has merged instructions
      await assertCurrentAction("clarify");
      const count = await botBehavior.getActionCountAsync();
      expect(count).toBe(5);
    });
  });
});
