// test/context_folder/context_folder_test.ts
import { describe, it, expect } from "vitest";
import { ContextFolder } from "../../src/context_folder/context_folder.js";
import type { IContextFolder } from "../../src/context_folder/context_folder.js";

/**
 * Base test class using Template Method pattern.
 *
 * Defines shared test scenarios in registerTests(); subclasses override:
 * - createContextFolder() — returns the context folder under test (domain, server, CLI wrapper, etc.)
 * - assertFolderPath() — adds layer-specific assertions (persistence, DOM, postMessage)
 * - assertBotName() — adds layer-specific assertions for bot info
 *
 * Arrow functions in it() preserve `this` binding when Vitest invokes callbacks.
 */
export abstract class ContextFolderTest {
  /** Default assertion: verify contextFolder.folderPath equals expected. Subclasses extend. */
  protected assertFolderPath(contextFolder: IContextFolder, expected: string): void {
    expect(contextFolder.folderPath).toBe(expected);
  }

  /** Default assertion: verify contextFolder.botInfo.name equals expected. Subclasses extend. */
  protected assertBotName(contextFolder: IContextFolder, expected: string): void {
    expect(contextFolder.botInfo.name).toBe(expected);
  }

  /** Abstract: subclasses return the context folder under test for this layer. */
  protected abstract createContextFolder(): IContextFolder;

  /**
   * Register all shared test scenarios with Vitest.
   * Call inside a describe() block: `new MyContextFolderTest().registerTests()`
   */
  registerTests(): void {
    describe("Given the context folder is opened", () => {
      it("Then it starts with an empty path", () => {
        const cf = this.createContextFolder();
        this.assertFolderPath(cf, "");
      });

      describe("When I set the folder path", () => {
        it("Then the folder path is updated", () => {
          const cf = this.createContextFolder();
          cf.updatePath("/projects/my-app");
          this.assertFolderPath(cf, "/projects/my-app");
        });
      });

      describe("When I switch the bot", () => {
        it("Then the bot name is updated", () => {
          const cf = this.createContextFolder();
          cf.hydrate?.({ availableBots: ["story_bot", "crc_bot"] });
          cf.switchBot("story_bot");
          this.assertBotName(cf, "story_bot");
        });
      });

      describe("When I reset the context folder", () => {
        it("Then state is cleared", () => {
          const cf = this.createContextFolder();
          cf.updatePath("/projects/my-app");
          cf.switchBot("story_bot");
          cf.reset();
          this.assertFolderPath(cf, "");
          this.assertBotName(cf, "");
        });
      });

      describe("When I hydrate the context folder", () => {
        it("Then all state is restored", () => {
          const cf = this.createContextFolder();
          cf.hydrate?.({
            folderPath: "/restored/path",
            botName: "crc_bot",
            botDirectory: "/bots/crc_bot",
            availableBots: ["story_bot", "crc_bot"],
          });
          this.assertFolderPath(cf, "/restored/path");
          this.assertBotName(cf, "crc_bot");
          expect(cf.botInfo.directory).toBe("/bots/crc_bot");
          expect(cf.availableBots).toEqual(["story_bot", "crc_bot"]);
        });
      });
    });
  }
}
