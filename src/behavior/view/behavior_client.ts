// behavior/view/behavior_client.ts — Client: extends Behavior with DOM updates and server sync

import { Behavior, type BehaviorHydrateData, type IBehaviorConfig, type IBaseActionConfig, type NavigationResult, type ExecutionSetting } from "../behavior.js";

interface VsCodeApi {
  postMessage(message: unknown): void;
}

interface BehaviorTreeEntry {
  name: string;
  actions: { name: string; executionSetting: string }[];
}

/** Extends Behavior with DOM updates and server synchronization */
export class BehaviorClient extends Behavior {
  private vscode: VsCodeApi;
  private currentBehaviorEl: HTMLSpanElement;
  private currentActionEl: HTMLSpanElement;
  private behaviorTreeEl: HTMLUListElement;

  constructor(vscode: VsCodeApi) {
    super();
    this.vscode = vscode;
    this.currentBehaviorEl = document.getElementById("currentBehavior") as HTMLSpanElement;
    this.currentActionEl = document.getElementById("currentAction") as HTMLSpanElement;
    this.behaviorTreeEl = document.getElementById("behaviorTree") as HTMLUListElement;
  }

  private syncToServer(command: string, value?: unknown): void {
    this.vscode.postMessage(value !== undefined ? { command, value } : { command });
  }

  override loadBehaviors(allowedBehaviors: string[], behaviorConfigs: IBehaviorConfig[]): void {
    super.loadBehaviors(allowedBehaviors, behaviorConfigs);
    this.currentBehaviorEl.textContent = this.currentBehavior?.name ?? "";
  }

  override loadActions(baseActionConfigs?: IBaseActionConfig[]): void {
    super.loadActions(baseActionConfigs);
    this.currentActionEl.textContent = this.currentAction?.name ?? "";
  }

  private _updateDom(): void {
    this.currentBehaviorEl.textContent = this.currentBehavior?.name ?? "";
    this.currentActionEl.textContent = this.currentAction?.name ?? "";
  }

  updateTreeDom(): void {
    if (!this.behaviorTreeEl) return;
    const currentBehaviorName = this.currentBehavior?.name ?? "";
    const currentActionName = this.currentAction?.name ?? "";

    const behaviorItems = this.behaviorTreeEl.querySelectorAll(".behavior-item");
    behaviorItems.forEach((li) => {
      const name = li.getAttribute("data-behavior");
      const isCurrent = name === currentBehaviorName;
      li.classList.toggle("active", isCurrent);

      const icon = li.querySelector(".expand-icon");
      if (icon) icon.textContent = li.classList.contains("expanded") ? "▼" : "▶";

      const actionItems = li.querySelectorAll(".action-item");
      actionItems.forEach((actionLi) => {
        const actionName = actionLi.getAttribute("data-action");
        actionLi.classList.toggle("active", isCurrent && actionName === currentActionName);
      });
    });
  }

  toggleExpand(name: string): void {
    if (!this.behaviorTreeEl) return;
    const li = this.behaviorTreeEl.querySelector(`.behavior-item[data-behavior="${name}"]`);
    if (!li) return;
    li.classList.toggle("expanded");
    const icon = li.querySelector(".expand-icon");
    if (icon) icon.textContent = li.classList.contains("expanded") ? "▼" : "▶";
  }

  override navigateToBehavior(name: string): void {
    super.navigateToBehavior(name);
    this._updateDom();
    this.updateTreeDom();
    this.syncToServer("behavior.navigateToBehavior", name);
  }

  override navigateToAction(name: string): void {
    super.navigateToAction(name);
    this._updateDom();
    this.updateTreeDom();
    this.syncToServer("behavior.navigateToAction", name);
  }

  override next(): NavigationResult {
    const result = super.next();
    this._updateDom();
    this.updateTreeDom();
    this.syncToServer("behavior.next");
    return result;
  }

  override back(): NavigationResult {
    const result = super.back();
    this._updateDom();
    this.updateTreeDom();
    this.syncToServer("behavior.back");
    return result;
  }

  override closeCurrent(): NavigationResult {
    const result = super.closeCurrent();
    this._updateDom();
    this.updateTreeDom();
    this.syncToServer("behavior.closeCurrent");
    return result;
  }

  override setExecutionSetting(key: string, value: ExecutionSetting): void {
    super.setExecutionSetting(key, value);
    this._updateExecButtonDom(key, value);
    this.vscode.postMessage({ command: "behavior.setExecutionSetting", key, value });
  }

  private _updateExecButtonDom(targetKey: string, activeSetting: string): void {
    if (!this.behaviorTreeEl) return;
    const buttons = this.behaviorTreeEl.querySelectorAll(`.exec-btn[data-target="${targetKey}"]`);
    buttons.forEach((btn) => {
      btn.classList.toggle("active", btn.getAttribute("data-exec") === activeSetting);
    });
  }

  renderTree(treeData: BehaviorTreeEntry[], currentBehavior: string, currentAction: string): void {
    if (!this.behaviorTreeEl) return;

    const expandedBehaviors = new Set<string>();
    this.behaviorTreeEl.querySelectorAll(".behavior-item.expanded").forEach((li) => {
      const name = li.getAttribute("data-behavior");
      if (name) expandedBehaviors.add(name);
    });

    this.behaviorTreeEl.innerHTML = treeData.map((b) => {
      const isCurrent = b.name === currentBehavior;
      const isExpanded = expandedBehaviors.has(b.name);
      const behaviorClasses = `behavior-item${isCurrent ? " active" : ""}${isExpanded ? " expanded" : ""}`;
      const actionsHtml = b.actions.map((a) => {
        const isCurrentAction = isCurrent && a.name === currentAction;
        const actionClasses = `action-item${isCurrentAction ? " active" : ""}`;
        return `<li class="${actionClasses}" data-action="${a.name}" data-behavior="${b.name}">` +
          `<span class="action-name">${a.name}</span>` +
          `<span class="action-exec-settings">` +
          `<button class="exec-btn${a.executionSetting === "skip" ? " active" : ""}" data-exec="skip" data-target="${b.name}.${a.name}" title="Skip">⏭</button>` +
          `<button class="exec-btn${a.executionSetting === "manual" ? " active" : ""}" data-exec="manual" data-target="${b.name}.${a.name}" title="Manual">✋</button>` +
          `<button class="exec-btn${a.executionSetting === "combine_with_next" ? " active" : ""}" data-exec="combine_with_next" data-target="${b.name}.${a.name}" title="Combine with next">🔗</button>` +
          `</span></li>`;
      }).join("");

      return `<li class="${behaviorClasses}" data-behavior="${b.name}">` +
        `<div class="behavior-header">` +
        `<span class="expand-icon">${isExpanded ? "▼" : "▶"}</span>` +
        `<span class="behavior-name">${b.name}</span>` +
        `<span class="behavior-exec-settings">` +
        `<button class="exec-btn" data-exec="skip" data-target="${b.name}" title="Skip">⏭</button>` +
        `<button class="exec-btn active" data-exec="manual" data-target="${b.name}" title="Manual">✋</button>` +
        `<button class="exec-btn" data-exec="combine_with_next" data-target="${b.name}" title="Combine with next">🔗</button>` +
        `</span></div>` +
        `<ul class="action-list">${actionsHtml}</ul></li>`;
    }).join("");

    this.attachTreeListeners();
  }

  attachTreeListeners(): void {
    if (!this.behaviorTreeEl) return;

    this.behaviorTreeEl.querySelectorAll(".expand-icon").forEach((icon) => {
      icon.addEventListener("click", (e) => {
        e.stopPropagation();
        const li = (icon as HTMLElement).closest(".behavior-item") as HTMLElement;
        const name = li?.getAttribute("data-behavior");
        if (name) {
          this.toggleExpand(name);
        }
      });
    });

    this.behaviorTreeEl.querySelectorAll(".behavior-name").forEach((nameEl) => {
      nameEl.addEventListener("click", (e) => {
        e.stopPropagation();
        const li = (nameEl as HTMLElement).closest(".behavior-item") as HTMLElement;
        const name = li?.getAttribute("data-behavior");
        if (name) {
          this.navigateToBehavior(name);
        }
      });
    });

    this.behaviorTreeEl.querySelectorAll(".action-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains("exec-btn")) return;
        const actionName = (item as HTMLElement).getAttribute("data-action");
        const behaviorName = (item as HTMLElement).getAttribute("data-behavior");
        if (behaviorName && actionName) {
          if (this.currentBehavior?.name !== behaviorName) {
            this.navigateToBehavior(behaviorName);
          }
          this.navigateToAction(actionName);
        }
      });
    });

    this.behaviorTreeEl.querySelectorAll(".exec-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const execValue = (btn as HTMLElement).getAttribute("data-exec") as ExecutionSetting;
        const targetKey = (btn as HTMLElement).getAttribute("data-target");
        if (targetKey && execValue) {
          this.setExecutionSetting(targetKey, execValue);
        }
      });
    });
  }

  override hydrate(data: BehaviorHydrateData & { behaviorTree?: BehaviorTreeEntry[] }): void {
    if (data.allowedBehaviors && data.behaviorConfigs) {
      super.loadBehaviors(data.allowedBehaviors, data.behaviorConfigs);
      super.loadActions(data.baseActionConfigs);
      super.hydrate(data);
      this._updateDom();
      if (data.behaviorTree) {
        this.renderTree(data.behaviorTree, this.currentBehavior?.name ?? "", this.currentAction?.name ?? "");
      }
      return;
    }

    super.hydrate(data);
    this._updateDom();
    if (data.behaviorTree) {
      this.renderTree(data.behaviorTree, this.currentBehavior?.name ?? "", this.currentAction?.name ?? "");
    } else {
      this.updateTreeDom();
    }
  }
}

export function initBehaviorClient(vscode: VsCodeApi): BehaviorClient {
  const behavior = new BehaviorClient(vscode);

  const nextBtn = document.getElementById("nextBtn");
  const backBtn = document.getElementById("backBtn");
  if (nextBtn) nextBtn.addEventListener("click", () => behavior.next());
  if (backBtn) backBtn.addEventListener("click", () => behavior.back());

  window.addEventListener("message", (event: MessageEvent) => {
    if ("currentBehavior" in event.data || "currentAction" in event.data || "executionSettings" in event.data || "behaviorTree" in event.data || "allowedBehaviors" in event.data) {
      behavior.hydrate(event.data as BehaviorHydrateData);
    }
  });

  behavior.attachTreeListeners();

  vscode.postMessage({ command: "behavior.requestInit" });

  return behavior;
}
