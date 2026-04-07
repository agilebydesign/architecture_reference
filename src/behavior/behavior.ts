// behavior/behavior.ts — IBehavior interface + Behavior (root), BehaviorConfig, ActionConfig

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

export interface BehaviorHydrateData {
  currentBehavior?: string;
  currentAction?: string;
  executionSettings?: Record<string, ExecutionSetting>;
  /** Full init payload — sent once on webview open so client can populate domain. */
  allowedBehaviors?: string[];
  behaviorConfigs?: IBehaviorConfig[];
  baseActionConfigs?: IBaseActionConfig[];
}

export interface NavigationResult {
  status: "success" | "complete" | "error";
  message: string;
  behavior?: string;
  action?: string;
}

export interface PositionResult {
  status: "success" | "error";
  behavior?: string;
  action?: string;
  position?: string;
  message?: string;
}

/** Shared interface: Behavior, BehaviorServer, BehaviorView, and client implement this. */
export interface IBehavior {
  loadBehaviors(allowedBehaviors: string[], behaviorConfigs: IBehaviorConfig[]): void;
  loadActions(baseActionConfigs?: IBaseActionConfig[]): void;
  readonly currentBehavior: IBehaviorConfig | null;
  readonly currentAction: IActionConfig | null;
  readonly behaviors: IBehaviorConfig[];
  readonly actions: IActionConfig[];
  readonly baseActionConfigs: IBaseActionConfig[];
  readonly behaviorNames: string[];
  readonly actionNames: string[];
  readonly executionSettings: Record<string, ExecutionSetting>;
  setExecutionSetting(key: string, value: ExecutionSetting): void;
  navigateToBehavior(name: string): void;
  navigateToAction(name: string): void;
  next(): NavigationResult;
  back(): NavigationResult;
  pos(): PositionResult;
  tree(): string;
  nextBehavior(): IBehaviorConfig | null;
  previousBehavior(): IBehaviorConfig | null;
  nextAction(): IActionConfig | null;
  findBehavior(name: string): IBehaviorConfig | null;
  findAction(name: string): IActionConfig | null;
  checkBehaviorExists(name: string): boolean;
  isFinalAction(): boolean;
  closeCurrent(): NavigationResult;
  hydrate?(data: BehaviorHydrateData): void;
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

export class Behavior implements IBehavior {
  private _behaviors: IBehaviorConfig[] = [];
  private _currentBehaviorIndex: number = -1;
  private _actions: IActionConfig[] = [];
  private _currentActionIndex: number = -1;
  private _executionSettings: Record<string, ExecutionSetting> = {};
  private _baseActionConfigs: IBaseActionConfig[] = [];

  loadBehaviors(allowedBehaviors: string[], behaviorConfigs: IBehaviorConfig[]): void {
    const allowed = behaviorConfigs.filter((b) => allowedBehaviors.includes(b.name));
    this._behaviors = allowed
      .map((b) => new BehaviorConfig(b))
      .sort((a, b) => a.order - b.order);
    this._currentBehaviorIndex = this._behaviors.length > 0 ? 0 : -1;
    this._actions = [];
    this._currentActionIndex = -1;
  }

  loadActions(baseActionConfigs?: IBaseActionConfig[]): void {
    if (baseActionConfigs) {
      this._baseActionConfigs = baseActionConfigs;
    }

    const behavior = this.currentBehavior;
    if (!behavior) return;

    const baseMap = new Map<string, IBaseActionConfig>();
    for (const bc of this._baseActionConfigs) {
      baseMap.set(bc.name, bc);
    }

    const workflowActions = [...behavior.actionsWorkflow].sort((a, b) => a.order - b.order);

    this._actions = workflowActions.map((entry) => {
      const base = baseMap.get(entry.name);
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

  get baseActionConfigs(): IBaseActionConfig[] {
    return [...this._baseActionConfigs];
  }

  get behaviorNames(): string[] {
    return this._behaviors.map((b) => b.name);
  }

  get actionNames(): string[] {
    return this._actions.map((a) => a.name);
  }

  get executionSettings(): Record<string, ExecutionSetting> {
    return { ...this._executionSettings };
  }

  setExecutionSetting(key: string, value: ExecutionSetting): void {
    this._executionSettings[key] = value;
  }

  navigateToBehavior(name: string): void {
    const index = this._behaviors.findIndex((b) => b.name === name);
    if (index < 0) {
      throw new Error(`Behavior '${name}' not found`);
    }
    this._currentBehaviorIndex = index;
    this.loadActions();
  }

  navigateToAction(name: string): void {
    const index = this._actions.findIndex((a) => a.name === name);
    if (index < 0) {
      throw new Error(`Action '${name}' not found`);
    }
    this._currentActionIndex = index;
  }

  next(): NavigationResult {
    if (this._currentBehaviorIndex < 0) {
      return { status: "error", message: "No current behavior set" };
    }

    if (this._currentActionIndex < this._actions.length - 1) {
      this._currentActionIndex++;
      return {
        status: "success",
        message: `Advanced to action: ${this.currentAction!.name}`,
        behavior: this.currentBehavior!.name,
        action: this.currentAction!.name,
      };
    }

    if (this._currentBehaviorIndex < this._behaviors.length - 1) {
      this._currentBehaviorIndex++;
      this.loadActions();
      return {
        status: "success",
        message: `Advanced to behavior: ${this.currentBehavior!.name}`,
        behavior: this.currentBehavior!.name,
        action: this.currentAction?.name,
      };
    }

    return { status: "complete", message: "Workflow complete - no more behaviors" };
  }

  back(): NavigationResult {
    if (this._currentBehaviorIndex < 0) {
      return { status: "error", message: "No current behavior set" };
    }

    if (this._currentActionIndex > 0) {
      this._currentActionIndex--;
      return {
        status: "success",
        message: `Moved back to action: ${this.currentAction!.name}`,
        behavior: this.currentBehavior!.name,
        action: this.currentAction!.name,
      };
    }

    if (this._currentBehaviorIndex > 0) {
      this._currentBehaviorIndex--;
      this.loadActions();
      if (this._actions.length > 0) {
        this._currentActionIndex = this._actions.length - 1;
      }
      return {
        status: "success",
        message: `Moved back to behavior: ${this.currentBehavior!.name}`,
        behavior: this.currentBehavior!.name,
        action: this.currentAction?.name,
      };
    }

    return {
      status: "error",
      message: `Already at first action in ${this.currentBehavior!.name}`,
      behavior: this.currentBehavior!.name,
      action: this.currentAction?.name,
    };
  }

  pos(): PositionResult {
    if (!this.currentBehavior) {
      return { status: "error", message: "No behavior is currently active" };
    }
    if (!this.currentAction) {
      return { status: "error", message: `No action is currently active in ${this.currentBehavior.name}` };
    }
    return {
      status: "success",
      behavior: this.currentBehavior.name,
      action: this.currentAction.name,
      position: `${this.currentBehavior.name}.${this.currentAction.name}`,
    };
  }

  tree(): string {
    const lines: string[] = [];
    for (let i = 0; i < this._behaviors.length; i++) {
      const behavior = this._behaviors[i];
      const isLast = i === this._behaviors.length - 1;
      const isCurrent = i === this._currentBehaviorIndex;
      const prefix = isLast ? "└──" : "├──";
      const marker = isCurrent ? "➤ " : "";
      lines.push(`${prefix} ${marker}${behavior.name}`);

      const workflow = [...behavior.actionsWorkflow].sort((a, b) => a.order - b.order);
      for (let j = 0; j < workflow.length; j++) {
        const action = workflow[j];
        const isLastAction = j === workflow.length - 1;
        const branch = isLast ? "    " : "│   ";
        const actionPrefix = isLastAction ? "└──" : "├──";
        const isCurrentAction = isCurrent && this._actions[this._currentActionIndex]?.name === action.name;
        const actionMarker = isCurrentAction ? "➤ " : "";
        lines.push(`${branch}${actionPrefix} ${actionMarker}${action.name}`);
      }
    }
    return lines.join("\n");
  }

  nextBehavior(): IBehaviorConfig | null {
    const nextIndex = this._currentBehaviorIndex + 1;
    return nextIndex < this._behaviors.length ? this._behaviors[nextIndex] : null;
  }

  previousBehavior(): IBehaviorConfig | null {
    const prevIndex = this._currentBehaviorIndex - 1;
    return prevIndex >= 0 ? this._behaviors[prevIndex] : null;
  }

  nextAction(): IActionConfig | null {
    const nextIndex = this._currentActionIndex + 1;
    return nextIndex < this._actions.length ? this._actions[nextIndex] : null;
  }

  findBehavior(name: string): IBehaviorConfig | null {
    return this._behaviors.find((b) => b.name === name) ?? null;
  }

  findAction(name: string): IActionConfig | null {
    return this._actions.find((a) => a.name === name) ?? null;
  }

  checkBehaviorExists(name: string): boolean {
    return this._behaviors.some((b) => b.name === name);
  }

  isFinalAction(): boolean {
    return this._actions.length > 0 && this._currentActionIndex === this._actions.length - 1;
  }

  closeCurrent(): NavigationResult {
    return this.next();
  }

  hydrate(data: BehaviorHydrateData): void {
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
