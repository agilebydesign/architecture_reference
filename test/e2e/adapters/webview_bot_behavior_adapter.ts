// e2e/adapters/webview_bot_behavior_adapter.ts — IBotBehavior implementation via WebView DOM
import { browser, $, $$ } from "@wdio/globals";
import type { WebView } from "wdio-vscode-service";
import type { IBotBehavior, IBehaviorConfig, IActionConfig, IBaseActionConfig, BotBehaviorHydrateData, ExecutionSetting, NavigationResult, PositionResult } from "../../../src/bot_behavior/bot_behavior";
import { botBehaviorLocators } from "../pageobjects/locators";

/**
 * Wraps WebView DOM as IBotBehavior for E2E tests.
 * All interactions are async (wdio calls return Promises).
 *
 * Navigation methods click actual UI elements (buttons, tree items) and verify
 * DOM state updates. Sync interface methods throw — use async counterparts.
 */
export class WebViewBotBehaviorAdapter implements IBotBehavior {
  constructor(private readonly webview: WebView) {}

  readonly executionSettings: Record<string, ExecutionSetting> = {};

  setExecutionSetting(_key: string, _value: ExecutionSetting): void {
    throw new Error("setExecutionSetting() not available in E2E — use setExecutionSettingAsync()");
  }

  loadBehaviors(_allowedBehaviors: string[], _behaviorConfigs: IBehaviorConfig[]): void {
    throw new Error("loadBehaviors() not available in E2E — triggered server-side");
  }

  loadActions(_baseActionConfigs?: IBaseActionConfig[]): void {
    throw new Error("loadActions() not available in E2E — triggered server-side");
  }

  get currentBehavior(): IBehaviorConfig | null {
    throw new Error("Use getCurrentBehaviorAsync() for E2E tests - wdio is async");
  }

  get currentAction(): IActionConfig | null {
    throw new Error("Use getCurrentActionAsync() for E2E tests - wdio is async");
  }

  get behaviors(): IBehaviorConfig[] {
    throw new Error("Use getBehaviorNamesAsync() for E2E tests - wdio is async");
  }

  get actions(): IActionConfig[] {
    throw new Error("Use async methods for E2E tests - wdio is async");
  }

  get baseActionConfigs(): IBaseActionConfig[] {
    throw new Error("baseActionConfigs not available in E2E - server-side only");
  }

  get behaviorNames(): string[] {
    throw new Error("Use async methods for E2E tests - wdio is async");
  }

  get actionNames(): string[] {
    throw new Error("Use async methods for E2E tests - wdio is async");
  }

  navigateToBehavior(_name: string): void {
    throw new Error("navigateToBehavior() not available in E2E sync — use navigateToBehaviorAsync()");
  }

  navigateToAction(_name: string): void {
    throw new Error("navigateToAction() not available in E2E sync — use navigateToActionAsync()");
  }

  next(): NavigationResult {
    throw new Error("next() not available in E2E sync — use nextAsync()");
  }

  back(): NavigationResult {
    throw new Error("back() not available in E2E sync — use backAsync()");
  }

  pos(): PositionResult {
    throw new Error("pos() not available in E2E sync — use posAsync()");
  }

  tree(): string {
    throw new Error("tree() not available in E2E sync");
  }

  nextBehavior(): IBehaviorConfig | null {
    throw new Error("nextBehavior() not available in E2E sync");
  }

  previousBehavior(): IBehaviorConfig | null {
    throw new Error("previousBehavior() not available in E2E sync");
  }

  nextAction(): IActionConfig | null {
    throw new Error("nextAction() not available in E2E sync");
  }

  findBehavior(_name: string): IBehaviorConfig | null {
    throw new Error("findBehavior() not available in E2E sync");
  }

  findAction(_name: string): IActionConfig | null {
    throw new Error("findAction() not available in E2E sync");
  }

  checkBehaviorExists(_name: string): boolean {
    throw new Error("checkBehaviorExists() not available in E2E sync");
  }

  isFinalAction(): boolean {
    throw new Error("isFinalAction() not available in E2E sync");
  }

  closeCurrent(): NavigationResult {
    throw new Error("closeCurrent() not available in E2E sync — use closeCurrentAsync()");
  }

  // --- Async DOM readers ---

  async getCurrentBehaviorAsync(): Promise<string> {
    const el = await $(botBehaviorLocators.currentBehavior);
    return await el.getText();
  }

  async getCurrentActionAsync(): Promise<string> {
    const el = await $(botBehaviorLocators.currentAction);
    return await el.getText();
  }

  // --- Async navigation via UI clicks ---

  /** Click a behavior name in the tree to select it (navigate, no expand). */
  async navigateToBehaviorAsync(name: string): Promise<void> {
    const nameEl = await $(botBehaviorLocators.behaviorName(name));
    await nameEl.click();
    await browser.pause(100);
  }

  /** Click the expand icon to toggle expand/collapse of a behavior's actions. */
  async toggleExpandAsync(name: string): Promise<void> {
    const icon = await $(botBehaviorLocators.expandIcon(name));
    await icon.click();
    await browser.pause(100);
  }

  /** Click an action item in the tree to navigate to it. Expands the behavior first if collapsed. */
  async navigateToActionAsync(behaviorName: string, actionName: string): Promise<void> {
    // Ensure behavior is expanded so action items are visible
    const isExpanded = await this.isBehaviorExpandedAsync(behaviorName);
    if (!isExpanded) {
      await this.toggleExpandAsync(behaviorName);
    }
    const actionItem = await $(botBehaviorLocators.actionItem(behaviorName, actionName));
    await actionItem.click();
    await browser.pause(100);
  }

  /** Click the Next button. */
  async nextAsync(): Promise<void> {
    const btn = await $(botBehaviorLocators.nextBtn);
    await btn.click();
    await browser.pause(100);
  }

  /** Click the Back button. */
  async backAsync(): Promise<void> {
    const btn = await $(botBehaviorLocators.backBtn);
    await btn.click();
    await browser.pause(100);
  }

  /** Click an execution setting button for a target. Expands the behavior if target is an action. */
  async setExecutionSettingAsync(target: string, setting: ExecutionSetting): Promise<void> {
    await this._ensureTargetVisible(target);
    const btn = await $(botBehaviorLocators.execBtn(target, setting));
    await btn.click();
    await browser.pause(100);
  }

  /** Check if a behavior item has the "active" class. */
  async isBehaviorActiveAsync(name: string): Promise<boolean> {
    const item = await $(botBehaviorLocators.behaviorItem(name));
    const cls = await item.getAttribute("class");
    return cls.includes("active");
  }

  /** Check if a behavior item is expanded (has "expanded" class). */
  async isBehaviorExpandedAsync(name: string): Promise<boolean> {
    const item = await $(botBehaviorLocators.behaviorItem(name));
    const cls = await item.getAttribute("class");
    return cls.includes("expanded");
  }

  /** Check if an action item has the "active" class. */
  async isActionActiveAsync(behavior: string, action: string): Promise<boolean> {
    const item = await $(botBehaviorLocators.actionItem(behavior, action));
    const cls = await item.getAttribute("class");
    return cls.includes("active");
  }

  /** Check if an execution setting button is active. Expands the behavior if target is an action. */
  async isExecSettingActiveAsync(target: string, setting: string): Promise<boolean> {
    await this._ensureTargetVisible(target);
    const btn = await $(botBehaviorLocators.execBtn(target, setting));
    const cls = await btn.getAttribute("class");
    return cls.includes("active");
  }

  /** Get all behavior names from the tree. */
  async getBehaviorNamesAsync(): Promise<string[]> {
    const items = await $$(botBehaviorLocators.allBehaviorItems);
    const names: string[] = [];
    for (const item of items) {
      const name = await item.getAttribute("data-behavior");
      names.push(name);
    }
    return names;
  }

  /** Ensure a target's behavior is expanded if it's an action-level target (e.g., "shape.clarify"). */
  private async _ensureTargetVisible(target: string): Promise<void> {
    if (target.includes(".")) {
      const behaviorName = target.split(".")[0];
      const isExpanded = await this.isBehaviorExpandedAsync(behaviorName);
      if (!isExpanded) {
        await this.toggleExpandAsync(behaviorName);
      }
    }
  }

  /** Collapse all currently expanded behaviors. */
  async collapseAllAsync(): Promise<void> {
    const items = await $$(botBehaviorLocators.allBehaviorItems);
    for (const item of items) {
      const cls = await item.getAttribute("class");
      if (cls.includes("expanded")) {
        const name = await item.getAttribute("data-behavior");
        if (name) {
          await this.toggleExpandAsync(name);
        }
      }
    }
  }

  hydrate(_data?: BotBehaviorHydrateData): void {
    // No-op for E2E
  }
}
