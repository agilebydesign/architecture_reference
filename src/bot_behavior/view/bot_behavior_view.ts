// bot_behavior/view/bot_behavior_view.ts — Server view: implements IBotBehavior, delegates to domain, posts to webview
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { BaseView } from "../../engine/base_view";
import type { IBotBehavior, IBehaviorConfig, IActionConfig, IBaseActionConfig, ExecutionSetting } from "../bot_behavior";

export class BotBehaviorView extends BaseView implements IBotBehavior {
  /** Raw template HTML. View loads and stores; tests use for DOM fixtures. Single source of truth. */
  static get template(): string {
    if (!(BotBehaviorView as { _template?: string })._template) {
      const p = path.join(__dirname, "BotBehavior.html");
      (BotBehaviorView as { _template?: string })._template = fs.readFileSync(
        p,
        "utf8"
      );
    }
    return (BotBehaviorView as { _template?: string })._template!;
  }

  private _panel: vscode.WebviewPanel;
  private _botBehavior: IBotBehavior;

  constructor(
    panel: vscode.WebviewPanel,
    botBehavior: IBotBehavior,
    extensionUri: vscode.Uri
  ) {
    super(extensionUri);
    this._panel = panel;
    this._botBehavior = botBehavior;
  }

  get currentBehavior(): IBehaviorConfig | null {
    return this._botBehavior.currentBehavior;
  }

  get currentAction(): IActionConfig | null {
    return this._botBehavior.currentAction;
  }

  get behaviors(): IBehaviorConfig[] {
    return this._botBehavior.behaviors;
  }

  get actions(): IActionConfig[] {
    return this._botBehavior.actions;
  }

  get executionSettings(): Record<string, ExecutionSetting> {
    return this._botBehavior.executionSettings;
  }

  setExecutionSetting(key: string, value: ExecutionSetting): void {
    this._botBehavior.setExecutionSetting(key, value);
  }

  getHtml(): string {
    const botBehaviorCssUri = this._panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "dist", "bot_behavior", "view", "bot_behavior.css")
    );
    return this.renderTemplate("dist/bot_behavior/view/BotBehavior.html", {
      currentBehavior: this._botBehavior.currentBehavior?.name ?? "",
      currentAction: this._botBehavior.currentAction?.name ?? "",
      behaviorCount: String(this._botBehavior.behaviors.length),
      actionCount: String(this._botBehavior.actions.length),
      botBehaviorCssUri: botBehaviorCssUri.toString(),
    });
  }

  loadBehaviors(allowedBehaviors: string[], behaviorConfigs: IBehaviorConfig[]): void {
    this._botBehavior.loadBehaviors(allowedBehaviors, behaviorConfigs);
    this._panel.webview.postMessage({
      currentBehavior: this._botBehavior.currentBehavior?.name ?? "",
      behaviorCount: this._botBehavior.behaviors.length,
    });
  }

  loadActions(baseActionConfigs?: IBaseActionConfig[]): void {
    this._botBehavior.loadActions(baseActionConfigs);
    this._panel.webview.postMessage({
      currentAction: this._botBehavior.currentAction?.name ?? "",
      actionCount: this._botBehavior.actions.length,
    });
  }

  hydrate(data: { currentBehavior?: string; currentAction?: string; executionSettings?: Record<string, ExecutionSetting> }): void {
    this._botBehavior.hydrate?.(data);
  }

  /** HTML for test fixtures (placeholder defaults). Tests use this for JSDOM. */
  static getFixtureHtml(data?: { currentBehavior?: string; currentAction?: string; behaviorCount?: string; actionCount?: string; botBehaviorCssUri?: string }): string {
    const d = { currentBehavior: "", currentAction: "", behaviorCount: "0", actionCount: "0", botBehaviorCssUri: "", ...data };
    let html = BotBehaviorView.template;
    for (const [k, v] of Object.entries(d)) html = html.split(`{{${k}}}`).join(String(v));
    return html;
  }
}
