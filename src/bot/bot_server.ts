// bot/bot_server.ts — server domain: implements IBot via Bot, adds persistence + config loading
import { Bot } from "./bot.js";
import type { IBotConfig, BotHydrateData } from "./bot.js";
import type { IBehaviorConfig, IBaseActionConfig, IActionWorkflowEntry, ExecutionSetting } from "../behavior/behavior.js";
import * as fs from "fs";
import * as path from "path";

/** Maps canonical action names from agile_bots configs to base_actions folder names */
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

export class BotServer extends Bot {
  private _filePath: string;
  private _botConfigDir: string;

  constructor(filePath: string, botConfigDir: string) {
    super();
    this._filePath = filePath;
    this._botConfigDir = botConfigDir;
    this._loadBotConfigs();
    this._loadPersistence();
    // Auto-select first bot if none persisted
    if (!this.name && this.availableBots.length > 0) {
      super.switchBot(this.availableBots[0]);
      this._save();
    }
  }

  private _loadBotConfigs(): void {
    try {
      // botConfigDir is e.g. "bots/" — contains subdirectories per bot
      const entries = fs.readdirSync(this._botConfigDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const botDir = path.join(this._botConfigDir, entry.name);
        const botConfigPath = path.join(botDir, "bot_config.json");
        if (!fs.existsSync(botConfigPath)) continue;

        const botConfig = this._loadSingleBotConfig(botDir, botConfigPath);
        if (botConfig) {
          super.registerBot(botConfig);
        }
      }
    } catch (_) {
      // Config directory missing or invalid — start with empty state
    }
  }

  private _loadSingleBotConfig(botDir: string, botConfigPath: string): IBotConfig | null {
    try {
      const raw = JSON.parse(fs.readFileSync(botConfigPath, "utf8"));
      const name: string = raw.name ?? path.basename(botDir);
      const behaviorNamesList: string[] = raw.behaviors ?? [];
      const projectRoot = path.dirname(this._botConfigDir);
      const baseActionsPath = raw.baseActionsPath
        ? path.resolve(projectRoot, raw.baseActionsPath as string)
        : path.join(projectRoot, "base_actions");

      const behaviorConfigs = this._loadBehaviorConfigs(botDir, behaviorNamesList, projectRoot);
      const baseActionConfigs = this._loadBaseActionConfigs(baseActionsPath);

      return {
        name,
        description: (raw.description as string) ?? "",
        goal: (raw.goal as string) ?? "",
        instructions: (raw.instructions as string[]) ?? [],
        behaviorNames: behaviorNamesList,
        baseActionsPath: baseActionsPath,
        behaviorConfigs,
        baseActionConfigs,
      };
    } catch (_) {
      return null;
    }
  }

  private _loadBehaviorConfigs(botDir: string, behaviorNames: string[], projectRoot: string): IBehaviorConfig[] {
    const configs: IBehaviorConfig[] = [];
    for (const behaviorName of behaviorNames) {
      const behaviorPath = path.join(botDir, "behaviors", behaviorName, "behavior.json");
      if (!fs.existsSync(behaviorPath)) continue;
      const raw = JSON.parse(fs.readFileSync(behaviorPath, "utf8"));
      configs.push(this._parseBehaviorJson(behaviorName, raw));
    }
    return configs;
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

  private _pendingBot: string | null = null;

  private _loadPersistence(): void {
    try {
      const data = JSON.parse(fs.readFileSync(this._filePath, "utf8"));
      if (data.currentBot) {
        // Store for deferred application — bot configs may not be loaded yet
        this._pendingBot = data.currentBot;
        // Try to switch now (works if configs already loaded from dir)
        if (this.availableBots.includes(data.currentBot)) {
          super.switchBot(data.currentBot);
        }
      }
    } catch (_) {
      // File doesn't exist or is invalid — keep config-loaded state
    }
  }

  override registerBot(config: IBotConfig): void {
    super.registerBot(config);
    // Apply pending bot selection once the target bot is registered
    if (this._pendingBot && config.name === this._pendingBot) {
      super.switchBot(this._pendingBot);
      this._pendingBot = null;
    }
    this._save();
  }

  private _save(): void {
    fs.writeFileSync(
      this._filePath,
      JSON.stringify({
        currentBot: this.name,
      })
    );
  }

  override switchBot(name: string): void {
    super.switchBot(name);
    this._save();
  }

  override reset(): void {
    super.reset();
    this._save();
  }
}
