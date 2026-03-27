// context_folder/adapters/context_folder_adapter.ts — CLI output adapter interface
import type { IContextFolder } from "../context_folder.js";

/** CLI output adapters: wrap IContextFolder, expose formatted path and bot (strings). */
export interface IContextFolderOutputAdapter {
  readonly path: string;
  readonly bot: string;
  readonly internals: IContextFolder;
}
