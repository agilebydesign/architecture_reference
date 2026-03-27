// e2e/adapters/webview_context_folder_adapter.ts — IContextFolder implementation via WebView DOM
import { browser, $} from "@wdio/globals";
import type { WebView } from "wdio-vscode-service";
import type { IContextFolder, IBotInfo, ContextFolderHydrateData } from "../../../src/context_folder/context_folder";
import { contextFolderLocators } from "../pageobjects/locators";

/**
 * Wraps WebView DOM as IContextFolder for E2E Template Method tests.
 * All interactions are async (wdio calls return Promises).
 *
 * Methods delegate to WebView DOM elements:
 * - updatePath(dir) → set #folderPath input value, trigger change event
 * - getFolderPathAsync() → read #folderPath input value
 * - getBotNameAsync() → read #botName element text
 * - getBotDirectoryAsync() → read #botDirectory element text
 */
export class WebViewContextFolderAdapter implements IContextFolder {
  constructor(private readonly webview: WebView) {}

  /**
   * Update path by setting the folder path input and triggering change event.
   * The context_folder_client.ts listens for "change" on #folderPath.
   */
  async updatePath(directory: string): Promise<void> {
    const folderPathInput = await $(contextFolderLocators.folderPath);
    await folderPathInput.setValue(directory);
    await browser.keys("Enter");
  }

  /**
   * switchBot — not directly testable via DOM (requires server-side availableBots).
   * E2E tests that need this should use a different approach.
   */
  switchBot(_name: string): void {
    throw new Error("Use switchBotAsync() for E2E tests");
  }

  /**
   * Reset — no reset button in current template. No-op for E2E.
   */
  reset(): void {
    throw new Error("reset() not available in E2E — no reset button in template");
  }

  /**
   * Sync getter throws — use getFolderPathAsync() instead.
   */
  get folderPath(): string {
    throw new Error("Use getFolderPathAsync() for E2E tests - wdio is async");
  }

  /**
   * Async getter for folder path value from webview DOM.
   */
  async getFolderPathAsync(): Promise<string> {
    const folderPathInput = await $(contextFolderLocators.folderPath);
    return await folderPathInput.getValue();
  }

  /**
   * botInfo property — sync access throws; use async helpers.
   */
  get botInfo(): IBotInfo {
    return {
      get name(): string {
        throw new Error("Use getBotNameAsync() for E2E tests");
      },
      set name(_val: string) {
        throw new Error("Use setBotNameAsync() for E2E tests");
      },
      get directory(): string {
        throw new Error("Use getBotDirectoryAsync() for E2E tests");
      },
      set directory(_val: string) {
        throw new Error("Use setBotDirectoryAsync() for E2E tests");
      },
    };
  }

  /**
   * Async getter for bot name from webview DOM.
   */
  async getBotNameAsync(): Promise<string> {
    const botNameEl = await $(contextFolderLocators.botName);
    return await botNameEl.getText();
  }

  /**
   * Async getter for bot directory from webview DOM.
   */
  async getBotDirectoryAsync(): Promise<string> {
    const botDirectoryEl = await $(contextFolderLocators.botDirectory);
    return await botDirectoryEl.getText();
  }

  get availableBots(): string[] {
    throw new Error("availableBots not accessible from E2E DOM");
  }

  /**
   * Hydrate — no-op for E2E (state comes from DOM).
   */
  hydrate(_data?: ContextFolderHydrateData): void {
    // No-op for E2E
  }
}
