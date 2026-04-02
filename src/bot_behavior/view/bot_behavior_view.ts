// bot_behavior/view/bot_behavior_view.ts — Server view: implements IBotBehavior, delegates to domain, posts to webview
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { BaseView } from "../../engine/base_view";
import type { IBotBehavior, IBehaviorConfig, IActionConfig, IBaseActionConfig, ExecutionSetting, NavigationResult, PositionResult } from "../bot_behavior";

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

  get baseActionConfigs(): IBaseActionConfig[] {
    return this._botBehavior.baseActionConfigs;
  }

  get executionSettings(): Record<string, ExecutionSetting> {
    return this._botBehavior.executionSettings;
  }

  get behaviorNames(): string[] {
    return this._botBehavior.behaviorNames;
  }

  get actionNames(): string[] {
    return this._botBehavior.actionNames;
  }

  setExecutionSetting(key: string, value: ExecutionSetting): void {
    this._botBehavior.setExecutionSetting(key, value);
  }

  navigateToBehavior(name: string): void {
    this._botBehavior.navigateToBehavior(name);
    this._postCurrentState();
  }

  navigateToAction(name: string): void {
    this._botBehavior.navigateToAction(name);
    this._postCurrentState();
  }

  next(): NavigationResult {
    const result = this._botBehavior.next();
    this._postCurrentState();
    return result;
  }

  back(): NavigationResult {
    const result = this._botBehavior.back();
    this._postCurrentState();
    return result;
  }

  pos(): PositionResult {
    return this._botBehavior.pos();
  }

  tree(): string {
    return this._botBehavior.tree();
  }

  nextBehavior(): IBehaviorConfig | null {
    return this._botBehavior.nextBehavior();
  }

  previousBehavior(): IBehaviorConfig | null {
    return this._botBehavior.previousBehavior();
  }

  nextAction(): IActionConfig | null {
    return this._botBehavior.nextAction();
  }

  findBehavior(name: string): IBehaviorConfig | null {
    return this._botBehavior.findBehavior(name);
  }

  findAction(name: string): IActionConfig | null {
    return this._botBehavior.findAction(name);
  }

  checkBehaviorExists(name: string): boolean {
    return this._botBehavior.checkBehaviorExists(name);
  }

  isFinalAction(): boolean {
    return this._botBehavior.isFinalAction();
  }

  closeCurrent(): NavigationResult {
    const result = this._botBehavior.closeCurrent();
    this._postCurrentState();
    return result;
  }

  private _postCurrentState(): void {
    this._panel.webview.postMessage({
      currentBehavior: this._botBehavior.currentBehavior?.name ?? "",
      currentAction: this._botBehavior.currentAction?.name ?? "",
      behaviorTree: this._buildBehaviorTree(),
    });
  }

  /** Build a serializable behavior tree for the client to render. */
  private _buildBehaviorTree(): { name: string; actions: { name: string; executionSetting: string }[] }[] {
    return this._botBehavior.behaviors.map((b) => ({
      name: b.name,
      actions: [...b.actionsWorkflow].sort((a, c) => a.order - c.order).map((a) => ({
        name: a.name,
        executionSetting: a.executionSetting ?? "manual",
      })),
    }));
  }

  /** Generate the behavior tree HTML for server-side rendering. */
  private _buildBehaviorTreeHtml(): string {
    const currentBehaviorName = this._botBehavior.currentBehavior?.name ?? "";
    const currentActionName = this._botBehavior.currentAction?.name ?? "";

    return this._botBehavior.behaviors.map((b) => {
      const isCurrent = b.name === currentBehaviorName;
      const behaviorClasses = `behavior-item${isCurrent ? " active" : ""}`;
      const actions = [...b.actionsWorkflow].sort((a, c) => a.order - c.order);
      const actionsHtml = actions.map((a) => {
        const isCurrentAction = isCurrent && a.name === currentActionName;
        const actionClasses = `action-item${isCurrentAction ? " active" : ""}`;
        const execSetting = a.executionSetting ?? "manual";
        return `<li class="${actionClasses}" data-action="${a.name}" data-behavior="${b.name}">` +
          `<span class="action-name">${a.name}</span>` +
          `<span class="action-exec-settings">` +
          `<button class="exec-btn${execSetting === "skip" ? " active" : ""}" data-exec="skip" data-target="${b.name}.${a.name}" title="Skip">⏭</button>` +
          `<button class="exec-btn${execSetting === "manual" ? " active" : ""}" data-exec="manual" data-target="${b.name}.${a.name}" title="Manual">✋</button>` +
          `<button class="exec-btn${execSetting === "combine_with_next" ? " active" : ""}" data-exec="combine_with_next" data-target="${b.name}.${a.name}" title="Combine with next">🔗</button>` +
          `</span></li>`;
      }).join("");

      return `<li class="${behaviorClasses}" data-behavior="${b.name}">` +
        `<div class="behavior-header">` +
        `<span class="expand-icon">▶</span>` +
        `<span class="behavior-name">${b.name}</span>` +
        `<span class="behavior-exec-settings">` +
        `<button class="exec-btn" data-exec="skip" data-target="${b.name}" title="Skip">⏭</button>` +
        `<button class="exec-btn active" data-exec="manual" data-target="${b.name}" title="Manual">✋</button>` +
        `<button class="exec-btn" data-exec="combine_with_next" data-target="${b.name}" title="Combine with next">🔗</button>` +
        `</span></div>` +
        `<ul class="action-list">${actionsHtml}</ul></li>`;
    }).join("");
  }

  getHtml(): string {
    const botBehaviorCssUri = this._panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "dist", "bot_behavior", "view", "bot_behavior.css")
    );
    return this.renderTemplate("dist/bot_behavior/view/BotBehavior.html", {
      currentBehavior: this._botBehavior.currentBehavior?.name ?? "",
      currentAction: this._botBehavior.currentAction?.name ?? "",
      botBehaviorCssUri: botBehaviorCssUri.toString(),
      behaviorTreeHtml: this._buildBehaviorTreeHtml(),
    });
  }

  loadBehaviors(allowedBehaviors: string[], behaviorConfigs: IBehaviorConfig[]): void {
    this._botBehavior.loadBehaviors(allowedBehaviors, behaviorConfigs);
    this._panel.webview.postMessage({
      currentBehavior: this._botBehavior.currentBehavior?.name ?? "",
      behaviorTree: this._buildBehaviorTree(),
    });
  }

  loadActions(baseActionConfigs?: IBaseActionConfig[]): void {
    this._botBehavior.loadActions(baseActionConfigs);
    this._panel.webview.postMessage({
      currentAction: this._botBehavior.currentAction?.name ?? "",
      behaviorTree: this._buildBehaviorTree(),
    });
  }

  hydrate(data: { currentBehavior?: string; currentAction?: string; executionSettings?: Record<string, ExecutionSetting> }): void {
    this._botBehavior.hydrate?.(data);
  }

  /** Post full init state so the client can populate its local domain. */
  requestInit(): void {
    this._panel.webview.postMessage({
      currentBehavior: this._botBehavior.currentBehavior?.name ?? "",
      currentAction: this._botBehavior.currentAction?.name ?? "",
      executionSettings: this._botBehavior.executionSettings,
      allowedBehaviors: this._botBehavior.behaviorNames,
      behaviorConfigs: this._botBehavior.behaviors,
      baseActionConfigs: this._getBaseActionConfigs(),
      behaviorTree: this._buildBehaviorTree(),
    });
  }

  /** Retrieve base action configs from the underlying domain. */
  private _getBaseActionConfigs(): IBaseActionConfig[] {
    return this._botBehavior.baseActionConfigs;
  }

  /** HTML for test fixtures (placeholder defaults). Tests use this for JSDOM. */
  static getFixtureHtml(data?: { currentBehavior?: string; currentAction?: string; botBehaviorCssUri?: string; behaviorTreeHtml?: string }): string {
    const d = { currentBehavior: "", currentAction: "", botBehaviorCssUri: "", behaviorTreeHtml: "", ...data };
    let html = BotBehaviorView.template;
    for (const [k, v] of Object.entries(d)) html = html.split(`{{${k}}}`).join(String(v));
    return html;
  }
}
