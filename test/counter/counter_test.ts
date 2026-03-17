// test/counter/counter_test.ts
import { it, expect } from "vitest";
import { Counter } from "../../src/counter/counter.js";
import type { ICounter } from "../../src/counter/counter.js";

/**
 * Base test class using Template Method pattern.
 * 
 * Defines shared test scenarios in registerTests(); subclasses override:
 * - createCounter() — returns the counter under test (domain, server, CLI wrapper, etc.)
 * - assertTotal() — adds layer-specific assertions (persistence, DOM, postMessage)
 * 
 * Arrow functions in it() preserve `this` binding when Vitest invokes callbacks.
 */
export abstract class CounterTest {
  /** Helper: create a counter starting at the given total. */
  protected startingCounter(total = 0): ICounter {
    const c = new Counter();
    if (total > 0) c.count(total);
    return c;
  }

  /** Helper: create a counter after applying multiple counts. */
  protected counterWithCounts(...amounts: number[]): ICounter {
    const c = new Counter();
    amounts.forEach((a) => c.count(a));
    return c;
  }

  /** Default assertion: verify counter.total equals expected. Subclasses extend. */
  protected assertTotal(counter: ICounter, expected: number): void {
    expect(counter.total).toBe(expected);
  }

  /** Abstract: subclasses return the counter under test for this layer. */
  protected abstract createCounter(): ICounter;

  /**
   * Register all shared test scenarios with Vitest.
   * Call inside a describe() block: `new MyCounterTest().registerTests()`
   */
  registerTests(): void {
    it("starts at zero", () => {
      const c = this.createCounter();
      this.assertTotal(c, 0);
    });

    it("counter that starts at three, add 4 and 7, yields 14", () => {
      const c = this.createCounter();
      c.count(3);
      c.count(4);
      c.count(7);
      this.assertTotal(c, 14);
    });

    it("reset clears total", () => {
      const c = this.createCounter();
      c.count(5);
      c.reset();
      this.assertTotal(c, 0);
    });
  }
}
