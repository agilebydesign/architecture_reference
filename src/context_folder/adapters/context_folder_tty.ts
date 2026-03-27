// context_folder/adapters/context_folder_tty.ts — Human-readable terminal output
import type { IContextFolder } from "../context_folder.js";
import type { IContextFolderOutputAdapter } from "./context_folder_adapter.js";

export class ContextFolderTty implements IContextFolderOutputAdapter {
  constructor(private _contextFolder: IContextFolder) {}

  get path(): string {
    return `Context Folder: ${this._contextFolder.folderPath}\n`;
  }

  get bot(): string {
    return `Bot: ${this._contextFolder.botInfo.name}\n`;
  }

  get internals(): IContextFolder {
    return this._contextFolder;
  }
}
