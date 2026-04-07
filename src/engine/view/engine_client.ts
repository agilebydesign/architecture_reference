// engine/view/engine_client.ts — Client orchestrator: acquires VS Code API, loads section clients
// Compiled to JS for webview

import { initCounterClient } from "../../counter/view/counter_client.js";
import { initContextFolderClient } from "../../context_folder/view/context_folder_client.js";
import { initBotClient } from "../../bot/view/bot_client.js";
import { initBehaviorClient } from "../../behavior/view/behavior_client.js";

declare function acquireVsCodeApi(): { postMessage(message: unknown): void };

(function (): void {
  const vscode = acquireVsCodeApi();
  initCounterClient(vscode);
  initContextFolderClient(vscode);
  const botClient = initBotClient(vscode);
  const behaviorClient = initBehaviorClient(vscode);

  // Coordinate: when bot switches on client, forward its configs to behavior client
  const botSelectEl = document.getElementById("botSelect") as HTMLSelectElement;
  if (botSelectEl) {
    botSelectEl.addEventListener("change", () => {
      const config = botClient.currentBotConfig;
      if (config) {
        behaviorClient.loadBehaviors(config.behaviorNames, config.behaviorConfigs);
        behaviorClient.loadActions(config.baseActionConfigs);
        behaviorClient.renderTree(
          config.behaviorConfigs.map((b) => ({
            name: b.name,
            actions: [...b.actionsWorkflow].sort((a, c) => a.order - c.order).map((a) => ({
              name: a.name,
              executionSetting: a.executionSetting ?? "manual",
            })),
          })),
          behaviorClient.currentBehavior?.name ?? "",
          behaviorClient.currentAction?.name ?? ""
        );
      }
    });
  }
})();
