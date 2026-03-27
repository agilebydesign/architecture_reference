// context_folder/view/context_folder_view.ts — Server view: implements IContextFolder, delegates to domain, posts to webview
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { BaseView } from "../../engine/base_view";
import type { IContextFolder, IBotInfo } from "../context_folder";

export class ContextFolderView extends BaseView implements IContextFolder {
  /** Raw template HTML. View loads and stores; tests use for DOM fixtures. Single source of truth. */
  static get template(): string {
    if (!(ContextFolderView as { _template?: string })._template) {
      const p = path.join(__dirname, "ContextFolder.html");
      (ContextFolderView as { _template?: string })._template = fs.readFileSync(
        p,
        "utf8"
      );
    }
    return (ContextFolderView as { _template?: string })._template!;
  }

  private _panel: vscode.WebviewPanel;
  private _contextFolder: IContextFolder;
  botInfo: IBotInfo;

  constructor(
    panel: vscode.WebviewPanel,
    contextFolder: IContextFolder,
    extensionUri: vscode.Uri
  ) {
    super(extensionUri);
    this._panel = panel;
    this._contextFolder = contextFolder;

    const v = this;
    this.botInfo = {
      get name(): string {
        return v._contextFolder.botInfo.name;
      },
      set name(val: string) {
        v._contextFolder.botInfo.name = val;
        v._panel.webview.postMessage({ botName: val });
      },
      get directory(): string {
        return v._contextFolder.botInfo.directory;
      },
      set directory(val: string) {
        v._contextFolder.botInfo.directory = val;
        v._panel.webview.postMessage({ botDirectory: val });
      },
    };
  }

  get folderPath(): string {
    return this._contextFolder.folderPath;
  }

  get availableBots(): string[] {
    return this._contextFolder.availableBots;
  }

  getHtml(): string {
    const contextFolderCssUri = this._panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "dist", "context_folder", "view", "context_folder.css")
    );
    return this.renderTemplate("dist/context_folder/view/ContextFolder.html", {
      folderPath: this._contextFolder.folderPath,
      botName: this._contextFolder.botInfo?.name ?? "",
      botDirectory: this._contextFolder.botInfo?.directory ?? "",
      contextFolderCssUri: contextFolderCssUri.toString(),
    });
  }

  updatePath(directory: string): void {
    this._contextFolder.updatePath(directory);
    this._panel.webview.postMessage({ folderPath: this._contextFolder.folderPath });
  }

  switchBot(name: string): void {
    this._contextFolder.switchBot(name);
    this._panel.webview.postMessage({
      botName: this._contextFolder.botInfo.name,
      botDirectory: this._contextFolder.botInfo.directory,
    });
  }

  reset(): void {
    this._contextFolder.reset();
    this._panel.webview.postMessage({
      folderPath: this._contextFolder.folderPath,
      botName: this._contextFolder.botInfo.name,
      botDirectory: this._contextFolder.botInfo.directory,
    });
  }

  async browse(): Promise<void> {
    const folders = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      openLabel: "Select Context Folder",
    });
    if (folders && folders.length > 0) {
      this.updatePath(folders[0].fsPath);
    }
  }

  hydrate(data: { folderPath?: string; botName?: string; botDirectory?: string; availableBots?: string[] }): void {
    this._contextFolder.hydrate?.(data);
  }

  /** HTML for test fixtures (placeholder defaults). Tests use this for JSDOM. */
  static getFixtureHtml(data?: { folderPath?: string; botName?: string; botDirectory?: string; contextFolderCssUri?: string }): string {
    const d = { folderPath: "", botName: "", botDirectory: "", contextFolderCssUri: "", ...data };
    let html = ContextFolderView.template;
    for (const [k, v] of Object.entries(d)) html = html.split(`{{${k}}}`).join(String(v));
    return html;
  }
}
