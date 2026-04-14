// instructions/view/instructions_view.ts — Server view: implements IInstructions, delegates to domain, posts to webview
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { BaseView } from "../../engine/base_view";
import type { IInstructions, InstructionsHydrateData } from "../instructions";

export class InstructionsView extends BaseView implements IInstructions {
  /** Raw template HTML. View loads and stores; tests use for DOM fixtures. Single source of truth. */
  static get template(): string {
    if (!(InstructionsView as { _template?: string })._template) {
      const p = path.join(__dirname, "Instructions.html");
      (InstructionsView as { _template?: string })._template = fs.readFileSync(p, "utf8");
    }
    return (InstructionsView as { _template?: string })._template!;
  }

  private _panel: vscode.WebviewPanel;
  private _instructions: IInstructions;

  constructor(
    panel: vscode.WebviewPanel,
    instructions: IInstructions,
    extensionUri: vscode.Uri
  ) {
    super(extensionUri);
    this._panel = panel;
    this._instructions = instructions;
  }

  get behaviorInstructions(): string[] {
    return this._instructions.behaviorInstructions;
  }

  get actionInstructions(): string[] {
    return this._instructions.actionInstructions;
  }

  get isEmpty(): boolean {
    return this._instructions.isEmpty;
  }

  setBehaviorInstructions(instructions: string[]): void {
    this._instructions.setBehaviorInstructions(instructions);
    this._postCurrentState();
  }

  setActionInstructions(instructions: string[]): void {
    this._instructions.setActionInstructions(instructions);
    this._postCurrentState();
  }

  clear(): void {
    this._instructions.clear();
    this._postCurrentState();
  }

  hydrate(data: InstructionsHydrateData): void {
    this._instructions.hydrate?.(data);
    this._postCurrentState();
  }

  private _postCurrentState(): void {
    this._panel.webview.postMessage({
      behaviorInstructions: this._instructions.behaviorInstructions,
      actionInstructions: this._instructions.actionInstructions,
    });
  }

  requestInit(): void {
    this._panel.webview.postMessage({
      behaviorInstructions: this._instructions.behaviorInstructions,
      actionInstructions: this._instructions.actionInstructions,
    });
  }

  getHtml(): string {
    const instructionsCssUri = this._panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "dist", "instructions", "view", "instructions.css")
    );
    return this.renderTemplate("dist/instructions/view/Instructions.html", {
      instructionsCssUri: instructionsCssUri.toString(),
    });
  }

  /** HTML for test fixtures (placeholder defaults). Tests use this for JSDOM. */
  static getFixtureHtml(data?: { instructionsCssUri?: string }): string {
    const d = { instructionsCssUri: "", ...data };
    let html = InstructionsView.template;
    for (const [k, v] of Object.entries(d)) html = html.split(`{{${k}}}`).join(String(v));
    return html;
  }
}
