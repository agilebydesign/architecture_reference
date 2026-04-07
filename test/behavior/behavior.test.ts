// test/behavior/behavior.test.ts
import { describe, beforeEach, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { Behavior } from "../../src/behavior/behavior.js";
import { BehaviorServer } from "../../src/behavior/behavior_server.js";
import { BehaviorTest, testAllowedBehaviors, testBehaviorConfigs, testBaseActionConfigs } from "./behavior_test.js";
import type { IBehavior, NavigationResult } from "../../src/behavior/behavior.js";

/**
 * Domain layer tests.
 * createBehavior() returns a plain Behavior — no persistence, no view.
 */
export class DomainBehaviorTest extends BehaviorTest {
  protected createBehavior(): IBehavior {
    return new Behavior();
  }
}

describe("Behavior", () => {
  new DomainBehaviorTest().registerTests();
});

/**
 * Server domain tests.
 * Uses temp file for persistence; behaviors/actions loaded via loadBehaviors/loadActions.
 */
describe("BehaviorServer", () => {
  let persistencePath: string;

  beforeEach(() => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "behavior-"));
    persistencePath = path.join(tmpDir, "behavior.json");
  });

  class ServerBehaviorTest extends BehaviorTest {
    protected createBehavior(): IBehavior {
      return new BehaviorServer(persistencePath);
    }

    protected override assertCurrentBehavior(behavior: IBehavior, expected: string): void {
      // First: standard domain assertion
      super.assertCurrentBehavior(behavior, expected);

      // Server domain adds: verify persistence by reloading from file
      if (fs.existsSync(persistencePath)) {
        const reloaded = new BehaviorServer(persistencePath);
        reloaded.loadBehaviors(testAllowedBehaviors, testBehaviorConfigs);
        reloaded.loadActions(testBaseActionConfigs);
        expect(reloaded.currentBehavior?.name).toBe(expected);
      }
    }

    protected override assertCurrentAction(behavior: IBehavior, expected: string): void {
      // First: standard domain assertion
      super.assertCurrentAction(behavior, expected);

      // Server domain adds: verify persistence by reloading from file
      if (fs.existsSync(persistencePath)) {
        const reloaded = new BehaviorServer(persistencePath);
        reloaded.loadBehaviors(testAllowedBehaviors, testBehaviorConfigs);
        reloaded.loadActions(testBaseActionConfigs);
        expect(reloaded.currentAction?.name).toBe(expected);
      }
    }

    protected override assertNavigation(behavior: IBehavior, result: NavigationResult, expectedBehavior: string, expectedAction: string): void {
      super.assertNavigation(behavior, result, expectedBehavior, expectedAction);

      // Server domain adds: verify persistence survives reload
      if (fs.existsSync(persistencePath)) {
        const reloaded = new BehaviorServer(persistencePath);
        reloaded.loadBehaviors(testAllowedBehaviors, testBehaviorConfigs);
        reloaded.loadActions(testBaseActionConfigs);
        expect(reloaded.currentBehavior?.name).toBe(expectedBehavior);
        expect(reloaded.currentAction?.name).toBe(expectedAction);
      }
    }
  }

  new ServerBehaviorTest().registerTests();
});
