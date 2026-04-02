// test/bot_behavior/bot_behavior_test.ts
import { describe, it, expect } from "vitest";
import type { IBotBehavior, NavigationResult } from "../../src/bot_behavior/bot_behavior.js";
import { testBehaviorConfigs, testAllowedBehaviors, testBaseActionConfigs } from "../test_data/bot_behavior_fixtures.js";
export { testBehaviorConfigs, testAllowedBehaviors, testBaseActionConfigs } from "../test_data/bot_behavior_fixtures.js";

/**
 * Base test class using Template Method pattern.
 *
 * Defines shared test scenarios in registerTests(); subclasses override:
 * - createBotBehavior() — returns the bot behavior under test (domain, server, CLI wrapper, etc.)
 * - assertCurrentBehavior() — adds layer-specific assertions (persistence, DOM, postMessage)
 * - assertCurrentAction() — adds layer-specific assertions
 * - assertNavigation() — adds layer-specific assertions for navigation results
 *
 * Arrow functions in it() preserve `this` binding when Vitest invokes callbacks.
 */
export abstract class BotBehaviorTest {
  /** Default assertion: verify currentBehavior name equals expected. Subclasses extend. */
  protected assertCurrentBehavior(botBehavior: IBotBehavior, expected: string): void {
    expect(botBehavior.currentBehavior?.name).toBe(expected);
  }

  /** Default assertion: verify currentAction name equals expected. Subclasses extend. */
  protected assertCurrentAction(botBehavior: IBotBehavior, expected: string): void {
    expect(botBehavior.currentAction?.name).toBe(expected);
  }

  /** Default assertion for navigation results. Subclasses extend (e.g. check persistence, postMessage). */
  protected assertNavigation(botBehavior: IBotBehavior, result: NavigationResult, expectedBehavior: string, expectedAction: string): void {
    expect(result.status).toBe("success");
    this.assertCurrentBehavior(botBehavior, expectedBehavior);
    this.assertCurrentAction(botBehavior, expectedAction);
  }

  /** Abstract: subclasses return the bot behavior under test for this layer. */
  protected abstract createBotBehavior(): IBotBehavior;

  /** Helper: create a BotBehavior loaded with test fixtures, actions loaded. */
  protected loadedBotBehavior(): IBotBehavior {
    const bb = this.createBotBehavior();
    bb.loadBehaviors(testAllowedBehaviors, testBehaviorConfigs);
    bb.loadActions(testBaseActionConfigs);
    return bb;
  }

  /**
   * Register all shared test scenarios with Vitest.
   * Call inside a describe() block: `new MyBotBehaviorTest().registerTests()`
   */
  registerTests(): void {
    describe("Given bot behaviors are described in a config file (Story: Load Bot Behaviors)", () => {
      it("Then bot behaviors can be loaded from BotConfig", () => {
        const bb = this.createBotBehavior();
        bb.loadBehaviors(testAllowedBehaviors, testBehaviorConfigs);
        expect(bb.behaviors).toHaveLength(3);
        expect(bb.behaviors.map((b) => b.name)).toEqual(["shape", "prioritization", "exploration"]);
      });

      it("When behaviors are initially loaded, Then first behavior is set as current", () => {
        const bb = this.createBotBehavior();
        bb.loadBehaviors(testAllowedBehaviors, testBehaviorConfigs);
        this.assertCurrentBehavior(bb, "shape");
      });

      it("Then loaded behavior provides access to all config properties", () => {
        const bb = this.createBotBehavior();
        bb.loadBehaviors(testAllowedBehaviors, testBehaviorConfigs);
        const current = bb.currentBehavior!;
        expect(current.name).toBe("shape");
        expect(current.order).toBe(1);
        expect(current.description).toBeTruthy();
        expect(current.goal).toBeTruthy();
        expect(current.inputs).toBeTruthy();
        expect(current.outputs).toBeTruthy();
        expect(current.instructions).toBeInstanceOf(Array);
        expect(current.actionsWorkflow).toBeInstanceOf(Array);
        expect(current.actionsWorkflow.length).toBe(5);
      });
    });

    describe("Given actions are described in a config file (Story: Load Actions)", () => {
      it("Then actions can be loaded from config file", () => {
        const bb = this.createBotBehavior();
        bb.loadBehaviors(testAllowedBehaviors, testBehaviorConfigs);
        bb.loadActions(testBaseActionConfigs);
        expect(bb.actions).toHaveLength(5);
        expect(bb.actions.map((a) => a.name)).toEqual(["clarify", "strategy", "build", "validate", "render"]);
      });

      it("Then first action is set as current", () => {
        const bb = this.createBotBehavior();
        bb.loadBehaviors(testAllowedBehaviors, testBehaviorConfigs);
        bb.loadActions(testBaseActionConfigs);
        this.assertCurrentAction(bb, "clarify");
      });

      it("When an action has instructions in both BaseActionConfig and Behavior config, Then the base instructions come first with behavior-specific instructions following", () => {
        const bb = this.createBotBehavior();
        bb.loadBehaviors(testAllowedBehaviors, testBehaviorConfigs);
        bb.loadActions(testBaseActionConfigs);
        const clarify = bb.actions.find((a) => a.name === "clarify")!;
        // Base instructions come first
        expect(clarify.instructions[0]).toBe("IMPORTANT: Follow these action instructions specifically");
        expect(clarify.instructions[1]).toBe("Review all provided context");
        // Behavior-specific instructions follow
        expect(clarify.instructions[2]).toBe("Gather context for story mapping");
        expect(clarify.instructions).toHaveLength(3);
      });
    });

    describe("Given bot has behaviors and actions loaded (Story: Navigate Sequentially)", () => {
      it("When navigateToBehavior is called, Then current behavior is set and first action is loaded", () => {
        const bb = this.loadedBotBehavior();
        bb.navigateToBehavior("exploration");
        this.assertCurrentBehavior(bb, "exploration");
        this.assertCurrentAction(bb, "clarify");
      });

      it("When navigateToAction is called, Then current action is set within behavior", () => {
        const bb = this.loadedBotBehavior();
        bb.navigateToAction("build");
        this.assertCurrentAction(bb, "build");
        this.assertCurrentBehavior(bb, "shape");
      });

      it("When next() is called, Then it moves to next action in workflow", () => {
        const bb = this.loadedBotBehavior();
        // At clarify (first action)
        const result = bb.next();
        this.assertNavigation(bb, result, "shape", "strategy");
      });

      it("When next() is called repeatedly, Then it progresses through entire workflow sequence", () => {
        const bb = this.loadedBotBehavior();
        const expected = ["clarify", "strategy", "build", "validate", "render"];
        this.assertCurrentAction(bb, expected[0]);

        for (let i = 1; i < expected.length; i++) {
          const result = bb.next();
          expect(result.status).toBe("success");
          expect(result.action).toBe(expected[i]);
          this.assertCurrentAction(bb, expected[i]);
        }
      });

      it("When next() is called at final action, Then it advances to next behavior first action", () => {
        const bb = this.loadedBotBehavior();
        // Navigate to last action of shape
        bb.navigateToAction("render");
        const result = bb.next();
        expect(result.status).toBe("success");
        expect(result.behavior).toBe("prioritization");
        this.assertCurrentBehavior(bb, "prioritization");
        this.assertCurrentAction(bb, "clarify");
      });

      it("When next() is called at last behavior last action, Then it returns complete status", () => {
        const bb = this.loadedBotBehavior();
        bb.navigateToBehavior("exploration");
        bb.navigateToAction("render");
        const result = bb.next();
        expect(result.status).toBe("complete");
        expect(result.message).toContain("complete");
      });

      it("When back() is called, Then it moves to previous action", () => {
        const bb = this.loadedBotBehavior();
        bb.navigateToAction("strategy");
        const result = bb.back();
        this.assertNavigation(bb, result, "shape", "clarify");
      });

      it("When back() is called at first action of behavior, Then it goes to previous behavior last action", () => {
        const bb = this.loadedBotBehavior();
        bb.navigateToBehavior("prioritization");
        // At clarify (first action of prioritization)
        const result = bb.back();
        expect(result.status).toBe("success");
        this.assertCurrentBehavior(bb, "shape");
        this.assertCurrentAction(bb, "render");
      });

      it("When back() is called at first behavior first action, Then it returns error", () => {
        const bb = this.loadedBotBehavior();
        // At shape.clarify (first of everything)
        const result = bb.back();
        expect(result.status).toBe("error");
        expect(result.message).toContain("Already at first action");
      });

      it("When pos() is called, Then it returns position string", () => {
        const bb = this.loadedBotBehavior();
        bb.navigateToAction("build");
        const result = bb.pos();
        expect(result.status).toBe("success");
        expect(result.behavior).toBe("shape");
        expect(result.action).toBe("build");
        expect(result.position).toBe("shape.build");
      });

      it("When tree() is called, Then it returns formatted tree with current marker", () => {
        const bb = this.loadedBotBehavior();
        const treeStr = bb.tree();
        expect(treeStr).toContain("shape");
        expect(treeStr).toContain("prioritization");
        expect(treeStr).toContain("exploration");
        expect(treeStr).toContain("➤");
        expect(treeStr).toContain("clarify");
      });
    });

    describe("Given bot has behaviors loaded (Story: Manage Behaviors)", () => {
      it("When findBehavior is called with a valid name, Then it returns the behavior", () => {
        const bb = this.loadedBotBehavior();
        const found = bb.findBehavior("prioritization");
        expect(found).not.toBeNull();
        expect(found!.name).toBe("prioritization");
        expect(found!.order).toBe(2);
      });

      it("When findBehavior is called with a nonexistent name, Then it returns null", () => {
        const bb = this.loadedBotBehavior();
        expect(bb.findBehavior("nonexistent")).toBeNull();
      });

      it("When checkBehaviorExists is called, Then it returns true for known and false for unknown behaviors", () => {
        const bb = this.loadedBotBehavior();
        expect(bb.checkBehaviorExists("shape")).toBe(true);
        expect(bb.checkBehaviorExists("nonexistent")).toBe(false);
      });

      it("When nextBehavior is called, Then it peeks at next behavior without navigating", () => {
        const bb = this.loadedBotBehavior();
        const next = bb.nextBehavior();
        expect(next).not.toBeNull();
        expect(next!.name).toBe("prioritization");
        // Current should still be shape
        this.assertCurrentBehavior(bb, "shape");
      });

      it("When nextBehavior is called at last behavior, Then it returns null", () => {
        const bb = this.loadedBotBehavior();
        bb.navigateToBehavior("exploration");
        expect(bb.nextBehavior()).toBeNull();
      });

      it("When previousBehavior is called at first behavior, Then it returns null", () => {
        const bb = this.loadedBotBehavior();
        expect(bb.previousBehavior()).toBeNull();
      });

      it("When previousBehavior is called, Then it returns the previous behavior", () => {
        const bb = this.loadedBotBehavior();
        bb.navigateToBehavior("prioritization");
        const prev = bb.previousBehavior();
        expect(prev).not.toBeNull();
        expect(prev!.name).toBe("shape");
      });

      it("When nextAction is called, Then it peeks at next action without navigating", () => {
        const bb = this.loadedBotBehavior();
        const next = bb.nextAction();
        expect(next).not.toBeNull();
        expect(next!.name).toBe("strategy");
        // Current should still be clarify
        this.assertCurrentAction(bb, "clarify");
      });

      it("When nextAction is called at last action, Then it returns null", () => {
        const bb = this.loadedBotBehavior();
        bb.navigateToAction("render");
        expect(bb.nextAction()).toBeNull();
      });

      it("When findAction is called with a valid name, Then it returns the action", () => {
        const bb = this.loadedBotBehavior();
        const found = bb.findAction("strategy");
        expect(found).not.toBeNull();
        expect(found!.name).toBe("strategy");
        expect(found!.order).toBe(2);
      });

      it("When findAction is called with a nonexistent name, Then it returns null", () => {
        const bb = this.loadedBotBehavior();
        expect(bb.findAction("nonexistent")).toBeNull();
      });

      it("Then behaviorNames returns ordered list", () => {
        const bb = this.loadedBotBehavior();
        expect(bb.behaviorNames).toEqual(["shape", "prioritization", "exploration"]);
      });

      it("Then actionNames returns list for current behavior", () => {
        const bb = this.loadedBotBehavior();
        expect(bb.actionNames).toEqual(["clarify", "strategy", "build", "validate", "render"]);
      });

      it("When at last action, Then isFinalAction returns true", () => {
        const bb = this.loadedBotBehavior();
        expect(bb.isFinalAction()).toBe(false);
        bb.navigateToAction("render");
        expect(bb.isFinalAction()).toBe(true);
      });

      it("When closeCurrent is called, Then it advances to next action", () => {
        const bb = this.loadedBotBehavior();
        const result = bb.closeCurrent();
        expect(result.status).toBe("success");
        this.assertCurrentAction(bb, "strategy");
      });

      it("When closeCurrent is called at last action, Then it advances to next behavior", () => {
        const bb = this.loadedBotBehavior();
        bb.navigateToAction("render");
        const result = bb.closeCurrent();
        expect(result.status).toBe("success");
        this.assertCurrentBehavior(bb, "prioritization");
        this.assertCurrentAction(bb, "clarify");
      });
    });
  }
}
