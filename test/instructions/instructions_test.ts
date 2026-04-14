// test/instructions/instructions_test.ts — Base test class using Template Method pattern
import { it, expect } from "vitest";
import type { IInstructions } from "../../src/instructions/instructions.js";

/**
 * Base test class using Template Method pattern.
 *
 * Defines shared test scenarios in registerTests(); subclasses override:
 * - createInstructions() — returns the instructions under test (domain, server, CLI wrapper, etc.)
 * - assertBehaviorInstructions() — adds layer-specific assertions
 * - assertActionInstructions() — adds layer-specific assertions
 * - assertIsEmpty() — adds layer-specific assertions
 *
 * Arrow functions in it() preserve `this` binding when Vitest invokes callbacks.
 */
export abstract class InstructionsTest {
  /** Default assertion: verify behaviorInstructions equals expected. Subclasses extend. */
  protected assertBehaviorInstructions(instructions: IInstructions, expected: string[]): void {
    expect(instructions.behaviorInstructions).toEqual(expected);
  }

  /** Default assertion: verify actionInstructions equals expected. Subclasses extend. */
  protected assertActionInstructions(instructions: IInstructions, expected: string[]): void {
    expect(instructions.actionInstructions).toEqual(expected);
  }

  /** Default assertion: verify isEmpty. Subclasses extend. */
  protected assertIsEmpty(instructions: IInstructions, expected: boolean): void {
    expect(instructions.isEmpty).toBe(expected);
  }

  /** Abstract: subclasses return the instructions under test for this layer. */
  protected abstract createInstructions(): IInstructions;

  /**
   * Register all shared test scenarios with Vitest.
   * Call inside a describe() block: `new MyInstructionsTest().registerTests()`
   */
  registerTests(): void {
    it("Given new instructions, Then they start empty", () => {
      const inst = this.createInstructions();
      this.assertIsEmpty(inst, true);
      this.assertBehaviorInstructions(inst, []);
      this.assertActionInstructions(inst, []);
    });

    it("When behavior instructions are set, Then behaviorInstructions returns them", () => {
      const inst = this.createInstructions();
      inst.setBehaviorInstructions(["Shape the story map"]);
      this.assertBehaviorInstructions(inst, ["Shape the story map"]);
      this.assertIsEmpty(inst, false);
    });

    it("When action instructions are set, Then actionInstructions returns them", () => {
      const inst = this.createInstructions();
      inst.setActionInstructions(["IMPORTANT: Follow these action instructions specifically", "Review all provided context"]);
      this.assertActionInstructions(inst, ["IMPORTANT: Follow these action instructions specifically", "Review all provided context"]);
      this.assertIsEmpty(inst, false);
    });

    it("When both behavior and action instructions are set, Then isEmpty is false", () => {
      const inst = this.createInstructions();
      inst.setBehaviorInstructions(["Shape the story map"]);
      inst.setActionInstructions(["Gather context for story mapping"]);
      this.assertIsEmpty(inst, false);
      this.assertBehaviorInstructions(inst, ["Shape the story map"]);
      this.assertActionInstructions(inst, ["Gather context for story mapping"]);
    });

    it("When clear is called, Then instructions are empty", () => {
      const inst = this.createInstructions();
      inst.setBehaviorInstructions(["Shape the story map"]);
      inst.setActionInstructions(["Gather context"]);
      inst.clear();
      this.assertIsEmpty(inst, true);
      this.assertBehaviorInstructions(inst, []);
      this.assertActionInstructions(inst, []);
    });

    it("When hydrated with data, Then state is restored", () => {
      const inst = this.createInstructions();
      inst.hydrate?.({
        behaviorInstructions: ["Prioritize stories"],
        actionInstructions: ["Analyze gathered context", "Propose a strategy"],
      });
      this.assertBehaviorInstructions(inst, ["Prioritize stories"]);
      this.assertActionInstructions(inst, ["Analyze gathered context", "Propose a strategy"]);
      this.assertIsEmpty(inst, false);
    });

    it("When new behavior instructions are set, Then previous are replaced", () => {
      const inst = this.createInstructions();
      inst.setBehaviorInstructions(["Shape the story map"]);
      inst.setBehaviorInstructions(["Prioritize stories"]);
      this.assertBehaviorInstructions(inst, ["Prioritize stories"]);
    });

    it("When new action instructions are set, Then previous are replaced", () => {
      const inst = this.createInstructions();
      inst.setActionInstructions(["Gather context"]);
      inst.setActionInstructions(["Analyze gathered context", "Propose a strategy"]);
      this.assertActionInstructions(inst, ["Analyze gathered context", "Propose a strategy"]);
    });

    it("When multiple behavior instructions are set, Then all are returned in order", () => {
      const inst = this.createInstructions();
      inst.setBehaviorInstructions(["First instruction", "Second instruction", "Third instruction"]);
      this.assertBehaviorInstructions(inst, ["First instruction", "Second instruction", "Third instruction"]);
    });
  }
}
