// engine/view/engine_client.ts — Client orchestrator: acquires VS Code API, loads section clients
// Compiled to JS for webview

import { initCounterClient } from "../../counter/view/counter_client.js";
import { initContextFolderClient } from "../../context_folder/view/context_folder_client.js";
import { initBotBehaviorClient } from "../../bot_behavior/view/bot_behavior_client.js";

declare function acquireVsCodeApi(): { postMessage(message: unknown): void };

(function (): void {
  const vscode = acquireVsCodeApi();
  initCounterClient(vscode);
  initContextFolderClient(vscode);
  initBotBehaviorClient(vscode);
})();
