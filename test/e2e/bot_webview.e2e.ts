// e2e/bot_webview.e2e.ts — E2E tests for Bot webview
/// <reference types="mocha" />
import { expect, $ } from "@wdio/globals";
import type { WebView } from "wdio-vscode-service";
import * as fs from "fs";
import * as path from "path";
import { WebViewBotAdapter } from "./adapters/webview_bot_adapter";
import { getEngineWebview } from "./helpers/get_webview";
import { botLocators } from "./pageobjects/locators";
import { testPersistenceFixture } from "../test_data/bot_fixtures";

// Path to persistence file relative to project root
const persistencePath = path.resolve(__dirname, "../../persistence/bot.json");

/**
 * E2E tests for Bot webview.
 *
 * Mirrors the same scenarios from BotTest.registerTests() but with async DOM assertions.
 */
describe("bot_webview", () => {
  let webview: WebView;
  let bot: WebViewBotAdapter;
  let originalPersistence: string | null = null;

  async function assertBotName(expected: string): Promise<void> {
    const name = await bot.getNameAsync();
    expect(name).toBe(expected);
    await expect($(botLocators.botName)).toHaveText(expected);
  }

  async function assertBehaviorNames(expected: string[]): Promise<void> {
    const names = await bot.getBehaviorNamesAsync();
    expect(names).toEqual(expected);
  }

  before(async () => {
    try {
      originalPersistence = fs.readFileSync(persistencePath, "utf8");
    } catch (_) {
      originalPersistence = null;
    }
    fs.writeFileSync(persistencePath, JSON.stringify(testPersistenceFixture));

    webview = await getEngineWebview();
    bot = new WebViewBotAdapter(webview);
  });

  after(async () => {
    if (webview) {
      await webview.close();
    }
    if (originalPersistence !== null) {
      fs.writeFileSync(persistencePath, originalPersistence);
    } else {
      fs.writeFileSync(persistencePath, JSON.stringify({ currentBot: "" }));
    }
  });

  describe("Given a bot is initialized (Story: Bot Selection)", () => {
    it("Then available bots are loaded from config", async () => {
      const available = await bot.getAvailableBotsAsync();
      expect(available.length).toBeGreaterThan(0);
    });

    it("When bots are loaded, Then the persisted bot is set as current", async () => {
      await assertBotName("story_bot");
    });

    it("Then the bot description is displayed", async () => {
      await bot.toggleDetailsAsync();
      const desc = await bot.getDescriptionAsync();
      expect(desc).toBeTruthy();
      await bot.toggleDetailsAsync();
    });

    it("Then the bot behavior names are displayed", async () => {
      await bot.toggleDetailsAsync();
      const names = await bot.getBehaviorNamesAsync();
      expect(names.length).toBeGreaterThan(0);
      await bot.toggleDetailsAsync();
    });
  });

  describe("Given the bot details card (Story: Bot Details)", () => {
    it("When I click the expand toggle, Then the details card expands", async () => {
      await bot.toggleDetailsAsync();
      const isExpanded = await bot.isDetailsExpandedAsync();
      expect(isExpanded).toBe(true);
      // Collapse
      await bot.toggleDetailsAsync();
    });

    it("When I click the expand toggle again, Then the details card collapses", async () => {
      // Expand first
      await bot.toggleDetailsAsync();
      // Collapse
      await bot.toggleDetailsAsync();
      const isExpanded = await bot.isDetailsExpandedAsync();
      expect(isExpanded).toBe(false);
    });

    it("Then expanded card shows goal", async () => {
      await bot.toggleDetailsAsync();
      const goal = await bot.getGoalAsync();
      expect(goal).toBeTruthy();
      // Collapse
      await bot.toggleDetailsAsync();
    });
  });
});
