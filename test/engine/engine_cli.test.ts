// test/engine/engine_cli.test.ts
import { describe, beforeEach, expect } from "vitest";
import { EngineCLI } from "../../src/engine/engine_cli.js";
import { CounterTest } from "../counter/counter_test.js";
import type { ICounter, IFoo, HydrateData } from "../../src/counter/counter.js";
import { ContextFolderTest } from "../context_folder/context_folder_test.js";
import type { IContextFolder, IBotInfo, ContextFolderHydrateData } from "../../src/context_folder/context_folder.js";
import { BehaviorTest, testAllowedBehaviors, testBehaviorConfigs, testBaseActionConfigs } from "../behavior/behavior_test.js";
import type { IBehavior, IBehaviorConfig, IActionConfig, IBaseActionConfig, BehaviorHydrateData, NavigationResult, PositionResult, ExecutionSetting } from "../../src/behavior/behavior.js";

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

/**
 * Wraps EngineCLI.run as IContextFolder for Template Method tests.
 * Implements IContextFolder interface by delegating to CLI commands.
 */
class CliContextFolderWrapper implements IContextFolder {
  botInfo: IBotInfo = {
    get name(): string {
      return EngineCLI.engine.contextFolder.botInfo.name;
    },
    set name(val: string) {
      EngineCLI.engine.contextFolder.botInfo.name = val;
    },
    get directory(): string {
      return EngineCLI.engine.contextFolder.botInfo.directory;
    },
    set directory(val: string) {
      EngineCLI.engine.contextFolder.botInfo.directory = val;
    },
  };

  updatePath(directory: string): void {
    EngineCLI.run(`contextFolder.updatePath --value ${directory}`);
  }

  switchBot(name: string): void {
    EngineCLI.run(`contextFolder.switchBot --value ${name}`);
  }

  reset(): void {
    EngineCLI.run("contextFolder.reset");
  }

  get folderPath(): string {
    return EngineCLI.engine.contextFolder.folderPath;
  }

  get availableBots(): string[] {
    return EngineCLI.engine.contextFolder.availableBots;
  }

  hydrate(data?: ContextFolderHydrateData): void {
    EngineCLI.engine.contextFolder.hydrate?.(data ?? {});
  }
}

describe("EngineCLI — ContextFolder", () => {
  beforeEach(() => {
    EngineCLI.reset();
  });

  class CliContextFolderTest extends ContextFolderTest {
    protected createContextFolder(): IContextFolder {
      return new CliContextFolderWrapper();
    }

    protected override assertFolderPath(contextFolder: IContextFolder, expected: string): void {
      // First: standard domain assertion
      super.assertFolderPath(contextFolder, expected);

      // CLI layer adds: verify all output formats produce correct output
      const outJson = EngineCLI.run("contextFolder.folderPath", { format: "json" });
      expect(JSON.parse(outJson)).toEqual({ folderPath: expected });

      const outTty = EngineCLI.run("contextFolder.folderPath", { format: "tty" });
      expect(outTty).toContain(expected);

      const outMd = EngineCLI.run("contextFolder.folderPath", { format: "markdown" });
      expect(outMd).toContain(expected);
    }
  }

  new CliContextFolderTest().registerTests();
});

/**
 * Wraps EngineCLI.run as IBehavior for Template Method tests.
 * Implements IBehavior interface by delegating to CLI commands.
 */
class CliBehaviorWrapper implements IBehavior {
  loadBehaviors(allowedBehaviors: string[], behaviorConfigs: IBehaviorConfig[]): void {
    // CLI can't pass complex objects via command string; delegate directly to engine
    EngineCLI.engine.behavior.loadBehaviors(allowedBehaviors, behaviorConfigs);
  }

  loadActions(baseActionConfigs?: IBaseActionConfig[]): void {
    EngineCLI.engine.behavior.loadActions(baseActionConfigs);
  }

  get currentBehavior(): IBehaviorConfig | null {
    return EngineCLI.engine.behavior.currentBehavior;
  }

  get currentAction(): IActionConfig | null {
    return EngineCLI.engine.behavior.currentAction;
  }

  get behaviors(): IBehaviorConfig[] {
    return EngineCLI.engine.behavior.behaviors;
  }

  get actions(): IActionConfig[] {
    return EngineCLI.engine.behavior.actions;
  }

  get baseActionConfigs(): IBaseActionConfig[] {
    return EngineCLI.engine.behavior.baseActionConfigs;
  }

  get behaviorNames(): string[] {
    return EngineCLI.engine.behavior.behaviorNames;
  }

  get actionNames(): string[] {
    return EngineCLI.engine.behavior.actionNames;
  }

  get executionSettings(): Record<string, ExecutionSetting> {
    return EngineCLI.engine.behavior.executionSettings;
  }

  setExecutionSetting(key: string, value: ExecutionSetting): void {
    EngineCLI.engine.behavior.setExecutionSetting(key, value);
  }

  navigateToBehavior(name: string): void {
    EngineCLI.engine.behavior.navigateToBehavior(name);
  }

  navigateToAction(name: string): void {
    EngineCLI.engine.behavior.navigateToAction(name);
  }

  next(): NavigationResult {
    return EngineCLI.engine.behavior.next();
  }

  back(): NavigationResult {
    return EngineCLI.engine.behavior.back();
  }

  pos(): PositionResult {
    return EngineCLI.engine.behavior.pos();
  }

  tree(): string {
    return EngineCLI.engine.behavior.tree();
  }

  nextBehavior(): IBehaviorConfig | null {
    return EngineCLI.engine.behavior.nextBehavior();
  }

  previousBehavior(): IBehaviorConfig | null {
    return EngineCLI.engine.behavior.previousBehavior();
  }

  nextAction(): IActionConfig | null {
    return EngineCLI.engine.behavior.nextAction();
  }

  findBehavior(name: string): IBehaviorConfig | null {
    return EngineCLI.engine.behavior.findBehavior(name);
  }

  findAction(name: string): IActionConfig | null {
    return EngineCLI.engine.behavior.findAction(name);
  }

  checkBehaviorExists(name: string): boolean {
    return EngineCLI.engine.behavior.checkBehaviorExists(name);
  }

  isFinalAction(): boolean {
    return EngineCLI.engine.behavior.isFinalAction();
  }

  closeCurrent(): NavigationResult {
    return EngineCLI.engine.behavior.closeCurrent();
  }

  hydrate(data?: BehaviorHydrateData): void {
    EngineCLI.engine.behavior.hydrate?.(data ?? {});
  }
}

describe("EngineCLI — Behavior", () => {
  beforeEach(() => {
    EngineCLI.reset();
  });

  class CliBehaviorTest extends BehaviorTest {
    protected createBehavior(): IBehavior {
      return new CliBehaviorWrapper();
    }

    protected override assertCurrentBehavior(behavior: IBehavior, expected: string): void {
      // First: standard domain assertion
      super.assertCurrentBehavior(behavior, expected);

      // CLI layer adds: verify all output formats produce correct output
      const outJson = EngineCLI.run("behavior.currentBehavior", { format: "json" });
      expect(JSON.parse(outJson).currentBehavior).toBe(expected);

      const outTty = EngineCLI.run("behavior.currentBehavior", { format: "tty" });
      expect(outTty).toContain(expected);

      const outMd = EngineCLI.run("behavior.currentBehavior", { format: "markdown" });
      expect(outMd).toContain(expected);
    }

    protected override assertCurrentAction(behavior: IBehavior, expected: string): void {
      // First: standard domain assertion
      super.assertCurrentAction(behavior, expected);

      // CLI layer adds: verify all output formats produce correct output
      const outJson = EngineCLI.run("behavior.currentAction", { format: "json" });
      expect(JSON.parse(outJson).currentAction).toBe(expected);

      const outTty = EngineCLI.run("behavior.currentAction", { format: "tty" });
      expect(outTty).toContain(expected);

      const outMd = EngineCLI.run("behavior.currentAction", { format: "markdown" });
      expect(outMd).toContain(expected);
    }

    protected override assertNavigation(behavior: IBehavior, result: NavigationResult, expectedBehavior: string, expectedAction: string): void {
      super.assertNavigation(behavior, result, expectedBehavior, expectedAction);

      // CLI layer adds: verify position output in all formats
      const outJson = EngineCLI.run("behavior.pos", { format: "json" });
      const parsed = JSON.parse(outJson);
      expect(parsed.behavior).toBe(expectedBehavior);
      expect(parsed.action).toBe(expectedAction);

      const outTty = EngineCLI.run("behavior.pos", { format: "tty" });
      expect(outTty).toContain(`${expectedBehavior}.${expectedAction}`);
    }
  }

  new CliBehaviorTest().registerTests();
});
