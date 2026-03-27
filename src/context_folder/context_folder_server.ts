// context_folder/context_folder_server.ts — server domain: implements IContextFolder via ContextFolder, adds persistence
import { ContextFolder } from "./context_folder.js";
import * as fs from "fs";

export class ContextFolderServer extends ContextFolder {
  private _configPath: string;

  constructor(configPath: string) {
    super();
    this._configPath = configPath;
    this._load();
  }

  private _load(): void {
    try {
      const data = JSON.parse(fs.readFileSync(this._configPath, "utf8"));
      this.hydrate(data);
    } catch (_) {
      // File doesn't exist or is invalid — start fresh
    }
  }

  private _save(): void {
    fs.writeFileSync(
      this._configPath,
      JSON.stringify({
        folderPath: this.folderPath,
        botName: this.botInfo.name,
        botDirectory: this.botInfo.directory,
        availableBots: this.availableBots,
      })
    );
  }

  override updatePath(directory: string): void {
    super.updatePath(directory);
    this._save();
  }

  override switchBot(name: string): void {
    super.switchBot(name);
    this._save();
  }

  override reset(): void {
    super.reset();
    this._save();
  }
}
