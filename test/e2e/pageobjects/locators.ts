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
  /** Span displaying behavior count */
  behaviorCount: "#behaviorCount",
  /** Span displaying current action name */
  currentAction: "#currentAction",
  /** Span displaying action count */
  actionCount: "#actionCount",
};
