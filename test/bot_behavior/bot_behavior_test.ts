// test/bot_behavior/bot_behavior_test.ts
import { describe, it, expect } from "vitest";
import type { IBotBehavior } from "../../src/bot_behavior/bot_behavior.js";
import { testBehaviorConfigs, testAllowedBehaviors, testBaseActionConfigs } from "../test_data/bot_behavior_fixtures.js";
export { testBehaviorConfigs, testAllowedBehaviors, testBaseActionConfigs } from "../test_data/bot_behavior_fixtures.js";

/**
 * Base test class using Template Method pattern.
 *
 * Defines shared test scenarios in registerTests(); subclasses override:
 * - createBotBehavior() — returns the bot behavior under test (domain, server, CLI wrapper, etc.)
 * - assertCurrentBehavior() — adds layer-specific assertions (persistence, DOM, postMessage)
 * - assertCurrentAction() — adds layer-specific assertions
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

  /** Abstract: subclasses return the bot behavior under test for this layer. */
  protected abstract createBotBehavior(): IBotBehavior;

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
  }
}
