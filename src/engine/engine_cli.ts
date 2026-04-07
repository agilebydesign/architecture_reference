// engine/engine_cli.ts — CLI entry point: parse args, lookup on Engine, choose adapter
import { Engine } from "./engine.js";
import { CounterTty } from "../counter/adapters/counter_tty.js";
import { CounterMarkdown } from "../counter/adapters/counter_markdown.js";
import { CounterJson } from "../counter/adapters/counter_json.js";
import type { ICounterOutputAdapter } from "../counter/adapters/counter_adapter.js";
import { ContextFolderTty } from "../context_folder/adapters/context_folder_tty.js";
import { ContextFolderMarkdown } from "../context_folder/adapters/context_folder_markdown.js";
import { ContextFolderJson } from "../context_folder/adapters/context_folder_json.js";
import type { IContextFolderOutputAdapter } from "../context_folder/adapters/context_folder_adapter.js";
import { BotTty } from "../bot/adapters/bot_tty.js";
import { BotMarkdown } from "../bot/adapters/bot_markdown.js";
import { BotJson } from "../bot/adapters/bot_json.js";
import type { IBotOutputAdapter } from "../bot/adapters/bot_adapter.js";
import { BehaviorTty } from "../behavior/adapters/behavior_tty.js";
import { BehaviorMarkdown } from "../behavior/adapters/behavior_markdown.js";
import { BehaviorJson } from "../behavior/adapters/behavior_json.js";
import type { IBehaviorOutputAdapter } from "../behavior/adapters/behavior_adapter.js";

// TODO: bundle this in esbuild
export interface RunOptions {
  format?: "tty" | "json" | "markdown";
}

/**
 * CLI wrapper for Engine. Provides static run() method for programmatic invocation.
 * Maintains internal engine state; use reset() between test runs.
 */
export class EngineCLI {
  private static _engine: Engine = new Engine();

  /** Reset internal engine state (for testing). */
  static reset(): void {
    EngineCLI._engine = new Engine();
  }

  /** Get the internal engine (for testing). */
  static get engine(): Engine {
    return EngineCLI._engine;
  }

  /**
   * Run a CLI command programmatically.
   * @param cmdString - Command string (e.g., "counter.count --amount 4" or "counter.total")
   * @param opts - Options including format (tty, json, markdown)
   * @returns Formatted output string (for total) or result value
   */
  static run(cmdString: string, opts?: RunOptions): string {
    const args = cmdString.split(/\s+/).filter(Boolean);
    const format = opts?.format ?? "tty";

    const pathStr = args.find((a: string) => !a.startsWith("--")) || "counter.total";
    
    // Parse --key value pairs from args array
    const params: Record<string, string> = {};
    for (let i = 0; i < args.length; i++) {
      if (args[i].startsWith("--") && args[i + 1] != null && !args[i + 1].startsWith("--")) {
        params[args[i].slice(2)] = args[i + 1];
        i++; // skip the value
      }
    }

    const [obj, key] = EngineCLI._lookup(EngineCLI._engine, pathStr);
    const target = (obj as Record<string, unknown>)[key];

    if (typeof target === "function") {
      (target as (...args: unknown[]) => unknown).apply(obj, Object.values(params));
    } else if (params.value !== undefined) {
      (obj as Record<string, unknown>)[key] = params.value;
    }

    // Return formatted output via adapter, keyed by root path segment
    const rootSegment = pathStr.split(".")[0];
    if (rootSegment === "contextFolder") {
      const adapter = EngineCLI._getContextFolderAdapter(format);
      return adapter.path;
    }
    if (rootSegment === "bot") {
      const adapter = EngineCLI._getBotAdapter(format);
      const secondSegment = pathStr.split(".")[1];
      if (secondSegment === "description") {
        return adapter.description;
      }
      if (secondSegment === "behaviorNames") {
        return adapter.behaviorNames;
      }
      if (secondSegment === "internals") {
        return JSON.stringify(adapter.internals);
      }
      return adapter.bot;
    }
    if (rootSegment === "behavior") {
      const adapter = EngineCLI._getBehaviorAdapter(format);
      const secondSegment = pathStr.split(".")[1];
      if (secondSegment === "currentAction" || secondSegment === "loadActions" || secondSegment === "actions") {
        return adapter.action;
      }
      if (secondSegment === "pos") {
        return adapter.position;
      }
      if (secondSegment === "tree") {
        return adapter.tree;
      }
      if (secondSegment === "next" || secondSegment === "back" || secondSegment === "closeCurrent"
        || secondSegment === "navigateToBehavior" || secondSegment === "navigateToAction") {
        return adapter.navigation;
      }
      return adapter.behavior;
    }
    const adapter = EngineCLI._getAdapter(format);
    return adapter.total;
  }

  private static _lookup(obj: object, pathStr: string): [object, string] {
    const parts = pathStr.split(".");
    let target: object = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      target = (target as Record<string, unknown>)[parts[i]] as object;
    }
    return [target, parts[parts.length - 1]];
  }

  private static _getAdapter(format: string): ICounterOutputAdapter {
    switch (format) {
      case "markdown":
        return new CounterMarkdown(EngineCLI._engine.counter);
      case "json":
        return new CounterJson(EngineCLI._engine.counter);
      default:
        return new CounterTty(EngineCLI._engine.counter);
    }
  }

  private static _getContextFolderAdapter(format: string): IContextFolderOutputAdapter {
    switch (format) {
      case "markdown":
        return new ContextFolderMarkdown(EngineCLI._engine.contextFolder);
      case "json":
        return new ContextFolderJson(EngineCLI._engine.contextFolder);
      default:
        return new ContextFolderTty(EngineCLI._engine.contextFolder);
    }
  }

  private static _getBotAdapter(format: string): IBotOutputAdapter {
    switch (format) {
      case "markdown":
        return new BotMarkdown(EngineCLI._engine.bot);
      case "json":
        return new BotJson(EngineCLI._engine.bot);
      default:
        return new BotTty(EngineCLI._engine.bot);
    }
  }

  private static _getBehaviorAdapter(format: string): IBehaviorOutputAdapter {
    switch (format) {
      case "markdown":
        return new BehaviorMarkdown(EngineCLI._engine.behavior);
      case "json":
        return new BehaviorJson(EngineCLI._engine.behavior);
      default:
        return new BehaviorTty(EngineCLI._engine.behavior);
    }
  }
}

// Entry point: run when executed directly
if (typeof process !== "undefined" && process.argv[1]?.includes("engine_cli")) {
  const args = process.argv.slice(2);
  const formatIdx = args.indexOf("--format");
  const format = (formatIdx >= 0 ? args[formatIdx + 1] || "tty" : "tty") as "tty" | "json" | "markdown";
  const cmdArgs = formatIdx >= 0 ? [...args.slice(0, formatIdx), ...args.slice(formatIdx + 2)] : args;
  const cmdString = cmdArgs.join(" ");

  const output = EngineCLI.run(cmdString, { format });
  process.stdout.write(output);
}
