// bot/bot.ts — IBot interface + Bot (root) and StoryBot (child)

import type { IBehaviorConfig, IBaseActionConfig } from "../behavior/behavior.js";

export interface IBotConfig {
  name: string;
  description: string;
  goal: string;
  instructions: string[];
  behaviorNames: string[];
  baseActionsPath: string;
  behaviorConfigs: IBehaviorConfig[];
  baseActionConfigs: IBaseActionConfig[];
}

export interface BotHydrateData {
  currentBot?: string;
  availableBots?: string[];
  botConfigs?: IBotConfig[];
}

/** Shared interface: Bot, BotServer, BotView, and client BotClient implement this. CLI output adapters implement IBotOutputAdapter instead. */
export interface IBot {
  switchBot(name: string): void;
  registerBot(config: IBotConfig): void;
  reset(): void;
  readonly name: string;
  readonly description: string;
  readonly goal: string;
  readonly instructions: string[];
  readonly behaviorNames: string[];
  readonly availableBots: string[];
  readonly currentBotConfig: IBotConfig | null;
  readonly botConfigs: IBotConfig[];
  hydrate?(data: BotHydrateData): void;
}

export class BotConfig implements IBotConfig {
  name: string;
  description: string;
  goal: string;
  instructions: string[];
  behaviorNames: string[];
  baseActionsPath: string;
  behaviorConfigs: IBehaviorConfig[];
  baseActionConfigs: IBaseActionConfig[];

  constructor(data: IBotConfig) {
    this.name = data.name;
    this.description = data.description;
    this.goal = data.goal;
    this.instructions = [...data.instructions];
    this.behaviorNames = [...data.behaviorNames];
    this.baseActionsPath = data.baseActionsPath;
    this.behaviorConfigs = data.behaviorConfigs.map((bc) => ({ ...bc, instructions: [...bc.instructions], actionsWorkflow: bc.actionsWorkflow.map((a) => ({ ...a, instructions: [...a.instructions] })) }));
    this.baseActionConfigs = data.baseActionConfigs.map((bac) => ({ ...bac, instructions: [...bac.instructions] }));
  }
}

export class Bot implements IBot {
  private _currentBotName: string = "";
  private _botConfigs: Map<string, BotConfig> = new Map();

  registerBot(config: IBotConfig): void {
    this._botConfigs.set(config.name, new BotConfig(config));
  }

  switchBot(name: string): void {
    if (!this._botConfigs.has(name)) {
      return;
    }
    this._currentBotName = name;
  }

  reset(): void {
    this._currentBotName = "";
    this._botConfigs.clear();
  }

  get name(): string {
    return this._currentBotName;
  }

  get description(): string {
    return this.currentBotConfig?.description ?? "";
  }

  get goal(): string {
    return this.currentBotConfig?.goal ?? "";
  }

  get instructions(): string[] {
    return this.currentBotConfig?.instructions ?? [];
  }

  get behaviorNames(): string[] {
    return this.currentBotConfig?.behaviorNames ?? [];
  }

  get availableBots(): string[] {
    return [...this._botConfigs.keys()];
  }

  get currentBotConfig(): IBotConfig | null {
    return this._botConfigs.get(this._currentBotName) ?? null;
  }

  get botConfigs(): IBotConfig[] {
    return [...this._botConfigs.values()];
  }

  hydrate(data: BotHydrateData): void {
    if (data.botConfigs !== undefined) {
      for (const config of data.botConfigs) {
        this._botConfigs.set(config.name, new BotConfig(config));
      }
    }
    if (data.currentBot !== undefined) {
      this._currentBotName = data.currentBot;
    }
  }
}

/** StoryBot — story-specific bot type. Domain root scaffolding: child class in root file. */
export class StoryBot extends Bot {}
