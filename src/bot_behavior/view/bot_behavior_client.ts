// bot_behavior/view/bot_behavior_client.ts — Client: extends BotBehavior with DOM updates and server sync

import { BotBehavior, type BotBehaviorHydrateData, type IBehaviorConfig, type IBaseActionConfig } from "../bot_behavior.js";

interface VsCodeApi {
  postMessage(message: unknown): void;
}

/** Extends BotBehavior with DOM updates and server synchronization */
export class BotBehaviorClient extends BotBehavior {
  private vscode: VsCodeApi;
  private currentBehaviorEl: HTMLSpanElement;
  private currentActionEl: HTMLSpanElement;
  private behaviorCountEl: HTMLSpanElement;
  private actionCountEl: HTMLSpanElement;

  constructor(vscode: VsCodeApi) {
    super();
    this.vscode = vscode;
    this.currentBehaviorEl = document.getElementById("currentBehavior") as HTMLSpanElement;
    this.currentActionEl = document.getElementById("currentAction") as HTMLSpanElement;
    this.behaviorCountEl = document.getElementById("behaviorCount") as HTMLSpanElement;
    this.actionCountEl = document.getElementById("actionCount") as HTMLSpanElement;
  }

  private syncToServer(command: string, value?: unknown): void {
    this.vscode.postMessage(value !== undefined ? { command, value } : { command });
  }

  override loadBehaviors(allowedBehaviors: string[], behaviorConfigs: IBehaviorConfig[]): void {
    super.loadBehaviors(allowedBehaviors, behaviorConfigs);
    this.currentBehaviorEl.textContent = this.currentBehavior?.name ?? "";
    this.behaviorCountEl.textContent = String(this.behaviors.length);
    this.syncToServer("botBehavior.loadBehaviors");
  }

  override loadActions(baseActionConfigs?: IBaseActionConfig[]): void {
    super.loadActions(baseActionConfigs);
    this.currentActionEl.textContent = this.currentAction?.name ?? "";
    this.actionCountEl.textContent = String(this.actions.length);
    this.syncToServer("botBehavior.loadActions");
  }

  override hydrate(data: BotBehaviorHydrateData): void {
    super.hydrate(data);
    if (data.currentBehavior !== undefined) this.currentBehaviorEl.textContent = this.currentBehavior?.name ?? "";
    if (data.currentAction !== undefined) this.currentActionEl.textContent = this.currentAction?.name ?? "";
  }
}

export function initBotBehaviorClient(vscode: VsCodeApi): BotBehaviorClient {
  const botBehavior = new BotBehaviorClient(vscode);

  window.addEventListener("message", (event: MessageEvent) => {
    if ("currentBehavior" in event.data || "currentAction" in event.data || "executionSettings" in event.data) {
      botBehavior.hydrate(event.data as BotBehaviorHydrateData);
    }
  });

  // Request initial state from server
  vscode.postMessage({ command: "botBehavior.currentBehavior" });
  vscode.postMessage({ command: "botBehavior.currentAction" });

  return botBehavior;
}
