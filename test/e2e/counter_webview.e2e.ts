// e2e/counter_webview.e2e.ts — E2E tests for Counter webview using Template Method pattern
/// <reference types="mocha" />
import { browser, expect, $ } from "@wdio/globals";
import { WebView } from "wdio-vscode-service";
import { WebViewCounterAdapter } from "./adapters/webview_counter_adapter";
import { counterLocators } from "./pageobjects/locators";

/**
 * E2E tests for Counter webview.
 * 
 * Mirrors the Template Method pattern from CounterTest but with async methods.
 * Runs the same three scenarios (starts at zero, count adds, reset clears)
 * against the actual VS Code webview.
 */
describe("counter_webview", () => {
  let webview: WebView;
  let counter: WebViewCounterAdapter;

  /**
   * Assert total matches expected value.
   * Checks both adapter and raw DOM element.
   */
  async function assertTotal(expected: number): Promise<void> {
    const total = await counter.getTotalAsync();
    expect(total).toBe(expected);

    // Also verify raw DOM element
    await expect($(counterLocators.total)).toHaveText(String(expected));    
  }  

  before(async () => {
    let webviews: WebView[] = []

    // Open the Engine panel (which contains Counter)
    const workbench = await browser.getWorkbench();    
    await workbench.executeCommand("Agilebot: View Engine");

    // Get the webview and create adapter
    // const webviews = await workbench.getAllWebviews();
    // webview = webviews[0];
    // await webview.open();

    await browser.waitUntil(async () => (await workbench.getAllWebviews()).length > 0)
    webviews = await workbench.getAllWebviews();
    expect(webviews).toHaveLength(1);
    webview = webviews[0];
    await webview.open();

    counter = new WebViewCounterAdapter(webview);
  });

  after(async () => {
    if (webview) {
      await webview.close();
    }
  });

  // Same three scenarios as CounterTest.registerTests()
  describe("Given a new counter is opened", () => {
    it("Then it starts at zero", async () => {
      await assertTotal(0);
    });

    describe("When I add numbers to the counter", () => {
        it("Then the counter displays the sum of the added numbers", async () => {
          await counter.count(3);
          await counter.count(4);
          await counter.count(7);
          await assertTotal(14);
        });
    });

    describe("When I reset the counter", () => {
      it("Then reset clears total", async () => {
        await counter.count(5);
        await counter.reset();
        await assertTotal(0);
      });
    });
  });
});
