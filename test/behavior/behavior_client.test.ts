// test/behavior/behavior_client.test.ts
import { describe, expect, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { JSDOM } from "jsdom";
import { BehaviorTest, testAllowedBehaviors, testBehaviorConfigs, testBaseActionConfigs } from "./behavior_test.js";
import { initBehaviorClient, BehaviorClient } from "../../src/behavior/view/behavior_client.js";
import type { IBehavior, NavigationResult } from "../../src/behavior/behavior.js";

// Load actual Behavior.html and replace template variables with defaults
const behaviorHtmlPath = resolve(__dirname, "../../src/behavior/view/Behavior.html");
const behaviorHtmlRaw = readFileSync(behaviorHtmlPath, "utf-8");
const fixtureHtml = `<!DOCTYPE html><html><body>${behaviorHtmlRaw
  .replace("{{behaviorCssUri}}", "")
  .replace("{{currentBehavior}}", "")
  .replace("{{currentAction}}", "")
  .replace("{{behaviorTreeHtml}}", "")}</body></html>`;

describe("behavior_client", () => {
  let postMessageCalls: unknown[];
  let dom: JSDOM;

  beforeEach(() => {
    dom = new JSDOM(fixtureHtml, { url: "http://localhost" });
    postMessageCalls = [];

    // Set up globals for the test
    global.document = dom.window.document;
    global.window = dom.window as unknown as Window & typeof globalThis;
  });

  class BehaviorClientTest extends BehaviorTest {
    protected createBehavior(): IBehavior {
      return initBehaviorClient({
        postMessage: (m) => postMessageCalls.push(m),
      });
    }

    protected override assertCurrentBehavior(behavior: IBehavior, expected: string): void {
      // First: standard domain assertion
      super.assertCurrentBehavior(behavior, expected);

      // Client view adds: verify DOM element has correct text
      const currentBehaviorEl = document.getElementById("currentBehavior");
      expect(currentBehaviorEl?.textContent).toBe(expected);
    }

    protected override assertCurrentAction(behavior: IBehavior, expected: string): void {
      // First: standard domain assertion
      super.assertCurrentAction(behavior, expected);

      // Client view adds: verify DOM element has correct text
      const currentActionEl = document.getElementById("currentAction");
      expect(currentActionEl?.textContent).toBe(expected);
    }

    protected override assertNavigation(behavior: IBehavior, result: NavigationResult, expectedBehavior: string, expectedAction: string): void {
      super.assertNavigation(behavior, result, expectedBehavior, expectedAction);

      // Client view adds: verify DOM elements updated
      const currentBehaviorEl = document.getElementById("currentBehavior");
      expect(currentBehaviorEl?.textContent).toBe(expectedBehavior);
      const currentActionEl = document.getElementById("currentAction");
      expect(currentActionEl?.textContent).toBe(expectedAction);
    }
  }

  new BehaviorClientTest().registerTests();
});
