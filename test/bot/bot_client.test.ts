// test/bot/bot_client.test.ts
import { describe, expect, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { JSDOM } from "jsdom";
import { BotTest, testStoryBotConfig } from "./bot_test.js";
import { initBotClient, BotClient } from "../../src/bot/view/bot_client.js";
import type { IBot } from "../../src/bot/bot.js";

// Load actual Bot.html and replace template variables with defaults
const botHtmlPath = resolve(__dirname, "../../src/bot/view/Bot.html");
const botHtmlRaw = readFileSync(botHtmlPath, "utf-8");
const fixtureHtml = `<!DOCTYPE html><html><body>${botHtmlRaw
  .replace("{{botCssUri}}", "")
  .replace("{{botOptionsHtml}}", "")
  .replace("{{botName}}", "")
  .replace("{{botDescription}}", "")
  .replace("{{botGoal}}", "")
  .replace("{{botBehaviorNames}}", "")}</body></html>`;

describe("bot_client", () => {
  let postMessageCalls: unknown[];
  let dom: JSDOM;

  beforeEach(() => {
    dom = new JSDOM(fixtureHtml, { url: "http://localhost" });
    postMessageCalls = [];

    // Set up globals for the test
    global.document = dom.window.document;
    global.window = dom.window as unknown as Window & typeof globalThis;
  });

  class BotClientTest extends BotTest {
    protected createBot(): IBot {
      return initBotClient({
        postMessage: (m) => postMessageCalls.push(m),
      });
    }

    protected override assertBotName(bot: IBot, expected: string): void {
      // First: standard domain assertion
      super.assertBotName(bot, expected);

      // Client view adds: verify DOM element has correct text
      const botNameEl = document.getElementById("currentBotName");
      expect(botNameEl?.textContent).toBe(expected);
    }

    protected override assertBehaviorNames(bot: IBot, expected: string[]): void {
      // First: standard domain assertion
      super.assertBehaviorNames(bot, expected);

      // Client view adds: verify DOM element has correct text
      const botBehaviorNamesEl = document.getElementById("botBehaviorNames");
      expect(botBehaviorNamesEl?.textContent).toBe(expected.join(", "));
    }
  }

  new BotClientTest().registerTests();
});
