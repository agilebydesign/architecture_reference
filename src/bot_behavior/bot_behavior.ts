// bot_behavior/bot_behavior.ts — IBotBehavior interface + BotBehavior (root), BehaviorConfig, ActionConfig

export type ExecutionSetting = "skip" | "manual" | "combine_with_next";

export interface IActionWorkflowEntry {
  name: string;
  order: number;
  nextAction: string | null;
  instructions: string[];
  executionSetting?: ExecutionSetting;
}

export interface IBehaviorConfig {
  name: string;
  order: number;
  description: string;
  goal: string;
  inputs: string;
  outputs: string;
  instructions: string[];
  actionsWorkflow: IActionWorkflowEntry[];
}

export interface IBaseActionConfig {
  name: string;
  description: string;
  instructions: string[];
}

export interface IActionConfig {
  name: string;
  order: number;
  nextAction: string | null;
  instructions: string[];
  executionSetting: ExecutionSetting;
}

export interface BotBehaviorHydrateData {
  currentBehavior?: string;
  currentAction?: string;
  executionSettings?: Record<string, ExecutionSetting>;
}

/** Shared interface: BotBehavior, BotBehaviorServer, BotBehaviorView, and client implement this. */
export interface IBotBehavior {
  loadBehaviors(allowedBehaviors: string[], behaviorConfigs: IBehaviorConfig[]): void;
  loadActions(baseActionConfigs?: IBaseActionConfig[]): void;
  readonly currentBehavior: IBehaviorConfig | null;
  readonly currentAction: IActionConfig | null;
  readonly behaviors: IBehaviorConfig[];
  readonly actions: IActionConfig[];
  readonly executionSettings: Record<string, ExecutionSetting>;
  setExecutionSetting(key: string, value: ExecutionSetting): void;
  hydrate?(data: BotBehaviorHydrateData): void;
}

export class BehaviorConfig implements IBehaviorConfig {
  name: string;
  order: number;
  description: string;
  goal: string;
  inputs: string;
  outputs: string;
  instructions: string[];
  actionsWorkflow: IActionWorkflowEntry[];

  constructor(data: IBehaviorConfig) {
    this.name = data.name;
    this.order = data.order;
    this.description = data.description;
    this.goal = data.goal;
    this.inputs = data.inputs;
    this.outputs = data.outputs;
    this.instructions = [...data.instructions];
    this.actionsWorkflow = data.actionsWorkflow.map((a) => ({ ...a, instructions: [...a.instructions] }));
  }
}

export class ActionConfig implements IActionConfig {
  name: string;
  order: number;
  nextAction: string | null;
  instructions: string[];
  executionSetting: ExecutionSetting;

  constructor(data: IActionConfig) {
    this.name = data.name;
    this.order = data.order;
    this.nextAction = data.nextAction;
    this.instructions = [...data.instructions];
    this.executionSetting = data.executionSetting;
  }
}

export class BotBehavior implements IBotBehavior {
  private _behaviors: IBehaviorConfig[] = [];
  private _currentBehaviorIndex: number = -1;
  private _actions: IActionConfig[] = [];
  private _currentActionIndex: number = -1;
  private _executionSettings: Record<string, ExecutionSetting> = {};

  loadBehaviors(allowedBehaviors: string[], behaviorConfigs: IBehaviorConfig[]): void {
    // Filter by allowed list
    const allowed = behaviorConfigs.filter((b) => allowedBehaviors.includes(b.name));
    // Sort by order
    this._behaviors = allowed
      .map((b) => new BehaviorConfig(b))
      .sort((a, b) => a.order - b.order);
    // Set first as current
    this._currentBehaviorIndex = this._behaviors.length > 0 ? 0 : -1;
    // Clear actions when behaviors change
    this._actions = [];
    this._currentActionIndex = -1;
  }

  loadActions(baseActionConfigs?: IBaseActionConfig[]): void {
    const behavior = this.currentBehavior;
    if (!behavior) return;

    const baseMap = new Map<string, IBaseActionConfig>();
    if (baseActionConfigs) {
      for (const bc of baseActionConfigs) {
        baseMap.set(bc.name, bc);
      }
    }

    // Build actions from behavior's workflow, merge with base configs
    const workflowActions = [...behavior.actionsWorkflow].sort((a, b) => a.order - b.order);

    this._actions = workflowActions.map((entry) => {
      const base = baseMap.get(entry.name);
      // Merge instructions: base instructions first, then behavior-specific
      const mergedInstructions = [
        ...(base?.instructions ?? []),
        ...entry.instructions,
      ];

      return new ActionConfig({
        name: entry.name,
        order: entry.order,
        nextAction: entry.nextAction,
        instructions: mergedInstructions,
        executionSetting: entry.executionSetting ?? "manual",
      });
    });

    // Set first as current
    this._currentActionIndex = this._actions.length > 0 ? 0 : -1;
  }

  get currentBehavior(): IBehaviorConfig | null {
    return this._currentBehaviorIndex >= 0 ? this._behaviors[this._currentBehaviorIndex] : null;
  }

  get currentAction(): IActionConfig | null {
    return this._currentActionIndex >= 0 ? this._actions[this._currentActionIndex] : null;
  }

  get behaviors(): IBehaviorConfig[] {
    return [...this._behaviors];
  }

  get actions(): IActionConfig[] {
    return [...this._actions];
  }

  get executionSettings(): Record<string, ExecutionSetting> {
    return { ...this._executionSettings };
  }

  setExecutionSetting(key: string, value: ExecutionSetting): void {
    this._executionSettings[key] = value;
  }

  hydrate(data: BotBehaviorHydrateData): void {
    if (data.currentBehavior !== undefined) {
      this._currentBehaviorIndex = this._behaviors.findIndex((b) => b.name === data.currentBehavior);
    }
    if (data.currentAction !== undefined) {
      this._currentActionIndex = this._actions.findIndex((a) => a.name === data.currentAction);
    }
    if (data.executionSettings !== undefined) {
      this._executionSettings = { ...data.executionSettings };
    }
  }
}
