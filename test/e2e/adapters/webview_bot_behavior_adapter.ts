// e2e/adapters/webview_bot_behavior_adapter.ts — IBotBehavior implementation via WebView DOM
import { $ } from "@wdio/globals";
import type { WebView } from "wdio-vscode-service";
import type { IBotBehavior, IBehaviorConfig, IActionConfig, IBaseActionConfig, BotBehaviorHydrateData, ExecutionSetting } from "../../../src/bot_behavior/bot_behavior";
import { botBehaviorLocators } from "../pageobjects/locators";

/**
 * Wraps WebView DOM as IBotBehavior for E2E tests.
 * All interactions are async (wdio calls return Promises).
 *
 * Methods delegate to WebView DOM elements:
 * - getCurrentBehaviorAsync() → read #currentBehavior element text
 * - getCurrentActionAsync() → read #currentAction element text
 * - getBehaviorCountAsync() → read #behaviorCount element text
 * - getActionCountAsync() → read #actionCount element text
 */
export class WebViewBotBehaviorAdapter implements IBotBehavior {
  constructor(private readonly webview: WebView) {}

  readonly executionSettings: Record<string, ExecutionSetting> = {};

  setExecutionSetting(_key: string, _value: ExecutionSetting): void {
    throw new Error("setExecutionSetting() not available in E2E — triggered server-side");
  }

  /**
   * loadBehaviors — not directly triggerable from DOM in current template.
   * State is loaded server-side; E2E reads the resulting DOM state.
   */
  loadBehaviors(_allowedBehaviors: string[], _behaviorConfigs: IBehaviorConfig[]): void {
    throw new Error("loadBehaviors() not available in E2E — triggered server-side");
  }

  /**
   * loadActions — not directly triggerable from DOM in current template.
   */
  loadActions(_baseActionConfigs?: IBaseActionConfig[]): void {
    throw new Error("loadActions() not available in E2E — triggered server-side");
  }

  /**
   * Sync getter throws — use getCurrentBehaviorAsync() instead.
   */
  get currentBehavior(): IBehaviorConfig | null {
    throw new Error("Use getCurrentBehaviorAsync() for E2E tests - wdio is async");
  }

  /**
   * Sync getter throws — use getCurrentActionAsync() instead.
   */
  get currentAction(): IActionConfig | null {
    throw new Error("Use getCurrentActionAsync() for E2E tests - wdio is async");
  }

  get behaviors(): IBehaviorConfig[] {
    throw new Error("Use getBehaviorCountAsync() for E2E tests - wdio is async");
  }

  get actions(): IActionConfig[] {
    throw new Error("Use getActionCountAsync() for E2E tests - wdio is async");
  }

  /**
   * Async getter for current behavior name from webview DOM.
   */
  async getCurrentBehaviorAsync(): Promise<string> {
    const el = await $(botBehaviorLocators.currentBehavior);
    return await el.getText();
  }

  /**
   * Async getter for current action name from webview DOM.
   */
  async getCurrentActionAsync(): Promise<string> {
    const el = await $(botBehaviorLocators.currentAction);
    return await el.getText();
  }

  /**
   * Async getter for behavior count from webview DOM.
   */
  async getBehaviorCountAsync(): Promise<number> {
    const el = await $(botBehaviorLocators.behaviorCount);
    const text = await el.getText();
    return parseInt(text, 10);
  }

  /**
   * Async getter for action count from webview DOM.
   */
  async getActionCountAsync(): Promise<number> {
    const el = await $(botBehaviorLocators.actionCount);
    const text = await el.getText();
    return parseInt(text, 10);
  }

  /**
   * Hydrate — no-op for E2E (state comes from DOM).
   */
  hydrate(_data?: BotBehaviorHydrateData): void {
    // No-op for E2E
  }
}
