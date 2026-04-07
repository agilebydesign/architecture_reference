// e2e/adapters/webview_bot_adapter.ts — IBot implementation via WebView DOM
import { browser, $, $$ } from "@wdio/globals";
import type { WebView } from "wdio-vscode-service";
import type { IBot, IBotConfig, BotHydrateData } from "../../../src/bot/bot";
import { botLocators } from "../pageobjects/locators";

/**
 * Wraps WebView DOM as IBot for E2E tests.
 * All interactions are async (wdio calls return Promises).
 */
export class WebViewBotAdapter implements IBot {
  constructor(private readonly webview: WebView) {}

  // --- Sync interface methods throw — use async counterparts ---

  registerBot(_config: IBotConfig): void {
    throw new Error("registerBot() not available in E2E — triggered server-side");
  }

  switchBot(_name: string): void {
    throw new Error("switchBot() not available in E2E sync — use switchBotAsync()");
  }

  reset(): void {
    throw new Error("reset() not available in E2E sync");
  }

  get name(): string {
    throw new Error("Use getNameAsync() for E2E tests - wdio is async");
  }

  get description(): string {
    throw new Error("Use getDescriptionAsync() for E2E tests - wdio is async");
  }

  get goal(): string {
    throw new Error("Use getGoalAsync() for E2E tests - wdio is async");
  }

  get instructions(): string[] {
    throw new Error("instructions not available in E2E sync");
  }

  get behaviorNames(): string[] {
    throw new Error("Use getBehaviorNamesAsync() for E2E tests - wdio is async");
  }

  get availableBots(): string[] {
    throw new Error("Use getAvailableBotsAsync() for E2E tests - wdio is async");
  }

  get currentBotConfig(): IBotConfig | null {
    throw new Error("currentBotConfig not available in E2E sync");
  }

  get botConfigs(): IBotConfig[] {
    throw new Error("botConfigs not available in E2E sync");
  }

  // --- Async DOM readers ---

  async getNameAsync(): Promise<string> {
    const el = await $(botLocators.botName);
    return await el.getText();
  }

  async getDescriptionAsync(): Promise<string> {
    const el = await $(botLocators.botDescription);
    return await el.getText();
  }

  async getGoalAsync(): Promise<string> {
    const el = await $(botLocators.botGoal);
    return await el.getText();
  }

  async getBehaviorNamesAsync(): Promise<string[]> {
    const el = await $(botLocators.botBehaviorNames);
    const text = await el.getText();
    return text ? text.split(", ").map((s) => s.trim()).filter(Boolean) : [];
  }

  async getAvailableBotsAsync(): Promise<string[]> {
    const options = await $$(botLocators.botSelectOptions);
    const names: string[] = [];
    for (const opt of options) {
      names.push(await opt.getText());
    }
    return names;
  }

  // --- Async UI interactions ---

  async switchBotAsync(name: string): Promise<void> {
    const select = await $(botLocators.botSelect);
    await select.selectByAttribute("value", name);
    await browser.pause(100);
  }

  async toggleDetailsAsync(): Promise<void> {
    const btn = await $(botLocators.botDetailToggle);
    await btn.click();
    await browser.pause(100);
  }

  async isDetailsExpandedAsync(): Promise<boolean> {
    const details = await $(botLocators.botDetails);
    const cls = await details.getAttribute("class");
    return !cls.includes("collapsed");
  }
}
