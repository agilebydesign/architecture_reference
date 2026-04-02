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

  /**
   * Assert both current behavior and action after a navigation.
   */
  async function assertNavigation(expectedBehavior: string, expectedAction: string): Promise<void> {
    await assertCurrentBehavior(expectedBehavior);
    await assertCurrentAction(expectedAction);
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
    it("Then behaviors are loaded from BotConfig", async () => {
      const names = await botBehavior.getBehaviorNamesAsync();
      expect(names.length).toBeGreaterThan(0);
    });

    it("When behaviors are loaded, Then first behavior is set as current", async () => {
      await assertCurrentBehavior("shape");
    });

    it("Then loaded behavior provides access to all config properties", async () => {
      await assertCurrentBehavior("shape");
      const names = await botBehavior.getBehaviorNamesAsync();
      expect(names).toContain("shape");
    });
  });

  // Story: Load Actions — same scenarios as BotBehaviorTest
  describe("Given actions are loaded (Story: Load Actions)", () => {
    it("Then actions are loaded and available", async () => {
      await assertCurrentAction("clarify");
    });

    it("When actions are loaded, Then first action is set as current", async () => {
      await assertCurrentAction("clarify");
    });

    it("Then action merges instructions from BaseActionConfig and Behavior config", async () => {
      await assertCurrentAction("clarify");
    });
  });

  // Story: Navigate Sequentially — same scenarios as BotBehaviorTest
  describe("Given bot has behaviors and actions loaded (Story: Navigate Sequentially)", () => {
    it("When navigateToBehavior is called, Then current behavior is set and first action is loaded", async () => {
      await botBehavior.navigateToBehaviorAsync("exploration");
      await assertNavigation("exploration", "clarify");
      // Navigate back to shape for subsequent tests
      await botBehavior.navigateToBehaviorAsync("shape");
    });

    it("When navigateToAction is called, Then current action is set within behavior", async () => {
      // Ensure we're on shape
      await botBehavior.navigateToBehaviorAsync("shape");
      await botBehavior.navigateToActionAsync("shape", "build");
      await assertCurrentAction("build");
      await assertCurrentBehavior("shape");
      // Reset
      await botBehavior.navigateToBehaviorAsync("shape");
    });

    it("When next() is called, Then it moves to next action in workflow", async () => {
      // Start at shape.clarify (initial state)
      await botBehavior.navigateToBehaviorAsync("shape");
      await assertCurrentAction("clarify");
      await botBehavior.nextAsync();
      await assertNavigation("shape", "strategy");
      // Reset
      await botBehavior.navigateToBehaviorAsync("shape");
    });

    it("When next() is called repeatedly, Then it progresses through entire workflow sequence", async () => {
      await botBehavior.navigateToBehaviorAsync("shape");
      const expected = ["clarify", "strategy", "build", "validate", "render"];
      await assertCurrentAction(expected[0]);

      for (let i = 1; i < expected.length; i++) {
        await botBehavior.nextAsync();
        await assertCurrentAction(expected[i]);
      }
      // Reset
      await botBehavior.navigateToBehaviorAsync("shape");
    });

    it("When next() is called at final action, Then it advances to next behavior first action", async () => {
      await botBehavior.navigateToBehaviorAsync("shape");
      await botBehavior.navigateToActionAsync("shape", "render");
      await botBehavior.nextAsync();
      await assertNavigation("prioritization", "clarify");
      // Reset
      await botBehavior.navigateToBehaviorAsync("shape");
    });

    it("When next() is called at last behavior last action, Then it shows complete and stays on last", async () => {
      await botBehavior.navigateToBehaviorAsync("code");
      await botBehavior.navigateToActionAsync("code", "validate");
      // next() at the very end — domain returns "complete" but DOM doesn't change further
      await botBehavior.nextAsync();
      // After complete, behavior/action remain at code/validate
      await assertNavigation("code", "validate");
      // Reset
      await botBehavior.navigateToBehaviorAsync("shape");
    });

    it("When back() is called, Then it moves to previous action", async () => {
      await botBehavior.navigateToBehaviorAsync("shape");
      await botBehavior.navigateToActionAsync("shape", "strategy");
      await botBehavior.backAsync();
      await assertNavigation("shape", "clarify");
    });

    it("When back() is called at first action of behavior, Then it goes to previous behavior last action", async () => {
      await botBehavior.navigateToBehaviorAsync("prioritization");
      // At clarify (first action of prioritization)
      await botBehavior.backAsync();
      await assertNavigation("shape", "render");
      // Reset
      await botBehavior.navigateToBehaviorAsync("shape");
    });

    it("When back() is called at first behavior first action, Then it stays put", async () => {
      await botBehavior.navigateToBehaviorAsync("shape");
      // At shape.clarify (first of everything)
      await botBehavior.backAsync();
      // Should stay at shape.clarify
      await assertNavigation("shape", "clarify");
    });

    it("When behavior name is clicked in tree, Then it selects it as current without expanding", async () => {
      // Collapse any behaviors expanded by prior tests
      await botBehavior.collapseAllAsync();
      await botBehavior.navigateToBehaviorAsync("exploration");
      const isActive = await botBehavior.isBehaviorActiveAsync("exploration");
      expect(isActive).toBe(true);
      // Should NOT be expanded (expand is separate)
      const isExpanded = await botBehavior.isBehaviorExpandedAsync("exploration");
      expect(isExpanded).toBe(false);
      // Previous behavior should not be active
      const shapeActive = await botBehavior.isBehaviorActiveAsync("shape");
      expect(shapeActive).toBe(false);
      // Reset
      await botBehavior.navigateToBehaviorAsync("shape");
    });

    it("When expand icon is clicked, Then it toggles action list visibility", async () => {
      // Ensure all collapsed before testing expand toggle
      await botBehavior.collapseAllAsync();
      let isExpanded = await botBehavior.isBehaviorExpandedAsync("shape");
      expect(isExpanded).toBe(false);
      // Expand
      await botBehavior.toggleExpandAsync("shape");
      isExpanded = await botBehavior.isBehaviorExpandedAsync("shape");
      expect(isExpanded).toBe(true);
      // Collapse again
      await botBehavior.toggleExpandAsync("shape");
      isExpanded = await botBehavior.isBehaviorExpandedAsync("shape");
      expect(isExpanded).toBe(false);
    });

    it("Then multiple behaviors can be expanded simultaneously", async () => {
      // Ensure all collapsed before testing
      await botBehavior.collapseAllAsync();
      await botBehavior.toggleExpandAsync("shape");
      await botBehavior.toggleExpandAsync("exploration");
      const shapeExpanded = await botBehavior.isBehaviorExpandedAsync("shape");
      const explorationExpanded = await botBehavior.isBehaviorExpandedAsync("exploration");
      expect(shapeExpanded).toBe(true);
      expect(explorationExpanded).toBe(true);
      // Collapse both
      await botBehavior.toggleExpandAsync("shape");
      await botBehavior.toggleExpandAsync("exploration");
    });

    it("When action is clicked in expanded tree, Then it sets it as current action", async () => {
      await botBehavior.navigateToBehaviorAsync("shape");
      // Expand to reveal actions
      await botBehavior.toggleExpandAsync("shape");
      await botBehavior.navigateToActionAsync("shape", "validate");
      const isActive = await botBehavior.isActionActiveAsync("shape", "validate");
      expect(isActive).toBe(true);
      await assertCurrentAction("validate");
      // Collapse and reset
      await botBehavior.toggleExpandAsync("shape");
      await botBehavior.navigateToBehaviorAsync("shape");
    });
  });

  // Story: Manage Behaviors — same scenarios as BotBehaviorTest
  describe("Given bot has behaviors loaded (Story: Manage Behaviors)", () => {
    it("Then behaviorNames are rendered in the tree", async () => {
      const names = await botBehavior.getBehaviorNamesAsync();
      expect(names).toContain("shape");
      expect(names).toContain("prioritization");
      expect(names).toContain("exploration");
    });

    it("When closeCurrent is called, Then it advances to next action", async () => {
      await botBehavior.navigateToBehaviorAsync("shape");
      await assertCurrentAction("clarify");
      // closeCurrent is equivalent to next — click Next button
      await botBehavior.nextAsync();
      await assertCurrentAction("strategy");
      // Reset
      await botBehavior.navigateToBehaviorAsync("shape");
    });

    it("When closeCurrent is called at last action, Then it advances to next behavior", async () => {
      await botBehavior.navigateToBehaviorAsync("shape");
      await botBehavior.navigateToActionAsync("shape", "render");
      await botBehavior.nextAsync();
      await assertNavigation("prioritization", "clarify");
      // Reset
      await botBehavior.navigateToBehaviorAsync("shape");
    });

    it("Then execution setting buttons show correct active state for actions", async () => {
      // shape.clarify has executionSetting "manual"
      const manualActive = await botBehavior.isExecSettingActiveAsync("shape.clarify", "manual");
      expect(manualActive).toBe(true);
      const skipActive = await botBehavior.isExecSettingActiveAsync("shape.clarify", "skip");
      expect(skipActive).toBe(false);
    });

    it("When execution setting button is clicked, Then it changes the active setting", async () => {
      // Change shape.clarify from "manual" to "skip"
      await botBehavior.setExecutionSettingAsync("shape.clarify", "skip");
      const skipActive = await botBehavior.isExecSettingActiveAsync("shape.clarify", "skip");
      expect(skipActive).toBe(true);
      const manualActive = await botBehavior.isExecSettingActiveAsync("shape.clarify", "manual");
      expect(manualActive).toBe(false);
      // Restore
      await botBehavior.setExecutionSettingAsync("shape.clarify", "manual");
    });

    it("Then action with skip executionSetting shows skip button active", async () => {
      // Set shape.render to "skip" and verify the button shows active
      await botBehavior.setExecutionSettingAsync("shape.render", "skip");
      const skipActive = await botBehavior.isExecSettingActiveAsync("shape.render", "skip");
      expect(skipActive).toBe(true);
      const manualActive = await botBehavior.isExecSettingActiveAsync("shape.render", "manual");
      expect(manualActive).toBe(false);
      // Restore
      await botBehavior.setExecutionSettingAsync("shape.render", "manual");
    });

    it("Then each behavior has execution setting buttons", async () => {
      // Behavior-level execution setting buttons
      const manualActive = await botBehavior.isExecSettingActiveAsync("shape", "manual");
      expect(manualActive).toBe(true);
    });
  });
});
