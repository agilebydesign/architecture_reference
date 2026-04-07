// behavior/behavior_server.ts — server domain: implements IBehavior via Behavior, adds persistence
import { Behavior } from "./behavior.js";
import type { IBehaviorConfig, IBaseActionConfig, ExecutionSetting, NavigationResult, BehaviorHydrateData } from "./behavior.js";
import * as fs from "fs";

export class BehaviorServer extends Behavior {
  private _filePath: string;
  private _pendingHydration: BehaviorHydrateData | null = null;

  constructor(filePath: string) {
    super();
    this._filePath = filePath;
    this._loadPersistence();
  }

  private _loadPersistence(): void {
    try {
      const data = JSON.parse(fs.readFileSync(this._filePath, "utf8"));
      // Defer hydration until behaviors/actions are loaded (hydrate needs populated arrays)
      this._pendingHydration = data;
      this.hydrate(data);
    } catch (_) {
      // File doesn't exist or is invalid — keep default state
    }
  }

  private _save(): void {
    fs.writeFileSync(
      this._filePath,
      JSON.stringify({
        currentBehavior: this.currentBehavior?.name ?? "",
        currentAction: this.currentAction?.name ?? "",
        executionSettings: this.executionSettings,
      })
    );
  }

  override loadBehaviors(allowedBehaviors: string[], behaviorConfigs: IBehaviorConfig[]): void {
    super.loadBehaviors(allowedBehaviors, behaviorConfigs);
    if (this._pendingHydration) {
      this.hydrate(this._pendingHydration);
    }
    this._save();
  }

  override loadActions(baseActionConfigs?: IBaseActionConfig[]): void {
    super.loadActions(baseActionConfigs);
    if (this._pendingHydration) {
      this.hydrate(this._pendingHydration);
      this._pendingHydration = null;
    }
    this._save();
  }

  override setExecutionSetting(key: string, value: ExecutionSetting): void {
    super.setExecutionSetting(key, value);
    this._save();
  }

  override navigateToBehavior(name: string): void {
    super.navigateToBehavior(name);
    this._save();
  }

  override navigateToAction(name: string): void {
    super.navigateToAction(name);
    this._save();
  }

  override next(): NavigationResult {
    const result = super.next();
    this._save();
    return result;
  }

  override back(): NavigationResult {
    const result = super.back();
    this._save();
    return result;
  }

  override closeCurrent(): NavigationResult {
    const result = super.closeCurrent();
    this._save();
    return result;
  }
}
