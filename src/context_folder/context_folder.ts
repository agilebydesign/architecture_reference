// context_folder/context_folder.ts — IContextFolder interface + ContextFolder (root) and BotInfo (child)

export interface IBotInfo {
  name: string;
  directory: string;
}

export interface ContextFolderHydrateData {
  folderPath?: string;
  botName?: string;
  botDirectory?: string;
  availableBots?: string[];
}

/** Shared interface: ContextFolder, ContextFolderServer, ContextFolderView, and client domContextFolder implement this. CLI output adapters implement IContextFolderOutputAdapter instead. */
export interface IContextFolder {
  updatePath(directory: string): void;
  switchBot(name: string): void;
  reset(): void;
  readonly folderPath: string;
  botInfo: IBotInfo;
  readonly availableBots: string[];
  hydrate?(data: ContextFolderHydrateData): void;
}

export class BotInfo implements IBotInfo {
  name: string = "";
  directory: string = "";
}

export class ContextFolder implements IContextFolder {
  private _folderPath: string = "";
  private _availableBots: string[] = [];
  botInfo: BotInfo = new BotInfo();

  updatePath(directory: string): void {
    this._folderPath = directory;
  }

  get folderPath(): string {
    return this._folderPath;
  }

  switchBot(name: string): void {
    if (this._availableBots.length > 0 && !this._availableBots.includes(name)) {
      return;
    }
    this.botInfo.name = name;
  }

  get availableBots(): string[] {
    return [...this._availableBots];
  }

  reset(): void {
    this._folderPath = "";
    this.botInfo.name = "";
    this.botInfo.directory = "";
    this._availableBots = [];
  }

  hydrate(data: ContextFolderHydrateData): void {
    if (data.folderPath !== undefined) this._folderPath = data.folderPath;
    if (data.botName !== undefined) this.botInfo.name = data.botName;
    if (data.botDirectory !== undefined) this.botInfo.directory = data.botDirectory;
    if (data.availableBots !== undefined) this._availableBots = [...data.availableBots];
  }
}
