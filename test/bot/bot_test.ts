// test/bot/bot_test.ts
import { describe, it, expect } from "vitest";
import type { IBot } from "../../src/bot/bot.js";
import { testStoryBotConfig } from "../test_data/bot_fixtures.js";
export { testStoryBotConfig } from "../test_data/bot_fixtures.js";

/**
 * Base test class using Template Method pattern.
 *
 * Defines shared test scenarios in registerTests(); subclasses override:
 * - createBot() — returns the bot under test (domain, server, CLI wrapper, etc.)
 * - assertBotName() — adds layer-specific assertions (persistence, DOM, postMessage)
 * - assertBehaviorNames() — adds layer-specific assertions
 *
 * Arrow functions in it() preserve `this` binding when Vitest invokes callbacks.
 */
export abstract class BotTest {
  /** Default assertion: verify bot.name equals expected. Subclasses extend. */
  protected assertBotName(bot: IBot, expected: string): void {
    expect(bot.name).toBe(expected);
  }

  /** Default assertion: verify bot.behaviorNames equals expected. Subclasses extend. */
  protected assertBehaviorNames(bot: IBot, expected: string[]): void {
    expect(bot.behaviorNames).toEqual(expected);
  }

  /** Abstract: subclasses return the bot under test for this layer. */
  protected abstract createBot(): IBot;

  /** Helper: create a Bot loaded with test configs. */
  protected loadedBot(): IBot {
    const bot = this.createBot();
    bot.registerBot(testStoryBotConfig);
    bot.switchBot("story_bot");
    return bot;
  }

  /**
   * Register all shared test scenarios with Vitest.
   * Call inside a describe() block: `new MyBotTest().registerTests()`
   */
  registerTests(): void {
    describe("Given a bot is initialized", () => {
      it("Then it starts with no selected bot", () => {
        const bot = this.createBot();
        this.assertBotName(bot, "");
      });

      it("Then it starts with no available bots", () => {
        const bot = this.createBot();
        expect(bot.availableBots).toEqual([]);
      });

      it("Then it starts with empty behavior names", () => {
        const bot = this.createBot();
        this.assertBehaviorNames(bot, []);
      });
    });

    describe("Given bot configs are registered", () => {
      it("When I register a bot config, Then it appears in availableBots", () => {
        const bot = this.createBot();
        bot.registerBot(testStoryBotConfig);
        expect(bot.availableBots).toContain("story_bot");
      });

      it("When I switch to story_bot, Then the bot name is story_bot", () => {
        const bot = this.loadedBot();
        this.assertBotName(bot, "story_bot");
      });

      it("When I switch to story_bot, Then behavior names include story behaviors", () => {
        const bot = this.loadedBot();
        this.assertBehaviorNames(bot, ["shape", "prioritization", "exploration"]);
      });

      it("When I switch to story_bot, Then description is accessible", () => {
        const bot = this.loadedBot();
        expect(bot.description).toBe("Create story maps and specifications");
      });

      it("When I switch to story_bot, Then goal is accessible", () => {
        const bot = this.loadedBot();
        expect(bot.goal).toBe("Transform domain understanding into executable stories");
      });

      it("When I switch to story_bot, Then instructions are accessible", () => {
        const bot = this.loadedBot();
        expect(bot.instructions).toHaveLength(1);
        expect(bot.instructions[0]).toContain("story map");
      });

      it("When I switch to story_bot, Then currentBotConfig is the story_bot config", () => {
        const bot = this.loadedBot();
        expect(bot.currentBotConfig).not.toBeNull();
        expect(bot.currentBotConfig!.name).toBe("story_bot");
      });

      it("When I switch to an unknown bot, Then nothing changes", () => {
        const bot = this.loadedBot();
        bot.switchBot("nonexistent_bot");
        this.assertBotName(bot, "story_bot");
      });
    });

    describe("Given a bot is active", () => {
      it("When I reset the bot, Then state is cleared", () => {
        const bot = this.loadedBot();
        bot.reset();
        this.assertBotName(bot, "");
        expect(bot.availableBots).toEqual([]);
        this.assertBehaviorNames(bot, []);
        expect(bot.currentBotConfig).toBeNull();
      });

      it("When I hydrate the bot, Then all state is restored", () => {
        const bot = this.createBot();
        bot.hydrate?.({
          botConfigs: [testStoryBotConfig],
          currentBot: "story_bot",
        });
        this.assertBotName(bot, "story_bot");
        expect(bot.availableBots).toContain("story_bot");
        this.assertBehaviorNames(bot, ["shape", "prioritization", "exploration"]);
      });

      it("Then botConfigs returns all registered configs", () => {
        const bot = this.loadedBot();
        expect(bot.botConfigs).toHaveLength(1);
        expect(bot.botConfigs.map((c) => c.name)).toContain("story_bot");
      });
    });
  }
}
