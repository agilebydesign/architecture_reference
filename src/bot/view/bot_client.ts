// bot/view/bot_client.ts — Client: extends Bot with DOM updates and server sync

import { Bot, type BotHydrateData, type IBotConfig } from "../bot.js";

interface VsCodeApi {
  postMessage(message: unknown): void;
}

/** Extends Bot with DOM updates and server synchronization */
export class BotClient extends Bot {
  private vscode: VsCodeApi;
  private botSelectEl: HTMLSelectElement;
  private botNameEl: HTMLSpanElement;
  private botDescriptionEl: HTMLSpanElement;
  private botGoalEl: HTMLSpanElement;
  private botBehaviorNamesEl: HTMLSpanElement;
  private botDetailsEl: HTMLDivElement;
  private botDetailToggleEl: HTMLButtonElement;

  constructor(vscode: VsCodeApi) {
    super();
    this.vscode = vscode;
    this.botSelectEl = document.getElementById("botSelect") as HTMLSelectElement;
    this.botNameEl = document.getElementById("currentBotName") as HTMLSpanElement;
    this.botDescriptionEl = document.getElementById("botDescription") as HTMLSpanElement;
    this.botGoalEl = document.getElementById("botGoal") as HTMLSpanElement;
    this.botBehaviorNamesEl = document.getElementById("botBehaviorNames") as HTMLSpanElement;
    this.botDetailsEl = document.getElementById("botDetails") as HTMLDivElement;
    this.botDetailToggleEl = document.getElementById("botDetailToggle") as HTMLButtonElement;
  }

  private syncToServer(command: string, value?: unknown): void {
    this.vscode.postMessage(value !== undefined ? { command, value } : { command });
  }

  private _updateDom(): void {
    this.botNameEl.textContent = this.name;
    this.botDescriptionEl.textContent = this.description;
    this.botGoalEl.textContent = this.goal;
    this.botBehaviorNamesEl.textContent = this.behaviorNames.join(", ");
  }

  private _updateSelectDom(): void {
    if (!this.botSelectEl) return;
    this.botSelectEl.innerHTML = this.availableBots.map((name) => {
      const selected = name === this.name ? " selected" : "";
      return `<option value="${name}"${selected}>${name}</option>`;
    }).join("");
  }

  override registerBot(config: IBotConfig): void {
    super.registerBot(config);
    this._updateSelectDom();
    this.syncToServer("bot.registerBot");
  }

  override switchBot(name: string): void {
    super.switchBot(name);
    this._updateDom();
    this._updateSelectDom();
    this.syncToServer("bot.switchBot", name);
  }

  override reset(): void {
    super.reset();
    this._updateDom();
    this._updateSelectDom();
    this.syncToServer("bot.reset");
  }

  toggleDetails(): void {
    if (!this.botDetailsEl) return;
    this.botDetailsEl.classList.toggle("collapsed");
    if (this.botDetailToggleEl) {
      this.botDetailToggleEl.textContent = this.botDetailsEl.classList.contains("collapsed") ? "▼" : "▲";
    }
  }

  override hydrate(data: BotHydrateData & { botName?: string; botDescription?: string; botGoal?: string; botBehaviorNames?: string; availableBots?: string[] }): void {
    // If full init payload with botConfigs, load them into domain
    if (data.botConfigs) {
      for (const config of data.botConfigs) {
        super.registerBot(config);
      }
    }
    if (data.currentBot !== undefined) {
      super.switchBot(data.currentBot);
    }
    // Direct field updates from server postMessage
    if (data.botName !== undefined) {
      this.botNameEl.textContent = data.botName;
    }
    if (data.botDescription !== undefined) {
      this.botDescriptionEl.textContent = data.botDescription;
    }
    if (data.botGoal !== undefined) {
      this.botGoalEl.textContent = data.botGoal;
    }
    if (data.botBehaviorNames !== undefined) {
      this.botBehaviorNamesEl.textContent = data.botBehaviorNames;
    }
    if (data.availableBots !== undefined) {
      this._updateSelectDom();
    }
    this._updateDom();
  }
}

export function initBotClient(vscode: VsCodeApi): BotClient {
  const bot = new BotClient(vscode);

  // Select change → switch bot
  const botSelectEl = document.getElementById("botSelect") as HTMLSelectElement;
  if (botSelectEl) {
    botSelectEl.addEventListener("change", () => bot.switchBot(botSelectEl.value));
  }

  // Toggle details card
  const toggleBtn = document.getElementById("botDetailToggle") as HTMLButtonElement;
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => bot.toggleDetails());
  }

  window.addEventListener("message", (event: MessageEvent) => {
    if ("botName" in event.data || "availableBots" in event.data || "botConfigs" in event.data) {
      bot.hydrate(event.data as BotHydrateData);
    }
  });

  // Request full init state from server
  vscode.postMessage({ command: "bot.requestInit" });

  return bot;
}
