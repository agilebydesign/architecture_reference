// test/test_data/behavior_fixtures.ts — Shared fixture data for behavior tests
// Used by both behavior_test.ts (unit/integration) and behavior_webview.e2e.ts (e2e).
import type { IBehaviorConfig, IBaseActionConfig, IActionConfig } from "../../src/behavior/behavior";

export const testBehaviorConfigs: IBehaviorConfig[] = [
  {
    name: "shape",
    order: 1,
    description: "Create a story map that captures the user's journey",
    goal: "Shape story map from user context",
    inputs: "User context, interviews, vision documents",
    outputs: "story-graph.json, story-map.md",
    instructions: ["Shape the story map"],
    actionsWorkflow: [
      { name: "clarify", order: 1, nextAction: "strategy", instructions: ["Gather context for story mapping"], executionSetting: "manual" },
      { name: "strategy", order: 2, nextAction: "build", instructions: [], executionSetting: "manual" },
      { name: "build", order: 3, nextAction: "validate", instructions: ["shape: build story map structure"], executionSetting: "manual" },
      { name: "validate", order: 4, nextAction: "render", instructions: ["shape: validate hierarchy and story structure"], executionSetting: "manual" },
      { name: "render", order: 5, nextAction: null, instructions: ["shape: render story map documents"], executionSetting: "skip" },
    ],
  },
  {
    name: "prioritization",
    order: 2,
    description: "Prioritize stories and capabilities",
    goal: "Order stories by value and effort",
    inputs: "Story map, business context",
    outputs: "Prioritized backlog",
    instructions: ["Prioritize stories"],
    actionsWorkflow: [
      { name: "clarify", order: 1, nextAction: "strategy", instructions: ["Gather prioritization context"], executionSetting: "manual" },
      { name: "strategy", order: 2, nextAction: "build", instructions: [], executionSetting: "manual" },
      { name: "build", order: 3, nextAction: "validate", instructions: ["Build prioritized list"], executionSetting: "manual" },
      { name: "validate", order: 4, nextAction: "render", instructions: ["Validate priority order"], executionSetting: "manual" },
      { name: "render", order: 5, nextAction: null, instructions: ["Render prioritization output"], executionSetting: "skip" },
    ],
  },
  {
    name: "exploration",
    order: 3,
    description: "Explore domain and gather context",
    goal: "Understand the problem space",
    inputs: "Domain documents, stakeholder input",
    outputs: "Context summary",
    instructions: ["Explore the domain"],
    actionsWorkflow: [
      { name: "clarify", order: 1, nextAction: "strategy", instructions: ["Gather exploration context"], executionSetting: "manual" },
      { name: "strategy", order: 2, nextAction: "build", instructions: [], executionSetting: "manual" },
      { name: "build", order: 3, nextAction: "validate", instructions: ["Build exploration summary"], executionSetting: "manual" },
      { name: "validate", order: 4, nextAction: "render", instructions: ["Validate exploration output"], executionSetting: "manual" },
      { name: "render", order: 5, nextAction: null, instructions: ["Render exploration documents"], executionSetting: "skip" },
    ],
  },
];

export const testAllowedBehaviors = ["shape", "prioritization", "exploration"];

export const testBaseActionConfigs: IBaseActionConfig[] = [
  { name: "clarify", description: "Gather context by asking questions", instructions: ["IMPORTANT: Follow these action instructions specifically", "Review all provided context"] },
  { name: "strategy", description: "Decide approach based on gathered context", instructions: ["Analyze gathered context", "Propose a strategy"] },
  { name: "build", description: "Build the artifact", instructions: ["Build the primary artifact"] },
  { name: "validate", description: "Validate the artifact", instructions: ["Review the artifact for correctness"] },
  { name: "render", description: "Render the output documents", instructions: ["Generate output documents"] },
];

/**
 * Pre-computed persistence fixture: the execution state BehaviorServer._save() would produce.
 * Used by e2e tests to seed persistence/behavior.json before opening the webview.
 */
export const testPersistenceFixture = {
  currentBehavior: "shape",
  currentAction: "clarify",
  executionSettings: {} as Record<string, string>,
};
