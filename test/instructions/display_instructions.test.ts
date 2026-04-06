// test/bot_behavior/test_display_instructions.ts
import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { JSDOM } from "jsdom";
import { initBotBehaviorClient } from "../../src/bot_behavior/view/bot_behavior_client.js";
import type { IBotBehavior } from "../../src/bot_behavior/bot_behavior.js";
import { testBehaviorConfigs, testAllowedBehaviors, testBaseActionConfigs } from "../test_data/bot_behavior_fixtures.js";

// Load actual BotBehavior.html and replace template variables with defaults
const botBehaviorHtmlPath = resolve(__dirname, "../../src/bot_behavior/view/BotBehavior.html");
const botBehaviorHtmlRaw = readFileSync(botBehaviorHtmlPath, "utf-8");
const fixtureHtml = `<!DOCTYPE html><html><body>${botBehaviorHtmlRaw
  .replace("{{botBehaviorCssUri}}", "")
  .replace("{{currentBehavior}}", "")
  .replace("{{currentAction}}", "")
  .replace("{{behaviorTreeHtml}}", "")}</body></html>`;

describe("TestDisplaySelectedBehaviorInstructions", () => {
  let dom: JSDOM;
  let postMessageCalls: unknown[];
  let botBehavior: IBotBehavior;

  beforeEach(() => {
    dom = new JSDOM(fixtureHtml, { url: "http://localhost" });
    postMessageCalls = [];
    global.document = dom.window.document;
    global.window = dom.window as unknown as Window & typeof globalThis;

    botBehavior = initBotBehaviorClient({
      postMessage: (m) => postMessageCalls.push(m),
    });
    botBehavior.loadBehaviors(testAllowedBehaviors, testBehaviorConfigs);
    botBehavior.loadActions(testBaseActionConfigs);
  });

  it("test_bot_behavior_renders_and_completes_behavior_instructions_display_when_user_selects_behavior", () => {
    // Given BotBehavior has 'shape' behavior loaded with instructions ['Shape the story map']
    // (shape is the first behavior and is already selected after loadBehaviors)
    expect(testBehaviorConfigs.find(b => b.name === "shape")?.instructions).toEqual(["Shape the story map"]);

    // When user selects 'shape' behavior in behavior tree
    botBehavior.navigateToBehavior("shape");

    // Then instructions-panel contains one instruction-item element
    const panel = document.getElementById("instructions-panel");
    const items = panel?.querySelectorAll(".instruction-item");
    expect(items?.length).toBe(1);

    // And instruction-item text is 'Shape the story map'
    expect(items?.[0].textContent).toBe("Shape the story map");

    // And currentBehavior span text is 'shape'
    expect(document.getElementById("currentBehavior")?.textContent).toBe("shape");
  });

  it("test_bot_behavior_shows_empty_state_when_selected_behavior_has_no_instructions", () => {
    // Given BotBehavior has 'empty-behavior' behavior loaded with instructions []
    botBehavior.loadBehaviors(
      ["empty-behavior"],
      [{ name: "empty-behavior", order: 1, description: "", goal: "", inputs: "", outputs: "", instructions: [], actionsWorkflow: [] }]
    );

    // When user selects 'empty-behavior' behavior in behavior tree
    botBehavior.navigateToBehavior("empty-behavior");

    // Then instructions-panel contains instructions-empty placeholder
    const panel = document.getElementById("instructions-panel");
    expect(panel?.querySelector(".instructions-empty")).toBeTruthy();

    // And instructions-panel contains zero instruction-item elements
    expect(panel?.querySelectorAll(".instruction-item").length).toBe(0);
  });

  it("test_bot_behavior_replaces_prior_behavior_instructions_when_user_selects_different_behavior", () => {
    // Given BotBehavior has 'shape' and 'prioritization' behaviors loaded
    // And 'shape' behavior is currently selected showing its instructions
    botBehavior.navigateToBehavior("shape");
    const panelAfterShape = document.getElementById("instructions-panel");
    expect(panelAfterShape?.querySelectorAll(".instruction-item").length).toBeGreaterThan(0);

    // When user selects 'prioritization' behavior in behavior tree
    botBehavior.navigateToBehavior("prioritization");

    // Then instructions-panel contains instruction-item elements for 'prioritization' instructions
    const panel = document.getElementById("instructions-panel");
    const items = panel?.querySelectorAll(".instruction-item");
    const prioritizationInstructions = testBehaviorConfigs.find(b => b.name === "prioritization")?.instructions ?? [];
    expect(items?.length).toBe(prioritizationInstructions.length);

    // And instructions-panel contains no instruction-item elements from 'shape' instructions
    const shapeInstructions = testBehaviorConfigs.find(b => b.name === "shape")?.instructions ?? [];
    const itemTexts = Array.from(items ?? []).map(el => el.textContent);
    shapeInstructions.forEach(instruction => {
      expect(itemTexts).not.toContain(instruction);
    });
  });

  it("test_bot_behavior_populates_instructions_panel_from_hydrate_data_on_panel_init", () => {
    // Given BotBehaviorHydrateData contains allowedBehaviors ['shape'] and behaviorConfigs with 'shape' having instructions ['Shape the story map']
    // When panel receives BotBehaviorHydrateData init message
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

    // Then instructions-panel contains one instruction-item with text 'Shape the story map'
    const panel = document.getElementById("instructions-panel");
    const items = panel?.querySelectorAll(".instruction-item");
    expect(items?.length).toBe(1);
    expect(items?.[0].textContent).toBe("Shape the story map");

    // And currentBehavior span text is 'shape'
    expect(document.getElementById("currentBehavior")?.textContent).toBe("shape");
  });

  it("test_bot_behavior_displays_multiple_behavior_instructions_in_config_order", () => {
    // Given BotBehavior has 'multi-behavior' behavior loaded with instructions ['First instruction', 'Second instruction', 'Third instruction']
    botBehavior.loadBehaviors(
      ["multi-behavior"],
      [{ name: "multi-behavior", order: 1, description: "", goal: "", inputs: "", outputs: "", instructions: ["First instruction", "Second instruction", "Third instruction"], actionsWorkflow: [] }]
    );

    // When user selects 'multi-behavior' behavior in behavior tree
    botBehavior.navigateToBehavior("multi-behavior");

    // Then instructions-panel contains three instruction-item elements
    const panel = document.getElementById("instructions-panel");
    const items = panel?.querySelectorAll(".instruction-item");
    expect(items?.length).toBe(3);

    // And first instruction-item text is 'First instruction'
    expect(items?.[0].textContent).toBe("First instruction");

    // And second instruction-item text is 'Second instruction'
    expect(items?.[1].textContent).toBe("Second instruction");

    // And third instruction-item text is 'Third instruction'
    expect(items?.[2].textContent).toBe("Third instruction");
  });
});

describe("TestDisplaySelectedActionInstructions", () => {
  let dom: JSDOM;
  let postMessageCalls: unknown[];
  let botBehavior: IBotBehavior;

  beforeEach(() => {
    dom = new JSDOM(fixtureHtml, { url: "http://localhost" });
    postMessageCalls = [];
    global.document = dom.window.document;
    global.window = dom.window as unknown as Window & typeof globalThis;

    botBehavior = initBotBehaviorClient({
      postMessage: (m) => postMessageCalls.push(m),
    });
    botBehavior.loadBehaviors(testAllowedBehaviors, testBehaviorConfigs);
    botBehavior.loadActions(testBaseActionConfigs);
  });

  it("test_bot_behavior_renders_and_completes_merged_action_instructions_display_when_user_selects_action", () => {
    // Given BotBehavior has 'shape' behavior with 'clarify' action loaded
    // And 'clarify' action has merged instructions from IBaseActionConfig and IBehaviorConfig workflow entry
    botBehavior.navigateToBehavior("shape");

    // When user selects 'clarify' action in behavior tree
    botBehavior.navigateToAction("clarify");

    // Then instructions-panel contains instruction-item elements for each merged instruction
    const panel = document.getElementById("instructions-panel");
    const items = panel?.querySelectorAll(".instruction-item");
    expect((items?.length ?? 0)).toBeGreaterThan(0);

    // And instruction-item elements appear in merged order: base instructions first, then behavior-specific
    // clarify base: ['IMPORTANT: Follow these action instructions specifically', 'Review all provided context']
    // clarify behavior-specific: ['Gather context for story mapping']
    expect(items?.[0].textContent).toBe("IMPORTANT: Follow these action instructions specifically");
    expect(items?.[1].textContent).toBe("Review all provided context");
    expect(items?.[2].textContent).toBe("Gather context for story mapping");

    // And currentAction span text is 'clarify'
    expect(document.getElementById("currentAction")?.textContent).toBe("clarify");
  });

  it("test_bot_behavior_shows_empty_state_when_selected_action_has_no_merged_instructions", () => {
    // Given BotBehavior has 'shape' behavior with an action that has empty base instructions and empty behavior instructions
    // 'strategy' action in 'shape' has instructions: [] in actionsWorkflow, and strategy base has no-empty instructions
    // Use a custom config with truly empty instructions on both sides
    botBehavior.loadBehaviors(
      ["empty-behavior"],
      [{ name: "empty-behavior", order: 1, description: "", goal: "", inputs: "", outputs: "", instructions: [], actionsWorkflow: [
        { name: "empty-action", order: 1, nextAction: null, instructions: [], executionSetting: "manual" }
      ]}]
    );
    botBehavior.loadActions([
      { name: "empty-action", description: "", instructions: [] }
    ]);

    botBehavior.navigateToBehavior("empty-behavior");

    // When user selects that action in behavior tree
    botBehavior.navigateToAction("empty-action");

    // Then instructions-panel contains instructions-empty placeholder
    const panel = document.getElementById("instructions-panel");
    expect(panel?.querySelector(".instructions-empty")).toBeTruthy();

    // And instructions-panel contains zero instruction-item elements
    expect(panel?.querySelectorAll(".instruction-item").length).toBe(0);
  });

  it("test_bot_behavior_replaces_prior_action_instructions_when_user_navigates_to_different_action", () => {
    // Given BotBehavior is at 'shape' behavior with 'clarify' action selected showing its instructions
    botBehavior.navigateToBehavior("shape");
    botBehavior.navigateToAction("clarify");

    const panelAfterClarify = document.getElementById("instructions-panel");
    expect((panelAfterClarify?.querySelectorAll(".instruction-item").length ?? 0)).toBeGreaterThan(0);

    // When user presses Next button to advance to 'strategy' action
    botBehavior.next();

    // Then instructions-panel contains instruction-item elements for 'strategy' action instructions
    // 'strategy' base: ['Analyze gathered context', 'Propose a strategy'], behavior-specific: []
    const panel = document.getElementById("instructions-panel");
    const items = panel?.querySelectorAll(".instruction-item");
    expect(items?.[0].textContent).toBe("Analyze gathered context");
    expect(items?.[1].textContent).toBe("Propose a strategy");

    // And instructions-panel contains no instruction-item elements from 'clarify' action
    const itemTexts = Array.from(items ?? []).map(el => el.textContent);
    expect(itemTexts).not.toContain("IMPORTANT: Follow these action instructions specifically");
    expect(itemTexts).not.toContain("Gather context for story mapping");

    // And currentAction span text is 'strategy'
    expect(document.getElementById("currentAction")?.textContent).toBe("strategy");
  });

  it("test_bot_behavior_shows_base_instructions_first_then_behavior_specific_instructions_in_merged_order", () => {
    // Given BotBehavior has 'shape' behavior with 'clarify' action
    // And IBaseActionConfig for 'clarify' has instructions ['IMPORTANT: Follow these action instructions specifically', 'Review all provided context']
    // And 'shape' behavior workflow entry for 'clarify' has instructions ['Gather context for story mapping']
    botBehavior.navigateToBehavior("shape");

    // When user selects 'clarify' action in behavior tree
    botBehavior.navigateToAction("clarify");

    // Then first instruction-item text is 'IMPORTANT: Follow these action instructions specifically'
    const panel = document.getElementById("instructions-panel");
    const items = panel?.querySelectorAll(".instruction-item");
    expect(items?.[0].textContent).toBe("IMPORTANT: Follow these action instructions specifically");

    // And second instruction-item text is 'Review all provided context'
    expect(items?.[1].textContent).toBe("Review all provided context");

    // And third instruction-item text is 'Gather context for story mapping'
    expect(items?.[2].textContent).toBe("Gather context for story mapping");

    // And instructions-panel contains exactly three instruction-item elements
    expect(items?.length).toBe(3);
  });

  it("test_bot_behavior_populates_action_instructions_from_hydrate_data_on_panel_init", () => {
    // Given BotBehaviorHydrateData contains allowedBehaviors, behaviorConfigs with 'shape', and baseActionConfigs for 'clarify'
    // When panel receives BotBehaviorHydrateData init message
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
    // 'shape' behavior + 'clarify' action: base ['IMPORTANT...', 'Review all provided context'] + behavior-specific ['Gather context for story mapping']
    const panel = document.getElementById("instructions-panel");
    const items = panel?.querySelectorAll(".instruction-item");
    expect((items?.length ?? 0)).toBeGreaterThan(0);
    expect(items?.[0].textContent).toBe("IMPORTANT: Follow these action instructions specifically");

    // And currentAction span text matches the first action in 'shape' behavior workflow
    expect(document.getElementById("currentAction")?.textContent).toBe("clarify");
  });
});
