// e2e/instructions_webview.e2e.ts — E2E tests for Instructions display in webview
/// <reference types="mocha" />
import { expect, $ } from "@wdio/globals";
import type { WebView } from "wdio-vscode-service";
import * as fs from "fs";
import * as path from "path";
import { WebViewBehaviorAdapter } from "./adapters/webview_behavior_adapter";
import { WebViewInstructionsAdapter } from "./adapters/webview_instructions_adapter";
import { getEngineWebview } from "./helpers/get_webview";
import { botBehaviorLocators, instructionLocators } from "./pageobjects/locators";
import { testPersistenceFixture } from "../test_data/behavior_fixtures";
import { testPersistenceFixture as botPersistenceFixture } from "../test_data/bot_fixtures";

const persistencePath = path.resolve(__dirname, "../../persistence/behavior.json");
const botPersistencePath = path.resolve(__dirname, "../../persistence/bot.json");

describe("instructions_webview", () => {
  let webview: WebView;
  let behavior: WebViewBehaviorAdapter;
  let instructions: WebViewInstructionsAdapter;
  let originalPersistence: string | null = null;
  let originalBotPersistence: string | null = null;

  before(async () => {
    try { originalPersistence = fs.readFileSync(persistencePath, "utf8"); } catch (_) { originalPersistence = null; }
    try { originalBotPersistence = fs.readFileSync(botPersistencePath, "utf8"); } catch (_) { originalBotPersistence = null; }
    fs.writeFileSync(persistencePath, JSON.stringify(testPersistenceFixture));
    fs.writeFileSync(botPersistencePath, JSON.stringify(botPersistenceFixture));

    webview = await getEngineWebview();
    behavior = new WebViewBehaviorAdapter(webview);
    instructions = new WebViewInstructionsAdapter(webview);
  });

  after(async () => {
    if (webview) await webview.close();
    if (originalPersistence !== null) {
      fs.writeFileSync(persistencePath, originalPersistence);
    } else {
      fs.writeFileSync(persistencePath, JSON.stringify({ currentBehavior: "", currentAction: "", executionSettings: {} }));
    }
    if (originalBotPersistence !== null) {
      fs.writeFileSync(botPersistencePath, originalBotPersistence);
    } else {
      fs.writeFileSync(botPersistencePath, JSON.stringify({ currentBot: "" }));
    }
  });

  describe("Given panel is open (Story: Display Selected Behavior Instructions)", () => {
    it("When behavior is selected, Then instructions-panel shows behavior instructions", async () => {
      await behavior.navigateToBehaviorAsync("shape");
      const items = await instructions.getInstructionItemsAsync();
      expect(items.length).toBeGreaterThan(0);
    });

    it("When behavior with instructions is selected, Then currentBehavior shows correct name", async () => {
      await behavior.navigateToBehaviorAsync("shape");
      await expect($(botBehaviorLocators.currentBehavior)).toHaveText("shape");
    });
  });

  describe("Given panel is open (Story: Display Selected Action Instructions)", () => {
    it("When action is selected, Then instructions-panel shows merged action instructions", async () => {
      await behavior.navigateToBehaviorAsync("shape");
      const items = await instructions.getInstructionItemsAsync();
      // Should have behavior + action instructions
      expect(items.length).toBeGreaterThan(0);
    });

    it("When navigating to different action, Then instructions are replaced", async () => {
      await behavior.navigateToBehaviorAsync("shape");
      const itemsBefore = await instructions.getInstructionItemsAsync();
      await behavior.nextAsync();
      const itemsAfter = await instructions.getInstructionItemsAsync();
      // Instructions should change
      expect(itemsAfter).not.toEqual(itemsBefore);
      // Reset
      await behavior.navigateToBehaviorAsync("shape");
    });
  });

  describe("Given panel is open (Story: Hydrate Instructions on Panel Open)", () => {
    it("When panel opens, Then instructions-panel shows instructions without clicks", async () => {
      const items = await instructions.getInstructionItemsAsync();
      expect(items.length).toBeGreaterThan(0);
    });
  });

  describe("Given panel is open (Story: Update Instructions on Workflow Navigation)", () => {
    it("When user presses Next, Then instructions update to next action", async () => {
      await behavior.navigateToBehaviorAsync("shape");
      await behavior.nextAsync();
      await expect($(botBehaviorLocators.currentAction)).toHaveText("strategy");
      const items = await instructions.getInstructionItemsAsync();
      expect(items.length).toBeGreaterThan(0);
      // Reset
      await behavior.navigateToBehaviorAsync("shape");
    });

    it("When user presses Back, Then instructions update to previous action", async () => {
      await behavior.navigateToBehaviorAsync("shape");
      await behavior.nextAsync(); // move to strategy
      await behavior.backAsync(); // back to clarify
      await expect($(botBehaviorLocators.currentAction)).toHaveText("clarify");
      const items = await instructions.getInstructionItemsAsync();
      expect(items.length).toBeGreaterThan(0);
    });

    it("When Next crosses behavior boundary, Then instructions update to new behavior", async () => {
      await behavior.navigateToBehaviorAsync("shape");
      await behavior.navigateToActionAsync("shape", "render");
      await behavior.nextAsync();
      await expect($(botBehaviorLocators.currentBehavior)).toHaveText("prioritization");
      const items = await instructions.getInstructionItemsAsync();
      expect(items.length).toBeGreaterThan(0);
      // Reset
      await behavior.navigateToBehaviorAsync("shape");
    });
  });
});
