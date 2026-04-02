// test/bot_behavior/bot_behavior.test.ts
import { describe, beforeEach, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { BotBehavior } from "../../src/bot_behavior/bot_behavior.js";
import { BotBehaviorServer } from "../../src/bot_behavior/bot_behavior_server.js";
import { BotBehaviorTest, testAllowedBehaviors, testBehaviorConfigs, testBaseActionConfigs } from "./bot_behavior_test.js";
import type { IBotBehavior, NavigationResult } from "../../src/bot_behavior/bot_behavior.js";

/** Path to real bot config dir (bots/story_bot) in the project */
const projectRoot = path.resolve(__dirname, "../..");
const botConfigDir = path.join(projectRoot, "bots", "story_bot");

/**
 * Domain layer tests.
 * createBotBehavior() returns a plain BotBehavior — no persistence, no view.
 */
export class DomainBotBehaviorTest extends BotBehaviorTest {
  protected createBotBehavior(): IBotBehavior {
    return new BotBehavior();
  }
}

describe("BotBehavior", () => {
  new DomainBotBehaviorTest().registerTests();
});

/**
 * Server domain tests.
 * Uses temp file for persistence; real bots/story_bot/ config files for behavior/action loading.
 */
describe("BotBehaviorServer", () => {
  let persistencePath: string;

  beforeEach(() => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bot-behavior-"));
    persistencePath = path.join(tmpDir, "bot_behavior.json");
  });

  class ServerBotBehaviorTest extends BotBehaviorTest {
    protected createBotBehavior(): IBotBehavior {
      return new BotBehaviorServer(persistencePath, botConfigDir);
    }

    protected override assertCurrentBehavior(botBehavior: IBotBehavior, expected: string): void {
      // First: standard domain assertion
      super.assertCurrentBehavior(botBehavior, expected);

      // Server domain adds: verify persistence by reloading from file
      if (fs.existsSync(persistencePath)) {
        const reloaded = new BotBehaviorServer(persistencePath, botConfigDir);
        expect(reloaded.currentBehavior?.name).toBe(expected);
      }
    }

    protected override assertCurrentAction(botBehavior: IBotBehavior, expected: string): void {
      // First: standard domain assertion
      super.assertCurrentAction(botBehavior, expected);

      // Server domain adds: verify persistence by reloading from file
      if (fs.existsSync(persistencePath)) {
        const reloaded = new BotBehaviorServer(persistencePath, botConfigDir);
        expect(reloaded.currentAction?.name).toBe(expected);
      }
    }

    protected override assertNavigation(botBehavior: IBotBehavior, result: NavigationResult, expectedBehavior: string, expectedAction: string): void {
      super.assertNavigation(botBehavior, result, expectedBehavior, expectedAction);

      // Server domain adds: verify persistence survives reload
      if (fs.existsSync(persistencePath)) {
        const reloaded = new BotBehaviorServer(persistencePath, botConfigDir);
        expect(reloaded.currentBehavior?.name).toBe(expectedBehavior);
        expect(reloaded.currentAction?.name).toBe(expectedAction);
      }
    }
  }

  new ServerBotBehaviorTest().registerTests();
});
