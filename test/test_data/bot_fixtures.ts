// test/test_data/bot_fixtures.ts — Shared fixture data for bot tests
import type { IBotConfig } from "../../src/bot/bot";
import { testBehaviorConfigs, testBaseActionConfigs, testAllowedBehaviors } from "./behavior_fixtures";

export const testStoryBotConfig: IBotConfig = {
  name: "story_bot",
  description: "Create story maps and specifications",
  goal: "Transform domain understanding into executable stories",
  instructions: ["Create a story map that captures the user's journey through epics, sub-epics, and stories"],
  behaviorNames: testAllowedBehaviors,
  baseActionsPath: "base_actions",
  behaviorConfigs: testBehaviorConfigs,
  baseActionConfigs: testBaseActionConfigs,
};

export const testBotConfigs: IBotConfig[] = [testStoryBotConfig];

export const testPersistenceFixture = {
  currentBot: "story_bot",
};
