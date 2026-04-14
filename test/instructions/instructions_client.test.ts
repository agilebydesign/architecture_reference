// test/instructions/instructions_client.test.ts — Client layer tests
import { describe, expect, beforeEach } from "vitest";
import { JSDOM } from "jsdom";
import { InstructionsView } from "../../src/instructions/view/instructions_view.js";
import { InstructionsTest } from "./instructions_test.js";
import { initInstructionsClient, InstructionsClient } from "../../src/instructions/view/instructions_client.js";
import type { IInstructions } from "../../src/instructions/instructions.js";

// Load fixture HTML from the Instructions template
const fixtureHtml = `<!DOCTYPE html><html><body>${InstructionsView.getFixtureHtml()}</body></html>`;

describe("instructions_client", () => {
  let postMessageCalls: unknown[];
  let dom: JSDOM;

  beforeEach(() => {
    dom = new JSDOM(fixtureHtml, { url: "http://localhost" });
    postMessageCalls = [];

    // Set up globals for the test
    global.document = dom.window.document;
    global.window = dom.window as unknown as Window & typeof globalThis;
  });

  class InstructionsClientTest extends InstructionsTest {
    protected createInstructions(): IInstructions {
      return initInstructionsClient({
        postMessage: (m) => postMessageCalls.push(m),
      });
    }

    protected override assertBehaviorInstructions(instructions: IInstructions, expected: string[]): void {
      super.assertBehaviorInstructions(instructions, expected);

      // Client adds: verify DOM instruction-item elements
      const panel = document.getElementById("instructions-panel");
      const items = panel?.querySelectorAll(".instruction-item");
      const allExpected = [...expected, ...instructions.actionInstructions];
      if (allExpected.length === 0) {
        expect(panel?.querySelector(".instructions-empty")).toBeTruthy();
        expect(items?.length ?? 0).toBe(0);
      } else {
        // Behavior instructions come first in the DOM
        for (let i = 0; i < expected.length; i++) {
          expect(items?.[i]?.textContent).toBe(expected[i]);
        }
      }
    }

    protected override assertActionInstructions(instructions: IInstructions, expected: string[]): void {
      super.assertActionInstructions(instructions, expected);

      // Client adds: verify DOM instruction-item elements
      const panel = document.getElementById("instructions-panel");
      const items = panel?.querySelectorAll(".instruction-item");
      const allExpected = [...instructions.behaviorInstructions, ...expected];
      if (allExpected.length === 0) {
        expect(panel?.querySelector(".instructions-empty")).toBeTruthy();
        expect(items?.length ?? 0).toBe(0);
      } else {
        // Action instructions follow behavior instructions in the DOM
        const offset = instructions.behaviorInstructions.length;
        for (let i = 0; i < expected.length; i++) {
          expect(items?.[offset + i]?.textContent).toBe(expected[i]);
        }
      }
    }

    protected override assertIsEmpty(instructions: IInstructions, expected: boolean): void {
      super.assertIsEmpty(instructions, expected);

      // Client adds: verify DOM state
      const panel = document.getElementById("instructions-panel");
      if (expected) {
        expect(panel?.querySelector(".instructions-empty")).toBeTruthy();
        expect(panel?.querySelectorAll(".instruction-item").length).toBe(0);
      } else {
        expect(panel?.querySelector(".instructions-empty")).toBeFalsy();
        expect((panel?.querySelectorAll(".instruction-item").length ?? 0)).toBeGreaterThan(0);
      }
    }
  }

  new InstructionsClientTest().registerTests();
});
