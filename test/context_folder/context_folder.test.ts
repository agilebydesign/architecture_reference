// test/context_folder/context_folder.test.ts
import { describe, beforeEach, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { ContextFolder } from "../../src/context_folder/context_folder.js";
import { ContextFolderServer } from "../../src/context_folder/context_folder_server.js";
import { ContextFolderTest } from "./context_folder_test.js";
import type { IContextFolder } from "../../src/context_folder/context_folder.js";

/**
 * Domain layer tests.
 * createContextFolder() returns a plain ContextFolder — no persistence, no view.
 */
export class DomainContextFolderTest extends ContextFolderTest {
  protected createContextFolder(): IContextFolder {
    return new ContextFolder();
  }
}

describe("ContextFolder", () => {
  new DomainContextFolderTest().registerTests();
});

/**
 * Server domain tests.
 * Uses temp directory for persistence; assertFolderPath verifies file reload.
 */
describe("ContextFolderServer", () => {
  let tmpDir: string;
  let configPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "context-folder-"));
    configPath = path.join(tmpDir, "context_folder.json");
  });

  class ServerContextFolderTest extends ContextFolderTest {
    protected createContextFolder(): IContextFolder {
      return new ContextFolderServer(configPath);
    }

    protected override assertFolderPath(contextFolder: IContextFolder, expected: string): void {
      // First: standard domain assertion
      super.assertFolderPath(contextFolder, expected);

      // Server domain adds: verify persistence by reloading from file
      // Only check if config file exists (hydrate alone doesn't persist)
      if (fs.existsSync(configPath)) {
        const reloaded = new ContextFolderServer(configPath);
        expect(reloaded.folderPath).toBe(expected);
      }
    }

    protected override assertBotName(contextFolder: IContextFolder, expected: string): void {
      // First: standard domain assertion
      super.assertBotName(contextFolder, expected);

      // Server domain adds: verify persistence by reloading from file
      if (fs.existsSync(configPath)) {
        const reloaded = new ContextFolderServer(configPath);
        expect(reloaded.botInfo.name).toBe(expected);
      }
    }
  }

  new ServerContextFolderTest().registerTests();
});
