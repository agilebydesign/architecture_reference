// context_folder/view/context_folder_client.ts — Client: extends ContextFolder with DOM updates and server sync

import { ContextFolder, type ContextFolderHydrateData } from "../context_folder.js";

interface VsCodeApi {
  postMessage(message: unknown): void;
}

/** Extends ContextFolder with DOM updates and server synchronization */
export class ContextFolderClient extends ContextFolder {
  private vscode: VsCodeApi;
  private folderPathInput: HTMLInputElement;
  private botNameEl: HTMLSpanElement;
  private botDirectoryEl: HTMLSpanElement;

  constructor(vscode: VsCodeApi) {
    super();
    this.vscode = vscode;
    this.folderPathInput = document.getElementById("folderPath") as HTMLInputElement;
    this.botNameEl = document.getElementById("botName") as HTMLSpanElement;
    this.botDirectoryEl = document.getElementById("botDirectory") as HTMLSpanElement;
  }

  private syncToServer(command: string, value?: unknown): void {
    this.vscode.postMessage(value !== undefined ? { command, value } : { command });
  }

  override updatePath(directory: string): void {
    super.updatePath(directory);
    this.folderPathInput.value = this.folderPath;
    this.syncToServer("contextFolder.updatePath", directory);
  }

  override switchBot(name: string): void {
    super.switchBot(name);
    this.botNameEl.textContent = this.botInfo.name;
    this.botDirectoryEl.textContent = this.botInfo.directory;
    this.syncToServer("contextFolder.switchBot", name);
  }

  override reset(): void {
    super.reset();
    this.folderPathInput.value = "";
    this.botNameEl.textContent = "";
    this.botDirectoryEl.textContent = "";
    this.syncToServer("contextFolder.reset");
  }

  browse(): void {
    this.syncToServer("contextFolder.browse");
  }

  override hydrate(data: ContextFolderHydrateData): void {
    super.hydrate(data);
    if (data.folderPath !== undefined) this.folderPathInput.value = this.folderPath;
    if (data.botName !== undefined) this.botNameEl.textContent = this.botInfo.name;
    if (data.botDirectory !== undefined) this.botDirectoryEl.textContent = this.botInfo.directory;
  }
}

export function initContextFolderClient(vscode: VsCodeApi): ContextFolderClient {
  const folderPathInput = document.getElementById("folderPath") as HTMLInputElement;
  const browseBtn = document.getElementById("browseBtn") as HTMLButtonElement;

  const contextFolder = new ContextFolderClient(vscode);

  folderPathInput.addEventListener("change", () => contextFolder.updatePath(folderPathInput.value));
  browseBtn.addEventListener("click", () => contextFolder.browse());

  window.addEventListener("message", (event: MessageEvent) => {
    if ("folderPath" in event.data || "botName" in event.data || "botDirectory" in event.data) {
      contextFolder.hydrate(event.data as ContextFolderHydrateData);
    }
  });

  // Request initial state from server
  vscode.postMessage({ command: "contextFolder.folderPath" });
  vscode.postMessage({ command: "contextFolder.botInfo.name" });

  return contextFolder;
}
