// context_folder/adapters/context_folder_json.ts — Machine-readable; for tooling
import type { IContextFolder } from "../context_folder.js";
import type { IContextFolderOutputAdapter } from "./context_folder_adapter.js";

export class ContextFolderJson implements IContextFolderOutputAdapter {
  constructor(private _contextFolder: IContextFolder) {}

  get path(): string {
    return JSON.stringify({ folderPath: this._contextFolder.folderPath });
  }

  get bot(): string {
    return JSON.stringify({
      botName: this._contextFolder.botInfo.name,
      botDirectory: this._contextFolder.botInfo.directory,
    });
  }

  get internals(): IContextFolder {
    return this._contextFolder;
  }
}
