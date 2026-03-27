// context_folder/adapters/context_folder_markdown.ts — Formatted for docs/panels
import type { IContextFolder } from "../context_folder.js";
import type { IContextFolderOutputAdapter } from "./context_folder_adapter.js";

export class ContextFolderMarkdown implements IContextFolderOutputAdapter {
  constructor(private _contextFolder: IContextFolder) {}

  get path(): string {
    return `## Context Folder\n\n**Path:** ${this._contextFolder.folderPath}\n`;
  }

  get bot(): string {
    return `## Bot\n\n**Name:** ${this._contextFolder.botInfo.name}\n`;
  }

  get internals(): IContextFolder {
    return this._contextFolder;
  }
}
