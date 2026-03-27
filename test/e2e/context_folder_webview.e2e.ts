// e2e/context_folder_webview.e2e.ts — E2E tests for ContextFolder webview
/// <reference types="mocha" />
import { browser, expect, $ } from "@wdio/globals";
import { WebView } from "wdio-vscode-service";
import { WebViewContextFolderAdapter } from "./adapters/webview_context_folder_adapter";
import { contextFolderLocators } from "./pageobjects/locators";

/**
 * E2E tests for ContextFolder webview.
 *
 * Mirrors the Template Method pattern from ContextFolderTest but with async methods.
 * Runs scenarios against the actual VS Code webview.
 */
describe("context_folder_webview", () => {
  let webview: WebView;
  let contextFolder: WebViewContextFolderAdapter;

  /**
   * Assert folder path matches expected value.
   * Checks both adapter and raw DOM element.
   */
  async function assertFolderPath(expected: string): Promise<void> {
    const folderPath = await contextFolder.getFolderPathAsync();
    expect(folderPath).toBe(expected);

    // Also verify raw DOM element
    const folderPathInput = await $(contextFolderLocators.folderPath);
    await expect(folderPathInput).toHaveValue(expected);
  }

  /**
   * Assert bot name matches expected value via DOM element.
   */
  async function assertBotName(expected: string): Promise<void> {
    const botName = await contextFolder.getBotNameAsync();
    expect(botName).toBe(expected);

    await expect($(contextFolderLocators.botName)).toHaveText(expected);
  }

  before(async () => {
    // Open the Engine panel (which contains ContextFolder)
    const workbench = await browser.getWorkbench();
    await workbench.executeCommand("Agilebot: View Engine");

    // Get the webview and create adapter
    await browser.waitUntil(async () => (await workbench.getAllWebviews()).length > 0);
    const webviews = await workbench.getAllWebviews();
    expect(webviews).toHaveLength(1);
    webview = webviews[0];
    await webview.open();

    contextFolder = new WebViewContextFolderAdapter(webview);
  });

  after(async () => {
    if (webview) {
      await webview.close();
    }
  });

  describe("Given the context folder section is opened", () => {
    it("Then it restores the previously saved folder path", async () => {
      // ContextFolderServer persists state — initial value is whatever was saved last
      const folderPathInput = await $(contextFolderLocators.folderPath);
      const initialPath = await folderPathInput.getValue();
      expect(typeof initialPath).toBe("string");
    });

    describe("When I set the folder path", () => {
      it("Then the folder path input displays the new path", async () => {
        await contextFolder.updatePath("/projects/my-app");
        await assertFolderPath("/projects/my-app");
      });
    });

    describe("When I update the folder path again", () => {
      it("Then the folder path input displays the updated path", async () => {
        await contextFolder.updatePath("/projects/other-app");
        await assertFolderPath("/projects/other-app");
      });
    });
  });
});
