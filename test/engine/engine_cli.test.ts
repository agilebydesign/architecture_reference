// test/engine/engine_cli.test.ts
import { describe, beforeEach, expect } from "vitest";
import { EngineCLI } from "../../src/engine/engine_cli.js";
import { CounterTest } from "../counter/counter_test.js";
import type { ICounter, IFoo, HydrateData } from "../../src/counter/counter.js";

/**
 * Wraps EngineCLI.run as ICounter for Template Method tests.
 * Implements ICounter interface by delegating to CLI commands.
 */
class CliTestWrapper implements ICounter {
  private _format: "json" | "tty" | "markdown" = "json";

  foo: IFoo = {
    get bar(): string {
      // Parse from CLI output — for simplicity, access engine directly
      return EngineCLI.engine.counter.foo.bar;
    },
    set bar(val: string) {
      EngineCLI.run(`counter.foo.bar --value ${val}`);
    },
  };

  get format(): "json" | "tty" | "markdown" {
    return this._format;
  }

  set format(fmt: "json" | "tty" | "markdown") {
    this._format = fmt;
  }

  count(n: number): void {
    EngineCLI.run(`counter.count --amount ${n}`);
  }

  reset(): void {
    EngineCLI.run("counter.reset");
  }

  get total(): number {
    // Access engine directly for numeric total (adapters return formatted strings)
    return EngineCLI.engine.counter.total;
  }

  hydrate(_data?: HydrateData): void {
    // no-op for CLI
  }
}

describe("EngineCLI", () => {
  beforeEach(() => {
    EngineCLI.reset();
  });

  class CliCounterTest extends CounterTest {
    protected createCounter(): ICounter {
      return new CliTestWrapper();
    }

    protected override assertTotal(counter: ICounter, expected: number): void {
      // First: standard domain assertion
      super.assertTotal(counter, expected);

      // CLI layer adds: verify all output formats produce correct output
      const outJson = EngineCLI.run("counter.total", { format: "json" });
      expect(JSON.parse(outJson)).toEqual({ total: expected });

      const outTty = EngineCLI.run("counter.total", { format: "tty" });
      expect(outTty).toMatch(new RegExp(`Total: ${expected}`));

      const outMd = EngineCLI.run("counter.total", { format: "markdown" });
      expect(outMd).toMatch(new RegExp(`\\*\\*Total:\\*\\*\\s*${expected}`));
    }
  }

  new CliCounterTest().registerTests();
});
