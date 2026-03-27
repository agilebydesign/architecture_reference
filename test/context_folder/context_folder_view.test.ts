// test/context_folder/context_folder_view.test.ts
import { describe, expect, beforeEach } from "vitest";
import * as path from "path";
import { ContextFolderView } from "../../src/context_folder/view/context_folder_view.js";
import { ContextFolder } from "../../src/context_folder/context_folder.js";
import { ContextFolderTest } from "./context_folder_test.js";
import type { IContextFolder } from "../../src/context_folder/context_folder.js";
import { Uri, createMockWebviewPanel } from "../__mocks__/vscode.js";
import type { WebviewPanel } from "../__mocks__/vscode.js";

describe("ContextFolderView", () => {
  let posted: unknown[];
  let mockPanel: WebviewPanel;
  // Point to project root so getHtml() can find templates
  const extensionUri = Uri.file(path.resolve(__dirname, "../.."));

  beforeEach(() => {
    posted = [];
    mockPanel = createMockWebviewPanel(posted);
  });

  class ContextFolderViewTest extends ContextFolderTest {
    private _view?: ContextFolderView;

    protected createContextFolder(): IContextFolder {
      const contextFolder = new ContextFolder();
      this._view = new ContextFolderView(
        mockPanel as unknown as import("vscode").WebviewPanel,
        contextFolder,
        extensionUri as unknown as import("vscode").Uri
      );
      return this._view;
    }

    protected override assertFolderPath(contextFolder: IContextFolder, expected: string): void {
      // First: standard domain assertion
      super.assertFolderPath(contextFolder, expected);

      // Server view adds: verify postMessage was called with folderPath
      if (posted.length > 0) {
        expect(posted).toContainEqual(expect.objectContaining({ folderPath: expected }));
      }

      // Verify the actual getHtml() renders the expected folderPath
      const html = this._view!.getHtml();
      expect(html).toContain(`value="${expected}"`);
    }

    protected override assertBotName(contextFolder: IContextFolder, expected: string): void {
      // First: standard domain assertion
      super.assertBotName(contextFolder, expected);

      // Server view adds: verify postMessage was called with botName
      if (posted.length > 0 && expected !== "") {
        expect(posted).toContainEqual(expect.objectContaining({ botName: expected }));
      }
    }
  }

  new ContextFolderViewTest().registerTests();
});
