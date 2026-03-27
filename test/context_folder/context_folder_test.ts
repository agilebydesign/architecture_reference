// test/context_folder/context_folder_test.ts
import { it, expect } from "vitest";
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
    it("starts with empty path", () => {
      const cf = this.createContextFolder();
      this.assertFolderPath(cf, "");
    });

    it("updatePath sets folder path", () => {
      const cf = this.createContextFolder();
      cf.updatePath("/projects/my-app");
      this.assertFolderPath(cf, "/projects/my-app");
    });

    it("switchBot sets bot name", () => {
      const cf = this.createContextFolder();
      cf.hydrate?.({ availableBots: ["story_bot", "crc_bot"] });
      cf.switchBot("story_bot");
      this.assertBotName(cf, "story_bot");
    });

    it("reset clears state", () => {
      const cf = this.createContextFolder();
      cf.updatePath("/projects/my-app");
      cf.switchBot("story_bot");
      cf.reset();
      this.assertFolderPath(cf, "");
      this.assertBotName(cf, "");
    });

    it("hydrate restores all state", () => {
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
  }
}
