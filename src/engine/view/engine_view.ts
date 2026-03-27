// engine/view/engine_view.ts — Server view: owns Engine, delegates to sub-views, handles postMessage
import * as vscode from "vscode";
import * as path from "path";
import * as crypto from "crypto";
import { BaseView } from "../base_view";
import { Engine } from "../engine";
import { CounterServer } from "../../counter/counter_server";
import { CounterView } from "../../counter/view/counter_view";
import { ContextFolderServer } from "../../context_folder/context_folder_server";
import { ContextFolderView } from "../../context_folder/view/context_folder_view";

function getNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

export class EngineView extends BaseView {
  public static currentPanel: EngineView | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private _engine: Engine;
  public counter: CounterView;
  public contextFolder: ContextFolderView;
  private _disposables: vscode.Disposable[] = [];

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    super(extensionUri);
    this._panel = panel;

    const counterPath = path.join(extensionUri.fsPath, "counter.json");
    const contextFolderPath = path.join(extensionUri.fsPath, "context_folder.json");
    this._engine = new Engine(
      new CounterServer(counterPath),
      new ContextFolderServer(contextFolderPath)
    ); // server domain (persistence)
    this.counter = new CounterView(
      this._panel,
      this._engine.counter,
      extensionUri
    ); // server view
    this.contextFolder = new ContextFolderView(
      this._panel,
      this._engine.contextFolder,
      extensionUri
    ); // server view

    this._panel.webview.html = this._getHtml();

    this._panel.webview.onDidReceiveMessage(
      (message: { command: string; [key: string]: unknown }) => {
        this._handleMessage(message);
      },
      null,
      this._disposables
    );

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  private _handleMessage(message: { command: string; [key: string]: unknown }): void {
    const { command, ...args } = message;
    const [obj, key] = this._lookup(command);
    const target = (obj as Record<string, unknown>)[key];

    if (typeof target === "function") {
      (target as (...args: unknown[]) => unknown).apply(
        obj,
        Object.values(args)
      );
    } else if ("value" in args) {
      // Setter
      (obj as Record<string, unknown>)[key] = args.value;
    } else {
      // Getter — post the value back
      const value = (obj as Record<string, unknown>)[key];
      if (key === "total") {
        this._panel.webview.postMessage({ total: value });
      } else if (key === "bar") {
        this._panel.webview.postMessage({ fooBar: value });
      } else if (key === "folderPath") {
        this._panel.webview.postMessage({ folderPath: value });
      } else if (key === "name" && command.startsWith("contextFolder.")) {
        this._panel.webview.postMessage({ botName: value });
      }
    }
  }

  _lookup(pathStr: string): [object, string] {
    const parts = pathStr.split(".");
    let target: object = this;
    for (let i = 0; i < parts.length - 1; i++) {
      target = (target as Record<string, unknown>)[parts[i]] as object;
    }
    return [target, parts[parts.length - 1]];
  }

  private _getHtml(): string {
    const webview = this._panel.webview;
    const asUri = (p: string[]) =>
      webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "dist", ...p)); // TODO: will hardcoding dist work when the extension is bundled for publishing?
    const nonce = getNonce();
    const counterHtml = this.counter.getHtml(); // delegate; EngineView does not know counter markup
    const contextFolderHtml = this.contextFolder.getHtml();

    return this.renderTemplate("dist/engine/view/Engine.html", {
      nonce,
      content: contextFolderHtml + counterHtml,
      themeCssUri: asUri(["view", "theme.css"]).toString(),
      engineCssUri: asUri(["engine", "view", "layout.css"]).toString(),      
      counterClientUri: asUri(["counter", "view", "counter_client.js"]).toString(),
      contextFolderClientUri: asUri(["context_folder", "view", "context_folder_client.js"]).toString(),
      engineClientUri: asUri(["engine", "view", "engine_client.js"]).toString(),
    });
  }

  public static createOrShow(extensionUri: vscode.Uri): void {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (EngineView.currentPanel) {
      EngineView.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      "agilebot.engineView",
      "Engine View",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, "dist")],
      }
    );

    EngineView.currentPanel = new EngineView(panel, extensionUri);
  }

  public dispose(): void {
    EngineView.currentPanel = undefined;

    this._panel.dispose();

    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) {
        d.dispose();
      }
    }
  }
}
