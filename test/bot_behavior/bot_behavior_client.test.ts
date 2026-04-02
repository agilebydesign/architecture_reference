// test/bot_behavior/bot_behavior_client.test.ts
import { describe, expect, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { JSDOM } from "jsdom";
import { BotBehaviorTest, testAllowedBehaviors, testBehaviorConfigs, testBaseActionConfigs } from "./bot_behavior_test.js";
import { initBotBehaviorClient, BotBehaviorClient } from "../../src/bot_behavior/view/bot_behavior_client.js";
import type { IBotBehavior, NavigationResult } from "../../src/bot_behavior/bot_behavior.js";

// Load actual BotBehavior.html and replace template variables with defaults
const botBehaviorHtmlPath = resolve(__dirname, "../../src/bot_behavior/view/BotBehavior.html");
const botBehaviorHtmlRaw = readFileSync(botBehaviorHtmlPath, "utf-8");
const fixtureHtml = `<!DOCTYPE html><html><body>${botBehaviorHtmlRaw
  .replace("{{botBehaviorCssUri}}", "")
  .replace("{{currentBehavior}}", "")
  .replace("{{currentAction}}", "")
  .replace("{{behaviorTreeHtml}}", "")}</body></html>`;

describe("bot_behavior_client", () => {
  let postMessageCalls: unknown[];
  let dom: JSDOM;

  beforeEach(() => {
    dom = new JSDOM(fixtureHtml, { url: "http://localhost" });
    postMessageCalls = [];

    // Set up globals for the test
    global.document = dom.window.document;
    global.window = dom.window as unknown as Window & typeof globalThis;
  });

  class BotBehaviorClientTest extends BotBehaviorTest {
    protected createBotBehavior(): IBotBehavior {
      return initBotBehaviorClient({
        postMessage: (m) => postMessageCalls.push(m),
      });
    }

    protected override assertCurrentBehavior(botBehavior: IBotBehavior, expected: string): void {
      // First: standard domain assertion
      super.assertCurrentBehavior(botBehavior, expected);

      // Client view adds: verify DOM element has correct text
      const currentBehaviorEl = document.getElementById("currentBehavior");
      expect(currentBehaviorEl?.textContent).toBe(expected);
    }

    protected override assertCurrentAction(botBehavior: IBotBehavior, expected: string): void {
      // First: standard domain assertion
      super.assertCurrentAction(botBehavior, expected);

      // Client view adds: verify DOM element has correct text
      const currentActionEl = document.getElementById("currentAction");
      expect(currentActionEl?.textContent).toBe(expected);
    }

    protected override assertNavigation(botBehavior: IBotBehavior, result: NavigationResult, expectedBehavior: string, expectedAction: string): void {
      super.assertNavigation(botBehavior, result, expectedBehavior, expectedAction);

      // Client view adds: verify DOM elements updated
      const currentBehaviorEl = document.getElementById("currentBehavior");
      expect(currentBehaviorEl?.textContent).toBe(expectedBehavior);
      const currentActionEl = document.getElementById("currentAction");
      expect(currentActionEl?.textContent).toBe(expectedAction);
    }
  }

  new BotBehaviorClientTest().registerTests();
});
