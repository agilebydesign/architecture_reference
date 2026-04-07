// test/behavior/behavior_test.ts
import { describe, it, expect } from "vitest";
import type { IBehavior, NavigationResult } from "../../src/behavior/behavior.js";
import { testBehaviorConfigs, testAllowedBehaviors, testBaseActionConfigs } from "../test_data/behavior_fixtures.js";
export { testBehaviorConfigs, testAllowedBehaviors, testBaseActionConfigs } from "../test_data/behavior_fixtures.js";

/**
 * Base test class using Template Method pattern.
 *
 * Defines shared test scenarios in registerTests(); subclasses override:
 * - createBehavior() — returns the behavior under test (domain, server, CLI wrapper, etc.)
 * - assertCurrentBehavior() — adds layer-specific assertions (persistence, DOM, postMessage)
 * - assertCurrentAction() — adds layer-specific assertions
 * - assertNavigation() — adds layer-specific assertions for navigation results
 *
 * Arrow functions in it() preserve `this` binding when Vitest invokes callbacks.
 */
export abstract class BehaviorTest {
  /** Default assertion: verify currentBehavior name equals expected. Subclasses extend. */
  protected assertCurrentBehavior(behavior: IBehavior, expected: string): void {
    expect(behavior.currentBehavior?.name).toBe(expected);
  }

  /** Default assertion: verify currentAction name equals expected. Subclasses extend. */
  protected assertCurrentAction(behavior: IBehavior, expected: string): void {
    expect(behavior.currentAction?.name).toBe(expected);
  }

  /** Default assertion for navigation results. Subclasses extend (e.g. check persistence, postMessage). */
  protected assertNavigation(behavior: IBehavior, result: NavigationResult, expectedBehavior: string, expectedAction: string): void {
    expect(result.status).toBe("success");
    this.assertCurrentBehavior(behavior, expectedBehavior);
    this.assertCurrentAction(behavior, expectedAction);
  }

  /** Abstract: subclasses return the behavior under test for this layer. */
  protected abstract createBehavior(): IBehavior;

  /** Helper: create a Behavior loaded with test fixtures, actions loaded. */
  protected loadedBehavior(): IBehavior {
    const b = this.createBehavior();
    b.loadBehaviors(testAllowedBehaviors, testBehaviorConfigs);
    b.loadActions(testBaseActionConfigs);
    return b;
  }

  /**
   * Register all shared test scenarios with Vitest.
   * Call inside a describe() block: `new MyBehaviorTest().registerTests()`
   */
  registerTests(): void {
    describe("Given bot behaviors are described in a config file (Story: Load Bot Behaviors)", () => {
      it("Then bot behaviors can be loaded from BotConfig", () => {
        const b = this.createBehavior();
        b.loadBehaviors(testAllowedBehaviors, testBehaviorConfigs);
        expect(b.behaviors).toHaveLength(3);
        expect(b.behaviors.map((bh) => bh.name)).toEqual(["shape", "prioritization", "exploration"]);
      });

      it("When behaviors are initially loaded, Then first behavior is set as current", () => {
        const b = this.createBehavior();
        b.loadBehaviors(testAllowedBehaviors, testBehaviorConfigs);
        this.assertCurrentBehavior(b, "shape");
      });

      it("Then loaded behavior provides access to all config properties", () => {
        const b = this.createBehavior();
        b.loadBehaviors(testAllowedBehaviors, testBehaviorConfigs);
        const current = b.currentBehavior!;
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
        const b = this.createBehavior();
        b.loadBehaviors(testAllowedBehaviors, testBehaviorConfigs);
        b.loadActions(testBaseActionConfigs);
        expect(b.actions).toHaveLength(5);
        expect(b.actions.map((a) => a.name)).toEqual(["clarify", "strategy", "build", "validate", "render"]);
      });

      it("Then first action is set as current", () => {
        const b = this.createBehavior();
        b.loadBehaviors(testAllowedBehaviors, testBehaviorConfigs);
        b.loadActions(testBaseActionConfigs);
        this.assertCurrentAction(b, "clarify");
      });

      it("When an action has instructions in both BaseActionConfig and Behavior config, Then the base instructions come first with behavior-specific instructions following", () => {
        const b = this.createBehavior();
        b.loadBehaviors(testAllowedBehaviors, testBehaviorConfigs);
        b.loadActions(testBaseActionConfigs);
        const clarify = b.actions.find((a) => a.name === "clarify")!;
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
        const b = this.loadedBehavior();
        b.navigateToBehavior("exploration");
        this.assertCurrentBehavior(b, "exploration");
        this.assertCurrentAction(b, "clarify");
      });

      it("When navigateToAction is called, Then current action is set within behavior", () => {
        const b = this.loadedBehavior();
        b.navigateToAction("build");
        this.assertCurrentAction(b, "build");
        this.assertCurrentBehavior(b, "shape");
      });

      it("When next() is called, Then it moves to next action in workflow", () => {
        const b = this.loadedBehavior();
        // At clarify (first action)
        const result = b.next();
        this.assertNavigation(b, result, "shape", "strategy");
      });

      it("When next() is called repeatedly, Then it progresses through entire workflow sequence", () => {
        const b = this.loadedBehavior();
        const expected = ["clarify", "strategy", "build", "validate", "render"];
        this.assertCurrentAction(b, expected[0]);

        for (let i = 1; i < expected.length; i++) {
          const result = b.next();
          expect(result.status).toBe("success");
          expect(result.action).toBe(expected[i]);
          this.assertCurrentAction(b, expected[i]);
        }
      });

      it("When next() is called at final action, Then it advances to next behavior first action", () => {
        const b = this.loadedBehavior();
        // Navigate to last action of shape
        b.navigateToAction("render");
        const result = b.next();
        expect(result.status).toBe("success");
        expect(result.behavior).toBe("prioritization");
        this.assertCurrentBehavior(b, "prioritization");
        this.assertCurrentAction(b, "clarify");
      });

      it("When next() is called at last behavior last action, Then it returns complete status", () => {
        const b = this.loadedBehavior();
        b.navigateToBehavior("exploration");
        b.navigateToAction("render");
        const result = b.next();
        expect(result.status).toBe("complete");
        expect(result.message).toContain("complete");
      });

      it("When back() is called, Then it moves to previous action", () => {
        const b = this.loadedBehavior();
        b.navigateToAction("strategy");
        const result = b.back();
        this.assertNavigation(b, result, "shape", "clarify");
      });

      it("When back() is called at first action of behavior, Then it goes to previous behavior last action", () => {
        const b = this.loadedBehavior();
        b.navigateToBehavior("prioritization");
        // At clarify (first action of prioritization)
        const result = b.back();
        expect(result.status).toBe("success");
        this.assertCurrentBehavior(b, "shape");
        this.assertCurrentAction(b, "render");
      });

      it("When back() is called at first behavior first action, Then it returns error", () => {
        const b = this.loadedBehavior();
        // At shape.clarify (first of everything)
        const result = b.back();
        expect(result.status).toBe("error");
        expect(result.message).toContain("Already at first action");
      });

      it("When pos() is called, Then it returns position string", () => {
        const b = this.loadedBehavior();
        b.navigateToAction("build");
        const result = b.pos();
        expect(result.status).toBe("success");
        expect(result.behavior).toBe("shape");
        expect(result.action).toBe("build");
        expect(result.position).toBe("shape.build");
      });

      it("When tree() is called, Then it returns formatted tree with current marker", () => {
        const b = this.loadedBehavior();
        const treeStr = b.tree();
        expect(treeStr).toContain("shape");
        expect(treeStr).toContain("prioritization");
        expect(treeStr).toContain("exploration");
        expect(treeStr).toContain("➤");
        expect(treeStr).toContain("clarify");
      });
    });

    describe("Given bot has behaviors loaded (Story: Manage Behaviors)", () => {
      it("When findBehavior is called with a valid name, Then it returns the behavior", () => {
        const b = this.loadedBehavior();
        const found = b.findBehavior("prioritization");
        expect(found).not.toBeNull();
        expect(found!.name).toBe("prioritization");
        expect(found!.order).toBe(2);
      });

      it("When findBehavior is called with a nonexistent name, Then it returns null", () => {
        const b = this.loadedBehavior();
        expect(b.findBehavior("nonexistent")).toBeNull();
      });

      it("When checkBehaviorExists is called, Then it returns true for known and false for unknown behaviors", () => {
        const b = this.loadedBehavior();
        expect(b.checkBehaviorExists("shape")).toBe(true);
        expect(b.checkBehaviorExists("nonexistent")).toBe(false);
      });

      it("When nextBehavior is called, Then it peeks at next behavior without navigating", () => {
        const b = this.loadedBehavior();
        const next = b.nextBehavior();
        expect(next).not.toBeNull();
        expect(next!.name).toBe("prioritization");
        // Current should still be shape
        this.assertCurrentBehavior(b, "shape");
      });

      it("When nextBehavior is called at last behavior, Then it returns null", () => {
        const b = this.loadedBehavior();
        b.navigateToBehavior("exploration");
        expect(b.nextBehavior()).toBeNull();
      });

      it("When previousBehavior is called at first behavior, Then it returns null", () => {
        const b = this.loadedBehavior();
        expect(b.previousBehavior()).toBeNull();
      });

      it("When previousBehavior is called, Then it returns the previous behavior", () => {
        const b = this.loadedBehavior();
        b.navigateToBehavior("prioritization");
        const prev = b.previousBehavior();
        expect(prev).not.toBeNull();
        expect(prev!.name).toBe("shape");
      });

      it("When nextAction is called, Then it peeks at next action without navigating", () => {
        const b = this.loadedBehavior();
        const next = b.nextAction();
        expect(next).not.toBeNull();
        expect(next!.name).toBe("strategy");
        // Current should still be clarify
        this.assertCurrentAction(b, "clarify");
      });

      it("When nextAction is called at last action, Then it returns null", () => {
        const b = this.loadedBehavior();
        b.navigateToAction("render");
        expect(b.nextAction()).toBeNull();
      });

      it("When findAction is called with a valid name, Then it returns the action", () => {
        const b = this.loadedBehavior();
        const found = b.findAction("strategy");
        expect(found).not.toBeNull();
        expect(found!.name).toBe("strategy");
        expect(found!.order).toBe(2);
      });

      it("When findAction is called with a nonexistent name, Then it returns null", () => {
        const b = this.loadedBehavior();
        expect(b.findAction("nonexistent")).toBeNull();
      });

      it("Then behaviorNames returns ordered list", () => {
        const b = this.loadedBehavior();
        expect(b.behaviorNames).toEqual(["shape", "prioritization", "exploration"]);
      });

      it("Then actionNames returns list for current behavior", () => {
        const b = this.loadedBehavior();
        expect(b.actionNames).toEqual(["clarify", "strategy", "build", "validate", "render"]);
      });

      it("When at last action, Then isFinalAction returns true", () => {
        const b = this.loadedBehavior();
        expect(b.isFinalAction()).toBe(false);
        b.navigateToAction("render");
        expect(b.isFinalAction()).toBe(true);
      });

      it("When closeCurrent is called, Then it advances to next action", () => {
        const b = this.loadedBehavior();
        const result = b.closeCurrent();
        expect(result.status).toBe("success");
        this.assertCurrentAction(b, "strategy");
      });

      it("When closeCurrent is called at last action, Then it advances to next behavior", () => {
        const b = this.loadedBehavior();
        b.navigateToAction("render");
        const result = b.closeCurrent();
        expect(result.status).toBe("success");
        this.assertCurrentBehavior(b, "prioritization");
        this.assertCurrentAction(b, "clarify");
      });
    });
  }
}
