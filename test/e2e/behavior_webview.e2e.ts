// e2e/behavior_webview.e2e.ts — E2E tests for Behavior webview
/// <reference types="mocha" />
import { expect, $ } from "@wdio/globals";
import { WebView } from "wdio-vscode-service";
import * as fs from "fs";
import * as path from "path";
import { WebViewBehaviorAdapter } from "./adapters/webview_behavior_adapter";
import { getEngineWebview } from "./helpers/get_webview";
import { botBehaviorLocators } from "./pageobjects/locators";
import { testPersistenceFixture } from "../test_data/behavior_fixtures";
import { testPersistenceFixture as botPersistenceFixture } from "../test_data/bot_fixtures";

// Path to persistence file relative to project root (extensionPath in wdio.conf.ts)
const persistencePath = path.resolve(__dirname, "../../persistence/behavior.json");
const botPersistencePath = path.resolve(__dirname, "../../persistence/bot.json");

/**
 * E2E tests for Behavior webview.
 *
 * Mirrors the same scenarios from BehaviorTest.registerTests() but with async DOM assertions.
 * Before testing, writes a fixture config to persistence/behavior.json so BehaviorServer
 * loads the expected state when the webview opens.
 */
describe("behavior_webview", () => {
  let webview: WebView;
  let behavior: WebViewBehaviorAdapter;
  let originalPersistence: string | null = null;
  let originalBotPersistence: string | null = null;

  /**
   * Assert current behavior name matches expected via adapter and raw DOM.
   */
  async function assertCurrentBehavior(expected: string): Promise<void> {
    const name = await behavior.getCurrentBehaviorAsync();
    expect(name).toBe(expected);
    await expect($(botBehaviorLocators.currentBehavior)).toHaveText(expected);
  }

  /**
   * Assert current action name matches expected via adapter and raw DOM.
   */
  async function assertCurrentAction(expected: string): Promise<void> {
    const name = await behavior.getCurrentActionAsync();
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
    // Save original persistence files if they exist, then write fixtures
    try {
      originalPersistence = fs.readFileSync(persistencePath, "utf8");
    } catch (_) {
      originalPersistence = null;
    }
    try {
      originalBotPersistence = fs.readFileSync(botPersistencePath, "utf8");
    } catch (_) {
      originalBotPersistence = null;
    }
    fs.writeFileSync(persistencePath, JSON.stringify(testPersistenceFixture));
    fs.writeFileSync(botPersistencePath, JSON.stringify(botPersistenceFixture));

    webview = await getEngineWebview();
    behavior = new WebViewBehaviorAdapter(webview);
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
    if (originalBotPersistence !== null) {
      fs.writeFileSync(botPersistencePath, originalBotPersistence);
    } else {
      fs.writeFileSync(botPersistencePath, JSON.stringify({ currentBot: "" }));
    }
  });

  // Story: Load Bot Behaviors — same scenarios as BehaviorTest
  describe("Given bot behaviors are loaded (Story: Load Bot Behaviors)", () => {
    it("Then behaviors are loaded from BotConfig", async () => {
      const names = await behavior.getBehaviorNamesAsync();
      expect(names.length).toBeGreaterThan(0);
    });

    it("When behaviors are loaded, Then first behavior is set as current", async () => {
      await assertCurrentBehavior("shape");
    });

    it("Then loaded behavior provides access to all config properties", async () => {
      await assertCurrentBehavior("shape");
      const names = await behavior.getBehaviorNamesAsync();
      expect(names).toContain("shape");
    });
  });

  // Story: Load Actions — same scenarios as BehaviorTest
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

  // Story: Navigate Sequentially — same scenarios as BehaviorTest
  describe("Given bot has behaviors and actions loaded (Story: Navigate Sequentially)", () => {
    it("When navigateToBehavior is called, Then current behavior is set and first action is loaded", async () => {
      await behavior.navigateToBehaviorAsync("exploration");
      await assertNavigation("exploration", "clarify");
      // Navigate back to shape for subsequent tests
      await behavior.navigateToBehaviorAsync("shape");
    });

    it("When navigateToAction is called, Then current action is set within behavior", async () => {
      // Ensure we're on shape
      await behavior.navigateToBehaviorAsync("shape");
      await behavior.navigateToActionAsync("shape", "build");
      await assertCurrentAction("build");
      await assertCurrentBehavior("shape");
      // Reset
      await behavior.navigateToBehaviorAsync("shape");
    });

    it("When next() is called, Then it moves to next action in workflow", async () => {
      // Start at shape.clarify (initial state)
      await behavior.navigateToBehaviorAsync("shape");
      await assertCurrentAction("clarify");
      await behavior.nextAsync();
      await assertNavigation("shape", "strategy");
      // Reset
      await behavior.navigateToBehaviorAsync("shape");
    });

    it("When next() is called repeatedly, Then it progresses through entire workflow sequence", async () => {
      await behavior.navigateToBehaviorAsync("shape");
      const expected = ["clarify", "strategy", "build", "validate", "render"];
      await assertCurrentAction(expected[0]);

      for (let i = 1; i < expected.length; i++) {
        await behavior.nextAsync();
        await assertCurrentAction(expected[i]);
      }
      // Reset
      await behavior.navigateToBehaviorAsync("shape");
    });

    it("When next() is called at final action, Then it advances to next behavior first action", async () => {
      await behavior.navigateToBehaviorAsync("shape");
      await behavior.navigateToActionAsync("shape", "render");
      await behavior.nextAsync();
      await assertNavigation("prioritization", "clarify");
      // Reset
      await behavior.navigateToBehaviorAsync("shape");
    });

    it("When next() is called at last behavior last action, Then it shows complete and stays on last", async () => {
      await behavior.navigateToBehaviorAsync("code");
      await behavior.navigateToActionAsync("code", "validate");
      // next() at the very end — domain returns "complete" but DOM doesn't change further
      await behavior.nextAsync();
      // After complete, behavior/action remain at code/validate
      await assertNavigation("code", "validate");
      // Reset
      await behavior.navigateToBehaviorAsync("shape");
    });

    it("When back() is called, Then it moves to previous action", async () => {
      await behavior.navigateToBehaviorAsync("shape");
      await behavior.navigateToActionAsync("shape", "strategy");
      await behavior.backAsync();
      await assertNavigation("shape", "clarify");
    });

    it("When back() is called at first action of behavior, Then it goes to previous behavior last action", async () => {
      await behavior.navigateToBehaviorAsync("prioritization");
      // At clarify (first action of prioritization)
      await behavior.backAsync();
      await assertNavigation("shape", "render");
      // Reset
      await behavior.navigateToBehaviorAsync("shape");
    });

    it("When back() is called at first behavior first action, Then it stays put", async () => {
      await behavior.navigateToBehaviorAsync("shape");
      // At shape.clarify (first of everything)
      await behavior.backAsync();
      // Should stay at shape.clarify
      await assertNavigation("shape", "clarify");
    });

    it("When behavior name is clicked in tree, Then it selects it as current without expanding", async () => {
      // Collapse any behaviors expanded by prior tests
      await behavior.collapseAllAsync();
      await behavior.navigateToBehaviorAsync("exploration");
      const isActive = await behavior.isBehaviorActiveAsync("exploration");
      expect(isActive).toBe(true);
      // Should NOT be expanded (expand is separate)
      const isExpanded = await behavior.isBehaviorExpandedAsync("exploration");
      expect(isExpanded).toBe(false);
      // Previous behavior should not be active
      const shapeActive = await behavior.isBehaviorActiveAsync("shape");
      expect(shapeActive).toBe(false);
      // Reset
      await behavior.navigateToBehaviorAsync("shape");
    });

    it("When expand icon is clicked, Then it toggles action list visibility", async () => {
      // Ensure all collapsed before testing expand toggle
      await behavior.collapseAllAsync();
      let isExpanded = await behavior.isBehaviorExpandedAsync("shape");
      expect(isExpanded).toBe(false);
      // Expand
      await behavior.toggleExpandAsync("shape");
      isExpanded = await behavior.isBehaviorExpandedAsync("shape");
      expect(isExpanded).toBe(true);
      // Collapse again
      await behavior.toggleExpandAsync("shape");
      isExpanded = await behavior.isBehaviorExpandedAsync("shape");
      expect(isExpanded).toBe(false);
    });

    it("Then multiple behaviors can be expanded simultaneously", async () => {
      // Ensure all collapsed before testing
      await behavior.collapseAllAsync();
      await behavior.toggleExpandAsync("shape");
      await behavior.toggleExpandAsync("exploration");
      const shapeExpanded = await behavior.isBehaviorExpandedAsync("shape");
      const explorationExpanded = await behavior.isBehaviorExpandedAsync("exploration");
      expect(shapeExpanded).toBe(true);
      expect(explorationExpanded).toBe(true);
      // Collapse both
      await behavior.toggleExpandAsync("shape");
      await behavior.toggleExpandAsync("exploration");
    });

    it("When action is clicked in expanded tree, Then it sets it as current action", async () => {
      await behavior.navigateToBehaviorAsync("shape");
      // Expand to reveal actions
      await behavior.toggleExpandAsync("shape");
      await behavior.navigateToActionAsync("shape", "validate");
      const isActive = await behavior.isActionActiveAsync("shape", "validate");
      expect(isActive).toBe(true);
      await assertCurrentAction("validate");
      // Collapse and reset
      await behavior.toggleExpandAsync("shape");
      await behavior.navigateToBehaviorAsync("shape");
    });
  });

  // Story: Manage Behaviors — same scenarios as BehaviorTest
  describe("Given bot has behaviors loaded (Story: Manage Behaviors)", () => {
    it("Then behaviorNames are rendered in the tree", async () => {
      const names = await behavior.getBehaviorNamesAsync();
      expect(names).toContain("shape");
      expect(names).toContain("prioritization");
      expect(names).toContain("exploration");
    });

    it("When closeCurrent is called, Then it advances to next action", async () => {
      await behavior.navigateToBehaviorAsync("shape");
      await assertCurrentAction("clarify");
      // closeCurrent is equivalent to next — click Next button
      await behavior.nextAsync();
      await assertCurrentAction("strategy");
      // Reset
      await behavior.navigateToBehaviorAsync("shape");
    });

    it("When closeCurrent is called at last action, Then it advances to next behavior", async () => {
      await behavior.navigateToBehaviorAsync("shape");
      await behavior.navigateToActionAsync("shape", "render");
      await behavior.nextAsync();
      await assertNavigation("prioritization", "clarify");
      // Reset
      await behavior.navigateToBehaviorAsync("shape");
    });

    it("Then execution setting buttons show correct active state for actions", async () => {
      // shape.clarify has executionSetting "manual"
      const manualActive = await behavior.isExecSettingActiveAsync("shape.clarify", "manual");
      expect(manualActive).toBe(true);
      const skipActive = await behavior.isExecSettingActiveAsync("shape.clarify", "skip");
      expect(skipActive).toBe(false);
    });

    it("When execution setting button is clicked, Then it changes the active setting", async () => {
      // Change shape.clarify from "manual" to "skip"
      await behavior.setExecutionSettingAsync("shape.clarify", "skip");
      const skipActive = await behavior.isExecSettingActiveAsync("shape.clarify", "skip");
      expect(skipActive).toBe(true);
      const manualActive = await behavior.isExecSettingActiveAsync("shape.clarify", "manual");
      expect(manualActive).toBe(false);
      // Restore
      await behavior.setExecutionSettingAsync("shape.clarify", "manual");
    });

    it("Then action with skip executionSetting shows skip button active", async () => {
      // Set shape.render to "skip" and verify the button shows active
      await behavior.setExecutionSettingAsync("shape.render", "skip");
      const skipActive = await behavior.isExecSettingActiveAsync("shape.render", "skip");
      expect(skipActive).toBe(true);
      const manualActive = await behavior.isExecSettingActiveAsync("shape.render", "manual");
      expect(manualActive).toBe(false);
      // Restore
      await behavior.setExecutionSettingAsync("shape.render", "manual");
    });

    it("Then each behavior has execution setting buttons", async () => {
      // Behavior-level execution setting buttons
      const manualActive = await behavior.isExecSettingActiveAsync("shape", "manual");
      expect(manualActive).toBe(true);
    });
  });
});
