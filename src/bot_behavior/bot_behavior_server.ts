// bot_behavior/bot_behavior_server.ts — server domain: implements IBotBehavior via BotBehavior, adds persistence + config loading
import { BotBehavior } from "./bot_behavior.js";
import type { IBehaviorConfig, IBaseActionConfig, IActionWorkflowEntry, ExecutionSetting } from "./bot_behavior.js";
import * as fs from "fs";
import * as path from "path";

/** Maps canonical action names to base_actions folder names */
const ACTION_NAME_MAP: Record<string, string> = {
  render_output: "render",
  build_knowledge: "build",
  validate_rules: "validate",
  clarify_context: "clarify",
  gather_context: "clarify",
  decide_strategy: "strategy",
};

function normalizeActionName(name: string): string {
  return ACTION_NAME_MAP[name] ?? name;
}

export class BotBehaviorServer extends BotBehavior {
  private _filePath: string;
  private _botConfigDir: string;

  constructor(filePath: string, botConfigDir: string) {
    super();
    this._filePath = filePath;
    this._botConfigDir = botConfigDir;
    this._loadBotConfig();
    this._loadPersistence();
  }

  private _loadBotConfig(): void {
    try {
      const botConfigPath = path.join(this._botConfigDir, "bot_config.json");
      const botConfig = JSON.parse(fs.readFileSync(botConfigPath, "utf8"));
      const allowedBehaviors: string[] = botConfig.behaviors ?? [];
      // Project root is two levels up from botConfigDir (e.g., bots/story_bot -> project root)
      const projectRoot = path.dirname(path.dirname(this._botConfigDir));

      // Load behavior configs from behavior.json files
      const behaviorConfigs: IBehaviorConfig[] = [];
      let baseActionsPath = path.join(projectRoot, "base_actions"); // default
      for (const behaviorName of allowedBehaviors) {
        const behaviorPath = path.join(this._botConfigDir, "behaviors", behaviorName, "behavior.json");
        if (!fs.existsSync(behaviorPath)) continue;
        const raw = JSON.parse(fs.readFileSync(behaviorPath, "utf8"));
        // Each behavior provides its own baseActionsPath (relative to project root)
        if (raw.baseActionsPath) {
          baseActionsPath = path.resolve(projectRoot, raw.baseActionsPath as string);
        }
        behaviorConfigs.push(this._parseBehaviorJson(behaviorName, raw));
      }

      // Load base action configs (resolved from the last seen baseActionsPath)
      const baseActionConfigs = this._loadBaseActionConfigs(baseActionsPath);

      // Load into domain
      super.loadBehaviors(allowedBehaviors, behaviorConfigs);
      super.loadActions(baseActionConfigs);
    } catch (_) {
      // Config files missing or invalid — start with empty state
    }
  }

  private _parseBehaviorJson(name: string, raw: Record<string, unknown>): IBehaviorConfig {
    const workflow = raw.actions_workflow as { actions?: Record<string, unknown>[] } | undefined;
    const actions: IActionWorkflowEntry[] = (workflow?.actions ?? []).map((a: Record<string, unknown>, i: number) => ({
      name: normalizeActionName(a.name as string),
      order: (a.order as number) ?? i + 1,
      nextAction: a.next_action != null ? normalizeActionName(a.next_action as string) : null,
      instructions: (a.instructions as string[]) ?? [],
      executionSetting: a.auto_confirm === true ? "skip" as ExecutionSetting : "manual" as ExecutionSetting,
    }));

    return {
      name,
      order: (raw.order as number) ?? 0,
      description: (raw.description as string) ?? "",
      goal: (raw.goal as string) ?? "",
      inputs: (raw.inputs as string) ?? "",
      outputs: (raw.outputs as string) ?? "",
      instructions: (raw.instructions as string[]) ?? [],
      actionsWorkflow: actions,
    };
  }

  private _loadBaseActionConfigs(baseActionsPath: string): IBaseActionConfig[] {
    const configs: IBaseActionConfig[] = [];
    const actionDirs = ["clarify", "strategy", "build", "validate", "render"];
    for (const dir of actionDirs) {
      const configPath = path.join(baseActionsPath, dir, "action_config.json");
      if (!fs.existsSync(configPath)) continue;
      const raw = JSON.parse(fs.readFileSync(configPath, "utf8"));
      configs.push({
        name: dir,
        description: raw.description ?? "",
        instructions: raw.instructions ?? [],
      });
    }
    return configs;
  }

  private _loadPersistence(): void {
    try {
      const data = JSON.parse(fs.readFileSync(this._filePath, "utf8"));
      this.hydrate(data);
    } catch (_) {
      // File doesn't exist or is invalid — keep config-loaded state
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
    this._save();
  }

  override loadActions(baseActionConfigs?: IBaseActionConfig[]): void {
    super.loadActions(baseActionConfigs);
    this._save();
  }

  override setExecutionSetting(key: string, value: ExecutionSetting): void {
    super.setExecutionSetting(key, value);
    this._save();
  }
}
