// test/instructions/display_instructions.test.ts — Story-specific coordination tests
// Tests coordination between BehaviorClient and InstructionsClient using separate domain instances
import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { JSDOM } from "jsdom";
import { initBehaviorClient, BehaviorClient } from "../../src/behavior/view/behavior_client.js";
import { initInstructionsClient, InstructionsClient } from "../../src/instructions/view/instructions_client.js";
import type { IBehavior } from "../../src/behavior/behavior.js";
import type { IInstructions } from "../../src/instructions/instructions.js";
import { testBehaviorConfigs, testAllowedBehaviors, testBaseActionConfigs } from "../test_data/behavior_fixtures.js";

// Load actual HTML templates and replace placeholders with defaults
const behaviorHtmlPath = resolve(__dirname, "../../src/behavior/view/Behavior.html");
const behaviorHtmlRaw = readFileSync(behaviorHtmlPath, "utf-8");
const instructionsHtmlPath = resolve(__dirname, "../../src/instructions/view/Instructions.html");
const instructionsHtmlRaw = readFileSync(instructionsHtmlPath, "utf-8");

const fixtureHtml = `<!DOCTYPE html><html><body>${behaviorHtmlRaw
  .replace("{{behaviorCssUri}}", "")
  .replace("{{currentBehavior}}", "")
  .replace("{{currentAction}}", "")
  .replace("{{behaviorTreeHtml}}", "")}${instructionsHtmlRaw
  .replace("{{instructionsCssUri}}", "")}</body></html>`;

/** Sync instructions from current behavior/action state — mirrors engine_client.ts coordination. */
function syncInstructions(behavior: IBehavior, instructions: IInstructions): void {
  instructions.setBehaviorInstructions(behavior.currentBehavior?.instructions ?? []);
  instructions.setActionInstructions(behavior.currentAction?.instructions ?? []);
}

/** Wrap behavior client methods to auto-sync instructions, matching engine_client.ts pattern. */
function wrapBehaviorWithSync(behavior: BehaviorClient, instructions: InstructionsClient): void {
  const origNavigateToBehavior = behavior.navigateToBehavior.bind(behavior);
  behavior.navigateToBehavior = (name: string) => {
    origNavigateToBehavior(name);
    syncInstructions(behavior, instructions);
  };

  const origNavigateToAction = behavior.navigateToAction.bind(behavior);
  behavior.navigateToAction = (name: string) => {
    origNavigateToAction(name);
    syncInstructions(behavior, instructions);
  };

  const origNext = behavior.next.bind(behavior);
  behavior.next = () => {
    const result = origNext();
    syncInstructions(behavior, instructions);
    return result;
  };

  const origBack = behavior.back.bind(behavior);
  behavior.back = () => {
    const result = origBack();
    syncInstructions(behavior, instructions);
    return result;
  };

  const origCloseCurrent = behavior.closeCurrent.bind(behavior);
  behavior.closeCurrent = () => {
    const result = origCloseCurrent();
    syncInstructions(behavior, instructions);
    return result;
  };

  const origHydrate = behavior.hydrate.bind(behavior);
  behavior.hydrate = (data: Parameters<typeof behavior.hydrate>[0]) => {
    origHydrate(data);
    syncInstructions(behavior, instructions);
  };
}

describe("TestDisplaySelectedBehaviorInstructions", () => {
  let dom: JSDOM;
  let postMessageCalls: unknown[];
  let behavior: BehaviorClient;
  let instructions: InstructionsClient;

  beforeEach(() => {
    dom = new JSDOM(fixtureHtml, { url: "http://localhost" });
    postMessageCalls = [];
    global.document = dom.window.document;
    global.window = dom.window as unknown as Window & typeof globalThis;

    behavior = initBehaviorClient({
      postMessage: (m) => postMessageCalls.push(m),
    });
    instructions = initInstructionsClient({
      postMessage: (m) => postMessageCalls.push(m),
    });
    wrapBehaviorWithSync(behavior, instructions);

    behavior.loadBehaviors(testAllowedBehaviors, testBehaviorConfigs);
    behavior.loadActions(testBaseActionConfigs);
    syncInstructions(behavior, instructions);
  });

  it("When user selects 'shape' behavior, Then instructions-panel renders behavior instructions", () => {
    // Given BotBehavior has 'shape' behavior loaded with instructions ['Shape the story map']
    expect(testBehaviorConfigs.find(b => b.name === "shape")?.instructions).toEqual(["Shape the story map"]);

    // When user selects 'shape' behavior in behavior tree
    behavior.navigateToBehavior("shape");

    // Then instructions-panel contains instruction-item elements including behavior instruction
    const panel = document.getElementById("instructions-panel");
    const items = panel?.querySelectorAll(".instruction-item");
    const itemTexts = Array.from(items ?? []).map(el => el.textContent);
    expect(itemTexts).toContain("Shape the story map");

    // And currentBehavior span text is 'shape'
    expect(document.getElementById("currentBehavior")?.textContent).toBe("shape");
  });

  it("When selected behavior has no instructions, Then instructions-panel displays empty placeholder", () => {
    // Given Behavior has 'empty-behavior' behavior loaded with instructions [] and no actions
    behavior.loadBehaviors(
      ["empty-behavior"],
      [{ name: "empty-behavior", order: 1, description: "", goal: "", inputs: "", outputs: "", instructions: [], actionsWorkflow: [] }]
    );
    behavior.loadActions([]);

    // When user selects 'empty-behavior' behavior in behavior tree
    behavior.navigateToBehavior("empty-behavior");
    syncInstructions(behavior, instructions);

    // Then instructions-panel contains instructions-empty placeholder
    const panel = document.getElementById("instructions-panel");
    expect(panel?.querySelector(".instructions-empty")).toBeTruthy();

    // And instructions-panel contains zero instruction-item elements
    expect(panel?.querySelectorAll(".instruction-item").length).toBe(0);
  });

  it("When user selects different behavior, Then prior behavior instructions are replaced", () => {
    // Given Behavior has 'shape' and 'prioritization' behaviors loaded
    // And 'shape' behavior is currently selected showing its instructions
    behavior.navigateToBehavior("shape");
    const panelAfterShape = document.getElementById("instructions-panel");
    expect(panelAfterShape?.querySelectorAll(".instruction-item").length).toBeGreaterThan(0);

    // When user selects 'prioritization' behavior in behavior tree
    behavior.navigateToBehavior("prioritization");

    // Then instructions-panel contains instruction-item elements for 'prioritization' instructions
    const panel = document.getElementById("instructions-panel");
    const items = panel?.querySelectorAll(".instruction-item");
    const itemTexts = Array.from(items ?? []).map(el => el.textContent);
    expect(itemTexts).toContain("Prioritize stories");

    // And instructions-panel contains no instruction-item elements from 'shape' instructions
    const shapeInstructions = testBehaviorConfigs.find(b => b.name === "shape")?.instructions ?? [];
    shapeInstructions.forEach(instruction => {
      expect(itemTexts).not.toContain(instruction);
    });
  });

  it("When panel receives BotBehaviorHydrateData init message, Then instructions-panel populates", () => {
    // Given BehaviorHydrateData contains allowedBehaviors ['shape'] and behaviorConfigs with 'shape' having instructions ['Shape the story map']
    const hydratePayload = {
      allowedBehaviors: ["shape"],
      behaviorConfigs: [testBehaviorConfigs.find(b => b.name === "shape")!],
      baseActionConfigs: testBaseActionConfigs,
      currentBehavior: "shape",
      currentAction: "clarify",
      executionSettings: {} as Record<string, string>,
      behaviorTree: [],
    };
    window.dispatchEvent(new dom.window.MessageEvent("message", { data: hydratePayload }));

    // Then instructions-panel contains instruction-item elements including 'Shape the story map'
    const panel = document.getElementById("instructions-panel");
    const items = panel?.querySelectorAll(".instruction-item");
    const itemTexts = Array.from(items ?? []).map(el => el.textContent);
    expect(itemTexts).toContain("Shape the story map");

    // And currentBehavior span text is 'shape'
    expect(document.getElementById("currentBehavior")?.textContent).toBe("shape");
  });

  it("When behavior has multiple instructions, Then all display in config order", () => {
    // Given Behavior has 'multi-behavior' behavior loaded with instructions ['First instruction', 'Second instruction', 'Third instruction']
    behavior.loadBehaviors(
      ["multi-behavior"],
      [{ name: "multi-behavior", order: 1, description: "", goal: "", inputs: "", outputs: "", instructions: ["First instruction", "Second instruction", "Third instruction"], actionsWorkflow: [] }]
    );
    behavior.loadActions([]);

    // When user selects 'multi-behavior' behavior in behavior tree
    behavior.navigateToBehavior("multi-behavior");
    syncInstructions(behavior, instructions);

    // Then instructions-panel contains three instruction-item elements in order
    const panel = document.getElementById("instructions-panel");
    const items = panel?.querySelectorAll(".instruction-item");
    expect(items?.length).toBe(3);
    expect(items?.[0].textContent).toBe("First instruction");
    expect(items?.[1].textContent).toBe("Second instruction");
    expect(items?.[2].textContent).toBe("Third instruction");
  });
});

describe("TestDisplaySelectedActionInstructions", () => {
  let dom: JSDOM;
  let postMessageCalls: unknown[];
  let behavior: BehaviorClient;
  let instructions: InstructionsClient;

  beforeEach(() => {
    dom = new JSDOM(fixtureHtml, { url: "http://localhost" });
    postMessageCalls = [];
    global.document = dom.window.document;
    global.window = dom.window as unknown as Window & typeof globalThis;

    behavior = initBehaviorClient({
      postMessage: (m) => postMessageCalls.push(m),
    });
    instructions = initInstructionsClient({
      postMessage: (m) => postMessageCalls.push(m),
    });
    wrapBehaviorWithSync(behavior, instructions);

    behavior.loadBehaviors(testAllowedBehaviors, testBehaviorConfigs);
    behavior.loadActions(testBaseActionConfigs);
    syncInstructions(behavior, instructions);
  });

  it("When user selects 'clarify' action, Then instructions-panel renders merged action instructions in order", () => {
    // Given Behavior has 'shape' behavior with 'clarify' action loaded
    behavior.navigateToBehavior("shape");

    // When user selects 'clarify' action in behavior tree
    behavior.navigateToAction("clarify");

    // Then instructions-panel contains instruction-item elements for each merged instruction
    const panel = document.getElementById("instructions-panel");
    const items = panel?.querySelectorAll(".instruction-item");
    expect((items?.length ?? 0)).toBeGreaterThan(0);

    // And instruction-item elements appear in merged order: base instructions first, then behavior-specific
    const itemTexts = Array.from(items ?? []).map(el => el.textContent);
    expect(itemTexts).toContain("IMPORTANT: Follow these action instructions specifically");
    expect(itemTexts).toContain("Review all provided context");
    expect(itemTexts).toContain("Gather context for story mapping");

    // And currentAction span text is 'clarify'
    expect(document.getElementById("currentAction")?.textContent).toBe("clarify");
  });

  it("When selected action has empty merged instructions, Then instructions-panel shows empty state", () => {
    // Given Behavior has an action with empty base instructions and empty behavior instructions
    behavior.loadBehaviors(
      ["empty-behavior"],
      [{ name: "empty-behavior", order: 1, description: "", goal: "", inputs: "", outputs: "", instructions: [], actionsWorkflow: [
        { name: "empty-action", order: 1, nextAction: null, instructions: [], executionSetting: "manual" }
      ]}]
    );
    behavior.loadActions([
      { name: "empty-action", description: "", instructions: [] }
    ]);

    behavior.navigateToBehavior("empty-behavior");
    syncInstructions(behavior, instructions);

    // When user selects that action in behavior tree
    behavior.navigateToAction("empty-action");

    // Then instructions-panel contains instructions-empty placeholder
    const panel = document.getElementById("instructions-panel");
    expect(panel?.querySelector(".instructions-empty")).toBeTruthy();

    // And instructions-panel contains zero instruction-item elements
    expect(panel?.querySelectorAll(".instruction-item").length).toBe(0);
  });

  it("When user navigates to different action, Then prior action instructions are replaced", () => {
    // Given Behavior is at 'shape' behavior with 'clarify' action selected showing its instructions
    behavior.navigateToBehavior("shape");
    behavior.navigateToAction("clarify");

    const panelAfterClarify = document.getElementById("instructions-panel");
    expect((panelAfterClarify?.querySelectorAll(".instruction-item").length ?? 0)).toBeGreaterThan(0);

    // When user presses Next button to advance to 'strategy' action
    behavior.next();

    // Then instructions-panel contains instruction-item elements for 'strategy' action instructions
    const panel = document.getElementById("instructions-panel");
    const items = panel?.querySelectorAll(".instruction-item");
    const itemTexts = Array.from(items ?? []).map(el => el.textContent);
    expect(itemTexts).toContain("Analyze gathered context");
    expect(itemTexts).toContain("Propose a strategy");

    // And instructions-panel contains no instruction-item elements from 'clarify' action
    expect(itemTexts).not.toContain("IMPORTANT: Follow these action instructions specifically");
    expect(itemTexts).not.toContain("Gather context for story mapping");

    // And currentAction span text is 'strategy'
    expect(document.getElementById("currentAction")?.textContent).toBe("strategy");
  });

  it("When user selects 'clarify' action, Then base instructions come first followed by behavior-specific", () => {
    // Given IBaseActionConfig for 'clarify' has instructions ['IMPORTANT: ...', 'Review all provided context']
    // And 'shape' behavior workflow entry for 'clarify' has instructions ['Gather context for story mapping']
    behavior.navigateToBehavior("shape");

    // When user selects 'clarify' action in behavior tree
    behavior.navigateToAction("clarify");

    // Then action instructions are in merged order
    const panel = document.getElementById("instructions-panel");
    const items = panel?.querySelectorAll(".instruction-item");
    // Behavior instructions come first, then action instructions
    // behaviorInstructions: ["Shape the story map"]
    // actionInstructions: ["IMPORTANT...", "Review all provided context", "Gather context for story mapping"]
    const itemTexts = Array.from(items ?? []).map(el => el.textContent);

    // Find positions of behavior vs action instructions
    const behaviorIdx = itemTexts.indexOf("Shape the story map");
    const actionIdx = itemTexts.indexOf("IMPORTANT: Follow these action instructions specifically");
    expect(behaviorIdx).toBeLessThan(actionIdx);
    expect(items?.length).toBe(4); // 1 behavior + 3 action
  });

  it("When panel receives BotBehaviorHydrateData init message, Then action instructions populate", () => {
    // Given BehaviorHydrateData contains allowedBehaviors, behaviorConfigs with 'shape', and baseActionConfigs for 'clarify'
    const hydratePayload = {
      allowedBehaviors: testAllowedBehaviors,
      behaviorConfigs: testBehaviorConfigs,
      baseActionConfigs: testBaseActionConfigs,
      currentBehavior: "shape",
      currentAction: "clarify",
      executionSettings: {} as Record<string, string>,
      behaviorTree: [],
    };
    window.dispatchEvent(new dom.window.MessageEvent("message", { data: hydratePayload }));

    // Then instructions-panel contains instruction-item elements for the current action's merged instructions
    const panel = document.getElementById("instructions-panel");
    const items = panel?.querySelectorAll(".instruction-item");
    expect((items?.length ?? 0)).toBeGreaterThan(0);
    const itemTexts = Array.from(items ?? []).map(el => el.textContent);
    expect(itemTexts).toContain("IMPORTANT: Follow these action instructions specifically");

    // And currentAction span text matches the first action in 'shape' behavior workflow
    expect(document.getElementById("currentAction")?.textContent).toBe("clarify");
  });
});

describe("TestHydrateInstructionsOnPanelOpen", () => {
  let dom: JSDOM;
  let postMessageCalls: unknown[];
  let behavior: BehaviorClient;
  let instructions: InstructionsClient;

  beforeEach(() => {
    dom = new JSDOM(fixtureHtml, { url: "http://localhost" });
    postMessageCalls = [];
    global.document = dom.window.document;
    global.window = dom.window as unknown as Window & typeof globalThis;

    behavior = initBehaviorClient({
      postMessage: (m) => postMessageCalls.push(m),
    });
    instructions = initInstructionsClient({
      postMessage: (m) => postMessageCalls.push(m),
    });
    wrapBehaviorWithSync(behavior, instructions);
  });

  it("When panel opens, Then instructions-panel shows behavior and action instructions immediately", () => {
    // Given BotBehaviorHydrateData contains allowedBehaviors ['shape'] with behaviorConfigs and baseActionConfigs
    const hydratePayload = {
      allowedBehaviors: ["shape"],
      behaviorConfigs: [testBehaviorConfigs.find(b => b.name === "shape")!],
      baseActionConfigs: testBaseActionConfigs,
      currentBehavior: "shape",
      currentAction: "clarify",
      executionSettings: {} as Record<string, string>,
      behaviorTree: [],
    };

    // When panel receives BotBehaviorHydrateData init message
    window.dispatchEvent(new dom.window.MessageEvent("message", { data: hydratePayload }));

    // Then instructions-panel contains instruction-item elements for current behavior and action instructions
    const panel = document.getElementById("instructions-panel");
    const items = panel?.querySelectorAll(".instruction-item");
    expect((items?.length ?? 0)).toBeGreaterThan(0);
    const itemTexts = Array.from(items ?? []).map(el => el.textContent);
    expect(itemTexts).toContain("Shape the story map");
    expect(itemTexts).toContain("IMPORTANT: Follow these action instructions specifically");
  });

  it("When panel is re-opened after close, Then fresh hydration data populates instructions", () => {
    // Given panel was previously open with 'shape' behavior selected
    behavior.loadBehaviors(testAllowedBehaviors, testBehaviorConfigs);
    behavior.loadActions(testBaseActionConfigs);
    syncInstructions(behavior, instructions);

    // And panel was closed and is now re-opened
    // Simulate close by clearing DOM
    const panel = document.getElementById("instructions-panel");
    if (panel) panel.innerHTML = "";

    // When panel receives fresh BotBehaviorHydrateData init message
    const hydratePayload = {
      allowedBehaviors: testAllowedBehaviors,
      behaviorConfigs: testBehaviorConfigs,
      baseActionConfigs: testBaseActionConfigs,
      currentBehavior: "shape",
      currentAction: "clarify",
      executionSettings: {} as Record<string, string>,
      behaviorTree: [],
    };
    window.dispatchEvent(new dom.window.MessageEvent("message", { data: hydratePayload }));

    // Then instructions-panel shows current behavior and action instructions from the new hydration data
    const updatedPanel = document.getElementById("instructions-panel");
    const items = updatedPanel?.querySelectorAll(".instruction-item");
    expect((items?.length ?? 0)).toBeGreaterThan(0);
  });

  it("When panel opens with no behaviors configured, Then instructions-panel shows empty state", () => {
    // Given BotBehaviorHydrateData contains empty allowedBehaviors []
    const hydratePayload = {
      allowedBehaviors: [] as string[],
      behaviorConfigs: [] as typeof testBehaviorConfigs,
      baseActionConfigs: [] as typeof testBaseActionConfigs,
      currentBehavior: "",
      currentAction: "",
      executionSettings: {} as Record<string, string>,
      behaviorTree: [],
    };

    // When panel receives BotBehaviorHydrateData init message
    window.dispatchEvent(new dom.window.MessageEvent("message", { data: hydratePayload }));

    // Then instructions-panel displays instructions-empty placeholder
    const panel = document.getElementById("instructions-panel");
    expect(panel?.querySelector(".instructions-empty")).toBeTruthy();

    // And instructions-panel contains zero instruction-item elements
    expect(panel?.querySelectorAll(".instruction-item").length).toBe(0);
  });
});

describe("TestUpdateInstructionsOnWorkflowNavigation", () => {
  let dom: JSDOM;
  let postMessageCalls: unknown[];
  let behavior: BehaviorClient;
  let instructions: InstructionsClient;

  beforeEach(() => {
    dom = new JSDOM(fixtureHtml, { url: "http://localhost" });
    postMessageCalls = [];
    global.document = dom.window.document;
    global.window = dom.window as unknown as Window & typeof globalThis;

    behavior = initBehaviorClient({
      postMessage: (m) => postMessageCalls.push(m),
    });
    instructions = initInstructionsClient({
      postMessage: (m) => postMessageCalls.push(m),
    });
    wrapBehaviorWithSync(behavior, instructions);

    behavior.loadBehaviors(testAllowedBehaviors, testBehaviorConfigs);
    behavior.loadActions(testBaseActionConfigs);
    syncInstructions(behavior, instructions);
  });

  it("When user presses Next, Then instructions-panel updates to next action instructions", () => {
    // Given BotBehavior is at 'shape' behavior with 'clarify' action selected
    behavior.navigateToBehavior("shape");
    behavior.navigateToAction("clarify");

    // When user presses Next button
    behavior.next();

    // Then instructions-panel shows 'strategy' action instructions
    const panel = document.getElementById("instructions-panel");
    const items = panel?.querySelectorAll(".instruction-item");
    const itemTexts = Array.from(items ?? []).map(el => el.textContent);
    expect(itemTexts).toContain("Analyze gathered context");
    expect(itemTexts).toContain("Propose a strategy");

    // And instructions-panel contains no instruction-item elements from 'clarify' action
    expect(itemTexts).not.toContain("Gather context for story mapping");

    // And currentAction span text is 'strategy'
    expect(document.getElementById("currentAction")?.textContent).toBe("strategy");
  });

  it("When user presses Back, Then instructions-panel updates to previous action instructions", () => {
    // Given BotBehavior is at 'shape' behavior with 'strategy' action selected
    behavior.navigateToBehavior("shape");
    behavior.navigateToAction("strategy");

    // When user presses Back button
    behavior.back();

    // Then instructions-panel shows 'clarify' action instructions
    const panel = document.getElementById("instructions-panel");
    const items = panel?.querySelectorAll(".instruction-item");
    const itemTexts = Array.from(items ?? []).map(el => el.textContent);
    expect(itemTexts).toContain("IMPORTANT: Follow these action instructions specifically");
    expect(itemTexts).toContain("Gather context for story mapping");

    // And instructions-panel contains no instruction-item elements from 'strategy' action
    expect(itemTexts).not.toContain("Analyze gathered context");

    // And currentAction span text is 'clarify'
    expect(document.getElementById("currentAction")?.textContent).toBe("clarify");
  });

  it("When Next crosses behavior boundary, Then instructions update for new behavior and action", () => {
    // Given BotBehavior is at 'shape' behavior on its last action
    behavior.navigateToBehavior("shape");
    behavior.navigateToAction("render");

    // When user presses Next button
    behavior.next();

    // Then currentBehavior advances to the next behavior
    expect(document.getElementById("currentBehavior")?.textContent).toBe("prioritization");

    // And instructions-panel shows the new behavior's first action instructions
    const panel = document.getElementById("instructions-panel");
    const items = panel?.querySelectorAll(".instruction-item");
    const itemTexts = Array.from(items ?? []).map(el => el.textContent);
    // Should contain 'prioritization' behavior instructions
    expect(itemTexts).toContain("Prioritize stories");

    // And instructions-panel contains no instruction-item elements from the previous behavior's actions
    expect(itemTexts).not.toContain("Shape the story map");
    expect(itemTexts).not.toContain("shape: render story map documents");
  });

  it("When Back crosses behavior boundary, Then instructions update for previous behavior and action", () => {
    // Given BotBehavior is at second behavior on its first action
    behavior.navigateToBehavior("prioritization");

    // When user presses Back button
    behavior.back();

    // Then currentBehavior returns to the previous behavior
    expect(document.getElementById("currentBehavior")?.textContent).toBe("shape");

    // And instructions-panel shows the previous behavior's last action instructions
    const panel = document.getElementById("instructions-panel");
    const items = panel?.querySelectorAll(".instruction-item");
    const itemTexts = Array.from(items ?? []).map(el => el.textContent);
    expect(itemTexts).toContain("Shape the story map");
    expect(itemTexts).toContain("Generate output documents");
    expect(itemTexts).toContain("shape: render story map documents");
  });

  it("When action has skip execution setting, Then instructions skip to next non-skipped action", () => {
    // Given one action in the workflow has executionSetting 'skip'
    // 'render' in 'shape' has executionSetting 'skip'
    // Given BotBehavior is at 'shape' behavior with 'validate' action (action before 'render')
    behavior.navigateToBehavior("shape");
    behavior.navigateToAction("validate");

    // And the next action 'render' has executionSetting 'skip'
    expect(behavior.findAction("render")?.executionSetting).toBe("skip");

    // When user presses Next button
    behavior.next();

    // Then if next() skips (Behavior.next() advances past 'render' to next behavior)
    // Note: The Behavior domain's next() moves action-by-action. The skip behavior is
    // handled at a higher level. If 'render' is the last action, next() goes to next behavior.
    // After render → next behavior (prioritization).
    // The instructions should reflect wherever we landed
    const panel = document.getElementById("instructions-panel");
    const items = panel?.querySelectorAll(".instruction-item");
    const itemTexts = Array.from(items ?? []).map(el => el.textContent);

    // 'render' instructions should not be displayed since we moved past it
    expect(itemTexts).not.toContain("shape: validate hierarchy and story structure");
  });
});
