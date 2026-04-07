// bot/view/bot_view.ts — Server view: implements IBot, delegates to domain, posts to webview
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { BaseView } from "../../engine/base_view";
import type { IBot, IBotConfig } from "../bot";

export class BotView extends BaseView implements IBot {
  /** Raw template HTML. View loads and stores; tests use for DOM fixtures. Single source of truth. */
  static get template(): string {
    if (!(BotView as { _template?: string })._template) {
      const p = path.join(__dirname, "Bot.html");
      (BotView as { _template?: string })._template = fs.readFileSync(p, "utf8");
    }
    return (BotView as { _template?: string })._template!;
  }

  private _panel: vscode.WebviewPanel;
  private _bot: IBot;

  constructor(
    panel: vscode.WebviewPanel,
    bot: IBot,
    extensionUri: vscode.Uri
  ) {
    super(extensionUri);
    this._panel = panel;
    this._bot = bot;
  }

  get name(): string {
    return this._bot.name;
  }

  get description(): string {
    return this._bot.description;
  }

  get goal(): string {
    return this._bot.goal;
  }

  get instructions(): string[] {
    return this._bot.instructions;
  }

  get behaviorNames(): string[] {
    return this._bot.behaviorNames;
  }

  get availableBots(): string[] {
    return this._bot.availableBots;
  }

  get currentBotConfig(): IBotConfig | null {
    return this._bot.currentBotConfig;
  }

  get botConfigs(): IBotConfig[] {
    return this._bot.botConfigs;
  }

  registerBot(config: IBotConfig): void {
    this._bot.registerBot(config);
    this._postCurrentState();
  }

  switchBot(name: string): void {
    this._bot.switchBot(name);
    this._postCurrentState();
  }

  reset(): void {
    this._bot.reset();
    this._postCurrentState();
  }

  hydrate(data: { currentBot?: string; availableBots?: string[]; botConfigs?: IBotConfig[] }): void {
    this._bot.hydrate?.(data);
  }

  /** Post full init state so the client can populate its local domain. */
  requestInit(): void {
    this._panel.webview.postMessage({
      currentBot: this._bot.name,
      botName: this._bot.name,
      botDescription: this._bot.description,
      botGoal: this._bot.goal,
      botBehaviorNames: this._bot.behaviorNames.join(", "),
      availableBots: this._bot.availableBots,
      botConfigs: this._bot.botConfigs,
    });
  }

  private _postCurrentState(): void {
    this._panel.webview.postMessage({
      botName: this._bot.name,
      botDescription: this._bot.description,
      botGoal: this._bot.goal,
      botBehaviorNames: this._bot.behaviorNames.join(", "),
      availableBots: this._bot.availableBots,
    });
  }

  private _buildBotOptionsHtml(): string {
    return this._bot.availableBots.map((name) => {
      const selected = name === this._bot.name ? " selected" : "";
      return `<option value="${name}"${selected}>${name}</option>`;
    }).join("");
  }

  getHtml(): string {
    const botCssUri = this._panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "dist", "bot", "view", "bot.css")
    );
    return this.renderTemplate("dist/bot/view/Bot.html", {
      botName: this._bot.name,
      botDescription: this._bot.description,
      botGoal: this._bot.goal,
      botBehaviorNames: this._bot.behaviorNames.join(", "),
      botCssUri: botCssUri.toString(),
      botOptionsHtml: this._buildBotOptionsHtml(),
    });
  }

  /** HTML for test fixtures (placeholder defaults). Tests use this for JSDOM. */
  static getFixtureHtml(data?: { botName?: string; botDescription?: string; botGoal?: string; botBehaviorNames?: string; botCssUri?: string; botOptionsHtml?: string }): string {
    const d = { botName: "", botDescription: "", botGoal: "", botBehaviorNames: "", botCssUri: "", botOptionsHtml: "", ...data };
    let html = BotView.template;
    for (const [k, v] of Object.entries(d)) html = html.split(`{{${k}}}`).join(String(v));
    return html;
  }
}
