// test/bot/bot.test.ts
import { describe, beforeEach, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { Bot } from "../../src/bot/bot.js";
import { BotServer } from "../../src/bot/bot_server.js";
import { BotTest, testStoryBotConfig } from "./bot_test.js";
import type { IBot } from "../../src/bot/bot.js";

/**
 * Domain layer tests.
 * createBot() returns a plain Bot — no persistence, no view.
 */
export class DomainBotTest extends BotTest {
  protected createBot(): IBot {
    return new Bot();
  }
}

describe("Bot", () => {
  new DomainBotTest().registerTests();
});

/**
 * Server domain tests.
 * Uses temp file for persistence and a temp bots dir with test bot_config.json files.
 */
describe("BotServer", () => {
  let persistencePath: string;
  let botsDir: string;

  beforeEach(() => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bot-"));
    persistencePath = path.join(tmpDir, "bot.json");
    // Create an empty bots dir — BotServer starts clean, bots are registered via test fixtures
    botsDir = path.join(tmpDir, "bots");
    fs.mkdirSync(botsDir);
  });

  class ServerBotTest extends BotTest {
    protected createBot(): IBot {
      return new BotServer(persistencePath, botsDir);
    }

    protected override assertBotName(bot: IBot, expected: string): void {
      // First: standard domain assertion
      super.assertBotName(bot, expected);

      // Server domain adds: verify persistence by reloading from file
      if (fs.existsSync(persistencePath)) {
        const reloaded = new BotServer(persistencePath, botsDir);
        // Re-register test configs so reloaded server has them
        reloaded.registerBot(testStoryBotConfig);
        expect(reloaded.name).toBe(expected);
      }
    }
  }

  new ServerBotTest().registerTests();
});
