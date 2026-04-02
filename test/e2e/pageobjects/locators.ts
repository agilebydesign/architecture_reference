// e2e/pageobjects/locators.ts — DOM selectors for webview elements

export const counterLocators = {
  /** Input field for count amount - triggers count on "change" event */
  amount: "#amount",
  /** Reset button - triggers reset on "click" */
  resetBtn: "#resetBtn",
  /** Span displaying current total */
  total: "#total",
  /** Input field for foo.bar property */
  fooBar: "#fooBar",
};

export const contextFolderLocators = {
  /** Input field for context folder path - triggers updatePath on "change" event */
  folderPath: "#folderPath",
  /** Browse button - triggers browse on "click" */
  browseBtn: "#browseBtn",
  /** Span displaying current bot name */
  botName: "#botName",
  /** Span displaying current bot directory */
  botDirectory: "#botDirectory",
};

export const botBehaviorLocators = {
  /** Span displaying current behavior name */
  currentBehavior: "#currentBehavior",
  /** Span displaying current action name */
  currentAction: "#currentAction",
  /** Next navigation button */
  nextBtn: "#nextBtn",
  /** Back navigation button */
  backBtn: "#backBtn",
  /** Behavior tree container */
  behaviorTree: "#behaviorTree",
  /** Behavior item by name (use with attribute selector) */
  behaviorItem: (name: string) => `.behavior-item[data-behavior="${name}"]`,
  /** Behavior header by name */
  behaviorHeader: (name: string) => `.behavior-item[data-behavior="${name}"] .behavior-header`,
  /** Expand icon by behavior name */
  expandIcon: (name: string) => `.behavior-item[data-behavior="${name}"] .expand-icon`,
  /** Behavior name span by behavior name */
  behaviorName: (name: string) => `.behavior-item[data-behavior="${name}"] .behavior-name`,
  /** Action item by behavior and action name */
  actionItem: (behavior: string, action: string) => `.behavior-item[data-behavior="${behavior}"] .action-item[data-action="${action}"]`,
  /** Execution setting button by target key and setting value */
  execBtn: (target: string, setting: string) => `.exec-btn[data-target="${target}"][data-exec="${setting}"]`,
  /** Active behavior item */
  activeBehaviorItem: ".behavior-item.active",
  /** Active action item */
  activeActionItem: ".action-item.active",
  /** All behavior items */
  allBehaviorItems: ".behavior-item",
  /** All action items within a behavior */
  actionList: (behavior: string) => `.behavior-item[data-behavior="${behavior}"] .action-list`,
};
