// test/context_folder/context_folder_client.test.ts
import { describe, expect, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { JSDOM } from "jsdom";
import { ContextFolderTest } from "./context_folder_test.js";
import { initContextFolderClient, ContextFolderClient } from "../../src/context_folder/view/context_folder_client.js";
import type { IContextFolder } from "../../src/context_folder/context_folder.js";

// Load actual ContextFolder.html and replace template variables with defaults
const contextFolderHtmlPath = resolve(__dirname, "../../src/context_folder/view/ContextFolder.html");
const contextFolderHtmlRaw = readFileSync(contextFolderHtmlPath, "utf-8");
const fixtureHtml = `<!DOCTYPE html><html><body>${contextFolderHtmlRaw
  .replace("{{contextFolderCssUri}}", "")
  .replace("{{folderPath}}", "")
  .replace("{{botName}}", "")
  .replace("{{botDirectory}}", "")}</body></html>`;

describe("context_folder_client", () => {
  let postMessageCalls: unknown[];
  let dom: JSDOM;

  beforeEach(() => {
    dom = new JSDOM(fixtureHtml, { url: "http://localhost" });
    postMessageCalls = [];

    // Set up globals for the test
    global.document = dom.window.document;
    global.window = dom.window as unknown as Window & typeof globalThis;
  });

  class ContextFolderClientTest extends ContextFolderTest {
    protected createContextFolder(): IContextFolder {
      return initContextFolderClient({
        postMessage: (m) => postMessageCalls.push(m),
      });
    }

    protected override assertFolderPath(contextFolder: IContextFolder, expected: string): void {
      // First: standard domain assertion
      super.assertFolderPath(contextFolder, expected);

      // Client view adds: verify DOM element has correct value
      const folderPathInput = document.getElementById("folderPath") as HTMLInputElement;
      expect(folderPathInput?.value).toBe(expected);
    }

    protected override assertBotName(contextFolder: IContextFolder, expected: string): void {
      // First: standard domain assertion
      super.assertBotName(contextFolder, expected);

      // Client view adds: verify DOM element has correct text
      const botNameEl = document.getElementById("botName");
      expect(botNameEl?.textContent).toBe(expected);
    }
  }

  new ContextFolderClientTest().registerTests();
});
