// e2e/adapters/webview_counter_adapter.ts — ICounter implementation via WebView DOM
import { browser, expect, $ } from "@wdio/globals";
import type { WebView } from "wdio-vscode-service";
import type { ICounter, IFoo, HydrateData } from "../../../src/counter/counter";
import { counterLocators } from "../pageobjects/locators";

/**
 * Wraps WebView DOM as ICounter for E2E Template Method tests.
 * All interactions are async (wdio calls return Promises).
 * 
 * Methods delegate to WebView DOM elements:
 * - count(n) → set #amount input value, trigger change event
 * - reset() → click #resetBtn
 * - total → read #total element text
 */
export class WebViewCounterAdapter implements ICounter {
  constructor(private readonly webview: WebView) {}

  /**
   * Count by setting the amount input and triggering change event.
   * The counter_client.ts listens for "change" on #amount.
   */
  async count(n: number | string): Promise<void> {    
    const amountInput = await $(counterLocators.amount);
    await amountInput.setValue(String(n));
    // Trigger change event by pressing Enter
    await browser.keys("Enter");
  }

  /**
   * Reset by clicking the reset button.
   */
  async reset(): Promise<void> {    
    const resetBtn = await $(counterLocators.resetBtn);
    await resetBtn.click();
  }

  /**
   * Read total from DOM.
   * Note: This is async, breaking ICounter's sync contract.
   * E2E tests use getTotalAsync() and assertTotalAsync() instead.
   */
  get total(): number {
    throw new Error("Use getTotalAsync() for E2E tests - wdio is async");
  }

  /**
   * Async getter for total value from webview DOM.
   */
  async getTotalAsync(): Promise<number> {    
    const totalEl = await $(counterLocators.total);
    const text = await totalEl.getText();
    return parseInt(text, 10);
  }

  /**
   * Foo property - reads/writes #fooBar input.
   */
  get foo(): IFoo {
    return {
      get bar(): string {
        throw new Error("Use getFooBarAsync() for E2E tests");
      },
      set bar(_val: string) {
        throw new Error("Use setFooBarAsync() for E2E tests");
      },
    };
  }

  async getFooBarAsync(): Promise<string> {    
    const fooBarInput = await $(counterLocators.fooBar);

    return await fooBarInput.getValue();
  }

  async setFooBarAsync(val: string): Promise<void> {    
    const fooBarInput = await $(counterLocators.fooBar);
    await fooBarInput.setValue(val);
    await browser.keys("Enter");
  }

  /**
   * Hydrate - no-op for E2E (state comes from DOM).
   */
  hydrate(_data?: HydrateData): void {
    // No-op for E2E
  }
}
