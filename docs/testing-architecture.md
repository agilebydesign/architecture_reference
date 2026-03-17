## Testing Architecture

Tests mirror the tiered architecture. Each layer adds tests for its specific responsibilities; higher layers inherit domain tests and add adapter/invocation coverage.

| Layer | When to Add | Notes |
|-------|--------------|-------|
| **Domain / Server Domain** | Always (domain); when persistence exists (server) | Same test file; Template Method via `registerTests()` |
| **CLI** | Always | Same Template Method; `createCounter()` returns `CliTestWrapper` (wraps `EngineCLI.run`) |
| **Server View** | Always | Inherit from domain; test events, display |
| **Client View** | When substantial logic (e.g. story tree) | Extend CounterTest; createCounter → initCounterClient; assertTotal → DOM |

### Tiered Architecture

```
                         <<abstract>>
                         CounterTest
                         ─────────────
                         + startingCounter()
                         + counterWithCounts()
                         + assertTotal()
                         # createCounter() <<abstract>>
                         + registerTests()
                         + startsAtZero()
                         + countAddsToTotal()
                         + resetClearsTotal()
                                 △
                                 │ extends
    ┌────────────────────────────┼────────────────────────────┬──────────────────────┬──────────────────────┐
    │                            │                            │                      │                      │
DomainCounterTest      ServerCounterTest           CliCounterTest        CounterViewTest       CounterClientTest       CounterWebViewE2ETest
───────────────        ─────────────────           ─────────────         ───────────────       ─────────────────       ─────────────────────
# createCounter()      # createCounter()            # createCounter()     # createCounter()     # createCounter()       # createCounter()
                       # assertTotal()              → CliTestWrapper      # assertTotal()       # assertTotal()         → WebViewCounterAdapter
                       (persistence)               # assertTotal()        → super + postMsg     → super + DOM           # assertTotal()
                                                → json, tty, markdown   + getHtml             + sync check            → super + webview DOM
                                                                        + getHtmlIncludesTotal()
    │                            │                            │                      │                      │
    │                            │                   ┌───────────────────────────────┐         ┌───────────────────────────────┐
    │                            │                   │ CliTestWrapper                │         │ WebViewCounterAdapter         │
    │                            │                   │ implements ICounter           │         │ implements ICounter           │
    │                            │                   │ count, reset, total           │         │ count → click #count-btn      │
    │                            │                   │ total ← parseTotal(out)        │         │ reset → click #reset-btn      │
    │                            │                   │ tty | json | markdown         │         │ total ← webview.$("#total")    │
    │                            │                   │ → EngineCLI.run               │         │ → WebView DOM (wdio)           │
    │                            │                   └───────────────────────────────┘         └───────────────────────────────┘
Domain layer             Server Domain                 CLI layer              Server View        Client View              E2E layer
(Counter)                (CounterServer)               (EngineCLI)           (CounterView)     (counter_client)         (WebView)
```

### registerTests() — What It Does

`registerTests()` wires the three counter scenarios into Vitest. It calls `it()` for each scenario (starts at zero, count adds, reset clears). A subclass calls `new MyCounterTest().registerTests()` inside a `describe` block; Vitest then runs those scenarios for that layer. Every layer (domain, server, CLI, client, E2E) runs the same scenarios—only the setup and assertions differ.

### Template Method — Hooks for Setup and Assertions

The base defines the scenarios but delegates setup and assertions to protected hooks. Subclasses override:

- **`createCounter()`** — Returns the counter under test (domain object, CLI wrapper, client, webview adapter).
- **`assertTotal(counter, expected)`** — Asserts the counter's total; subclasses add layer-specific checks (persistence, DOM, postMessage).

The `it()` callbacks use arrow functions so `this` stays bound to the test instance when Vitest runs them.

### Class Roles in the Structure

| Class | Role |
|-------|------|
| **CounterTest** | Base. Defines scenarios in `registerTests()`, helper methods (`startingCounter`, `counterWithCounts`), and default `assertTotal`. Abstract `createCounter()`. |
| **DomainCounterTest** | Domain layer. Overrides `createCounter()` → `new Counter()`. |
| **ServerCounterTest** | Server domain. Overrides `createCounter()` → `new CounterServer(path)`. Overrides `assertTotal()` to add persistence check (reload from file). |
| **CliCounterTest** | CLI layer. Overrides `createCounter()` → `new CliTestWrapper` (implements `ICounter` via `EngineCLI.run`). Overrides `assertTotal()` for json/tty/markdown output. |
| **CounterClientTest** | Client view. Overrides `createCounter()` → `initCounterClient` with mock postMessage. Overrides `assertTotal()` to add DOM check and sync assertion. |
| **CounterWebViewE2ETest** | E2E webview. Overrides `createCounter()` → `WebViewCounterAdapter`. Overrides `assertTotal()` to add webview DOM check. |

### Base Test Class

Helper methods live on the base test class. 


```typescript
// test/counter/counter_test.ts
import { it, expect } from "vitest";
import { Counter } from "../../src/counter/counter.js";
import type { ICounter } from "../../src/counter/counter.js";

export abstract class CounterTest {
  protected startingCounter(total = 0): ICounter {
    const c = new Counter();
    if (total > 0) c.count(total);
    return c;
  }

  protected counterWithCounts(...amounts: number[]): ICounter {
    const c = new Counter();
    amounts.forEach(a => c.count(a));
    return c;
  }

  protected assertTotal(counter: ICounter, expected: number): void {
    expect(counter.total).toBe(expected);
  }

  protected abstract createCounter(): ICounter;

  registerTests(): void {
    it("starts at zero", () => {
      const c = this.createCounter();
      this.assertTotal(c, 0);
    });
    it("counter that starts at three, add 4 and 7, yields 14", () => {
      const c = this.createCounter();
      c.count(3);
      c.count(4);
      c.count(7);
      this.assertTotal(c, 14);
    });
    it("reset clears total", () => {
      const c = this.createCounter();
      c.count(5);
      c.reset();
      this.assertTotal(c, 0);
    });
  }
}
```

### Domain and Server Domain

Both call `registerTests()`. Domain overrides `createCounter()` → `Counter`; Server overrides `createCounter()` → `CounterServer` and `assertTotal()` to add persistence check.

```typescript
// test/counter/counter.test.ts
import { describe, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { Counter } from "../../src/counter/counter.js";
import { CounterServer } from "../../src/counter/counter_server.js";
import { CounterTest } from "./counter_test.js";

export class DomainCounterTest extends CounterTest {
  protected createCounter() { return new Counter(); }
}

describe("Counter", () => {
  new DomainCounterTest().registerTests();
});

describe("CounterServer", () => {
  let tmpDir: string;
  beforeEach(() => { tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "counter-")); });

  class ServerCounterTest extends CounterTest {
    protected createCounter() {
      return new CounterServer(path.join(tmpDir, "counter.json"));
    }
    protected override assertTotal(counter: ICounter, expected: number): void {
      super.assertTotal(counter, expected);
      // Server domain adds: verify persistence
      const c2 = new CounterServer(path.join(tmpDir, "counter.json"));
      expect(c2.total).toBe(expected);
    }
  }

  new ServerCounterTest().registerTests();
});
```

**Why arrow functions:** The `it()` callbacks use arrow functions so `this` is lexically bound to the test instance when the callback runs asynchronously. A regular function would lose `this` under Vitest’s invocation.

### CLI Tests

Call `EngineCLI.run(cmd: string, opts?: { tty?: boolean }): string`. `createCounter()` returns a `CliTestWrapper` that implements `ICounter` by delegating to `EngineCLI.run`; same Template Method scenarios as domain and server domain. Test format (json), pipe (`tty: false`), and tty (`tty: true`).

```typescript
// test/engine/engine_cli.test.ts
import { describe, it, expect } from "vitest";
import { EngineCLI } from "../../src/engine/engine_cli.js";
import { CounterTest } from "../counter/counter_test.js";
import type { ICounter } from "../../src/counter/counter.js";

/** Extracts total from tty, json, or markdown adapter output. */
function parseTotal(out: string): number {
  try {
    const parsed = JSON.parse(out);
    if (typeof parsed?.total === "number") return parsed.total;
  } catch { /* not JSON */ }
  const m = out.match(/(?:Total|total)[:\s*\*]*(\d+)/);
  if (m) return parseInt(m[1], 10);
  throw new Error(`parseTotal: cannot extract total from output`);
}

/** Wraps EngineCLI.run as ICounter for Template Method tests. */
class CliTestWrapper implements ICounter {
  foo = { bar: "" };
  count(n: number): void {
    EngineCLI.run(`count ${n}`);
  }
  reset(): void {
    EngineCLI.run("reset");
  }
  private _format: "json" | "tty" | "markdown" = "json";
  get format(): "json" | "tty" | "markdown" {
    return this._format;
  }
  set format(fmt: "json" | "tty" | "markdown") {
    this._format = fmt;
  }



  get total(): number {
    
    return EngineCLI.run("counter.total", { format: this.format });
  }

  hydrate(_data?: { total?: number; fooBar?: string }): void { /* no-op for CLI */ }
}

describe("EngineCLI", () => {
  class CliCounterTest extends CounterTest {
    protected createCounter(): ICounter {
      return new CliTestWrapper();
    }
    protected override assertTotal(counter: ICounter, expected: number): void {
      super.assertTotal(counter, expected);
      const outJson = EngineCLI.run("counter.total", { format: "json" });
      expect(JSON.parse(outJson)).toEqual({ total: expected });
      const outTty = EngineCLI.run("counter.total", { format: "tty" });
      expect(outTty).toMatch(new RegExp(`Total: ${expected}`));
      const outMd = EngineCLI.run("counter.total", { format: "markdown" });
      expect(outMd).toMatch(new RegExp(`\\*\\*Total:\\*\\*\\s*${expected}`));
    }
  }
  new CliCounterTest().registerTests();
});
```

### Server View Tests

Extend `CounterTest`; same Template Method as domain and CLI. Override `createCounter()` to build view with mock panel; override `assertTotal()` to assert domain total, postMessage, and HTML (like CLI asserts all formats). Use `registerTests()` for shared scenarios. No separate `assertPostMessage` or `assertHtmlContainsTotal` helpers.

```typescript
// test/counter/counter_view.test.ts
import { describe, expect, beforeEach } from "vitest";
import * as vscode from "vscode";
import { CounterView } from "../../src/counter/view/counter_view.js";
import { CounterTest } from "./counter_test.js";

describe("CounterView", () => {
  let posted: unknown[];
  const mockExtensionUri = { fsPath: "/tmp/ext" } as vscode.Uri;

  class CounterViewTest extends CounterTest {
    protected posted: unknown[] = [];
    protected mockPanel!: vscode.WebviewPanel;
    protected view?: CounterView;
    protected createCounter(): ICounter {
      const counter = this.startingCounter();
      this.view = new CounterView(this.mockPanel, counter, mockExtensionUri);
      return this.view as unknown as ICounter;  // view delegates count/reset to counter and posts
    }
    protected override assertTotal(counter: ICounter, expected: number): void {
      super.assertTotal(counter, expected);
      expect(this.posted).toContainEqual({ total: expected });
      expect(this.view!.getHtml()).toContain(String(expected));
    }
  }
  const base = new CounterViewTest();

  beforeEach(() => {
    posted = [];
    base.posted = posted;
    base.mockPanel = {
      webview: {
        postMessage: (msg: unknown) => posted.push(msg),
        asWebviewUri: (uri: { toString: () => string }) => uri,
      },
    } as unknown as vscode.WebviewPanel;
  });

  base.registerTests();
});
```

### Client View Tests

Extend `CounterTest`; same Template Method as domain and CLI. Override `createCounter()` to return `initCounterClient` with mock postMessage; override `assertTotal(counter, expected)` to add DOM check and sync assertion. DOM check verifies hydrate (server response → DOM); sync assertion uses an `if` to detect which scenario (from `expected` and `postMessageCalls`) and assert the correct expected sync. Client runs the same three scenarios (starts at zero, count adds, reset clears) with different setup and assertions. Base helper methods (e.g. `startingCounter()`, `counterWithCounts()`) are inherited by subclasses.

```typescript
// test/counter/counter_client.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { JSDOM } from "jsdom";
import { initCounterClient } from "../../src/counter/view/counter_client.js";
import { CounterView } from "../../src/counter/view/counter_view.js";
import { CounterTest } from "./counter_test.js";

describe("counter_client", () => {
  let postMessageCalls: unknown[];

  class CounterClientTest extends CounterTest {
    protected createCounter() {
      return initCounterClient({ postMessage: (m) => postMessageCalls.push(m) });
    }
    protected override assertTotal(counter: ICounter, expected: number): void {
      super.assertTotal(counter, expected);
      expect(document.getElementById("total")?.textContent).toBe(String(expected));
      if (expected === 14) {
        expect(postMessageCalls).toEqual([
          { command: "counter.count", value: 3 },
          { command: "counter.count", value: 4 },
          { command: "counter.count", value: 7 },
        ]);
      } else if (expected === 0 && postMessageCalls.some((m: { command?: string }) => m.command === "counter.reset")) {
        expect(postMessageCalls).toEqual([
          { command: "counter.count", value: 5 },
          { command: "counter.reset" },
        ]);
      } else {
        expect(postMessageCalls).toEqual([]);
      }
    }
  }

  beforeEach(() => {
    const html = CounterView.getFixtureHtml();
    const dom = new JSDOM(html, { url: "http://localhost" });
    postMessageCalls = [];
    Object.assign(global, { document: dom.window.document });
  });

  new CounterClientTest().registerTests();
});
```

### E2E Testing (Server View / Webview)

Same Template Method as domain, CLI, and client. Extend `CounterTest`; override `createCounter()` to return a webview-backed adapter (implements `ICounter` via WebView DOM—clicks buttons, reads `#total`); override `assertTotal()` to add webview DOM check. Runs the same three scenarios. Use **WebdriverIO wdio-vscode-service** (recommended) or vscode-extension-tester, Playwright.

**WebViewCounterAdapter** implements `ICounter` by driving the WebView DOM (clicks, reads):

```typescript
// e2e/adapters/webview_counter_adapter.ts
import type { WebView } from "wdio-vscode-service";
import type { ICounter } from "../../src/counter/counter.js";

/** Wraps WebView DOM as ICounter for E2E Template Method tests. (In practice, wdio calls are async; E2E tests use async it() and await.) */
class WebViewCounterAdapter implements ICounter {
  constructor(private readonly webview: WebView) {}
  count(n: number): void {
    for (let i = 0; i < n; i++) this.webview.activeFrame$.$("#count-btn").click();
  }
  reset(): void {
    this.webview.activeFrame$.$("#reset-btn").click();
  }
  get total(): number {
    return parseInt(this.webview.activeFrame$.$("#total").getText(), 10);
  }
  hydrate(): void { /* no-op for E2E */ }
}
```

```typescript
// e2e/counter_webview.e2e.ts
import { WebView } from "wdio-vscode-service";
import { CounterTest } from "../test/counter/counter_test.js";
import * as locatorMap from "../pageobjects/locators";

describe("counter_webview", () => {
  let webview: WebView;

  class CounterWebViewE2ETest extends CounterTest {
    protected createCounter(): ICounter {
      return new WebViewCounterAdapter(webview);
    }
    protected override async assertTotal(counter: ICounter, expected: number): Promise<void> {
      super.assertTotal(counter, expected);
      const totalEl = await webview.activeFrame$.$("#total");
      await expect(totalEl).toHaveText(String(expected));
    }
  }

  beforeEach(async () => {
    [webview] = await WebView.getAllWebViews(locatorMap);
    await webview.open();
  });

  afterEach(async () => {
    await webview.close();
  });

  new CounterWebViewE2ETest().registerTests();
});
```

---