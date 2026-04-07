// behavior/view/behavior_view.ts — Server view: implements IBehavior, delegates to domain, posts to webview
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { BaseView } from "../../engine/base_view";
import type { IBehavior, IBehaviorConfig, IActionConfig, IBaseActionConfig, ExecutionSetting, NavigationResult, PositionResult } from "../behavior";

export class BehaviorView extends BaseView implements IBehavior {
  /** Raw template HTML. View loads and stores; tests use for DOM fixtures. Single source of truth. */
  static get template(): string {
    if (!(BehaviorView as { _template?: string })._template) {
      const p = path.join(__dirname, "Behavior.html");
      (BehaviorView as { _template?: string })._template = fs.readFileSync(p, "utf8");
    }
    return (BehaviorView as { _template?: string })._template!;
  }

  private _panel: vscode.WebviewPanel;
  private _behavior: IBehavior;

  constructor(
    panel: vscode.WebviewPanel,
    behavior: IBehavior,
    extensionUri: vscode.Uri
  ) {
    super(extensionUri);
    this._panel = panel;
    this._behavior = behavior;
  }

  get currentBehavior(): IBehaviorConfig | null {
    return this._behavior.currentBehavior;
  }

  get currentAction(): IActionConfig | null {
    return this._behavior.currentAction;
  }

  get behaviors(): IBehaviorConfig[] {
    return this._behavior.behaviors;
  }

  get actions(): IActionConfig[] {
    return this._behavior.actions;
  }

  get baseActionConfigs(): IBaseActionConfig[] {
    return this._behavior.baseActionConfigs;
  }

  get executionSettings(): Record<string, ExecutionSetting> {
    return this._behavior.executionSettings;
  }

  get behaviorNames(): string[] {
    return this._behavior.behaviorNames;
  }

  get actionNames(): string[] {
    return this._behavior.actionNames;
  }

  setExecutionSetting(key: string, value: ExecutionSetting): void {
    this._behavior.setExecutionSetting(key, value);
  }

  navigateToBehavior(name: string): void {
    this._behavior.navigateToBehavior(name);
    this._postCurrentState();
  }

  navigateToAction(name: string): void {
    this._behavior.navigateToAction(name);
    this._postCurrentState();
  }

  next(): NavigationResult {
    const result = this._behavior.next();
    this._postCurrentState();
    return result;
  }

  back(): NavigationResult {
    const result = this._behavior.back();
    this._postCurrentState();
    return result;
  }

  pos(): PositionResult {
    return this._behavior.pos();
  }

  tree(): string {
    return this._behavior.tree();
  }

  nextBehavior(): IBehaviorConfig | null {
    return this._behavior.nextBehavior();
  }

  previousBehavior(): IBehaviorConfig | null {
    return this._behavior.previousBehavior();
  }

  nextAction(): IActionConfig | null {
    return this._behavior.nextAction();
  }

  findBehavior(name: string): IBehaviorConfig | null {
    return this._behavior.findBehavior(name);
  }

  findAction(name: string): IActionConfig | null {
    return this._behavior.findAction(name);
  }

  checkBehaviorExists(name: string): boolean {
    return this._behavior.checkBehaviorExists(name);
  }

  isFinalAction(): boolean {
    return this._behavior.isFinalAction();
  }

  closeCurrent(): NavigationResult {
    const result = this._behavior.closeCurrent();
    this._postCurrentState();
    return result;
  }

  private _postCurrentState(): void {
    this._panel.webview.postMessage({
      currentBehavior: this._behavior.currentBehavior?.name ?? "",
      currentAction: this._behavior.currentAction?.name ?? "",
      behaviorTree: this._buildBehaviorTree(),
    });
  }

  private _buildBehaviorTree(): { name: string; actions: { name: string; executionSetting: string }[] }[] {
    return this._behavior.behaviors.map((b) => ({
      name: b.name,
      actions: [...b.actionsWorkflow].sort((a, c) => a.order - c.order).map((a) => ({
        name: a.name,
        executionSetting: a.executionSetting ?? "manual",
      })),
    }));
  }

  private _buildBehaviorTreeHtml(): string {
    const currentBehaviorName = this._behavior.currentBehavior?.name ?? "";
    const currentActionName = this._behavior.currentAction?.name ?? "";

    return this._behavior.behaviors.map((b) => {
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
    const behaviorCssUri = this._panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "dist", "behavior", "view", "behavior.css")
    );
    return this.renderTemplate("dist/behavior/view/Behavior.html", {
      currentBehavior: this._behavior.currentBehavior?.name ?? "",
      currentAction: this._behavior.currentAction?.name ?? "",
      behaviorCssUri: behaviorCssUri.toString(),
      behaviorTreeHtml: this._buildBehaviorTreeHtml(),
    });
  }

  loadBehaviors(allowedBehaviors: string[], behaviorConfigs: IBehaviorConfig[]): void {
    this._behavior.loadBehaviors(allowedBehaviors, behaviorConfigs);
    this._panel.webview.postMessage({
      currentBehavior: this._behavior.currentBehavior?.name ?? "",
      behaviorTree: this._buildBehaviorTree(),
    });
  }

  loadActions(baseActionConfigs?: IBaseActionConfig[]): void {
    this._behavior.loadActions(baseActionConfigs);
    this._panel.webview.postMessage({
      currentAction: this._behavior.currentAction?.name ?? "",
      behaviorTree: this._buildBehaviorTree(),
    });
  }

  hydrate(data: { currentBehavior?: string; currentAction?: string; executionSettings?: Record<string, ExecutionSetting> }): void {
    this._behavior.hydrate?.(data);
  }

  requestInit(): void {
    this._panel.webview.postMessage({
      currentBehavior: this._behavior.currentBehavior?.name ?? "",
      currentAction: this._behavior.currentAction?.name ?? "",
      executionSettings: this._behavior.executionSettings,
      allowedBehaviors: this._behavior.behaviorNames,
      behaviorConfigs: this._behavior.behaviors,
      baseActionConfigs: this._behavior.baseActionConfigs,
      behaviorTree: this._buildBehaviorTree(),
    });
  }

  static getFixtureHtml(data?: { currentBehavior?: string; currentAction?: string; behaviorCssUri?: string; behaviorTreeHtml?: string }): string {
    const d = { currentBehavior: "", currentAction: "", behaviorCssUri: "", behaviorTreeHtml: "", ...data };
    let html = BehaviorView.template;
    for (const [k, v] of Object.entries(d)) html = html.split(`{{${k}}}`).join(String(v));
    return html;
  }
}
