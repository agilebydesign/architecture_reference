// e2e/helpers/get_webview.ts — Shared helper to get or open the Engine webview
import { browser, expect } from "@wdio/globals";
import type { WebView } from "wdio-vscode-service";

/**
 * Returns the Engine webview, reusing an existing one if already open.
 * Opens the Engine panel via command palette only if no webview is found.
 */
export async function getEngineWebview(): Promise<WebView> {
  const workbench = await browser.getWorkbench();
  let webviews = await workbench.getAllWebviews();

  if (webviews.length === 0) {
    await workbench.executeCommand("Agilebot: View Engine");
    await browser.waitUntil(async () => (await workbench.getAllWebviews()).length > 0);
    webviews = await workbench.getAllWebviews();
  }

  expect(webviews).toHaveLength(1);
  const webview = webviews[0];
  await webview.open();
  return webview;
}
