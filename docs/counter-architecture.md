# Counter Target Architecture — TypeScript/Node-Centric

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Engine Example (Proof of Concept)](#engine-example-proof-of-concept)
  - [Architecture (Domain, Purpose, Flow, Examples)](#architecture-domain-purpose-flow-examples)
  - [CLI](#cli)
  - [Panel](#panel)

---

## Application Architecture

The target architecture moves **all business logic into TypeScript/Node.js**. The server (extension host) talks **directly** to business logic—no CLI, no subprocess, no IPC. The CLI is a **separate entry point** for direct use, also in TS, wrapping the same business logic layer. The webview client extends business logic to wrap the DOM with the same logic the server uses.

| Principle | Meaning |
|-----------|---------|
| **Logic in TS** | Business logic in Node.js (TypeScript); no Python, no subprocess |
| **Domain** | Pure TS (Counter, Engine)—no DOM, no VS Code, no persistence. |
| **Server domain** | Inherits from domain; adds persistence (e.g. `CounterServer extends Counter`). |
| **Server view** | EngineView, CounterView—handles postMessage; uses server domain. |
| **Client → domain + DOM** | Webview loads shared domain (bundled); adds DOM only. Same logic, not duplicated. |
| **CLI separate entry point** | `node engine_cli.js` (compiled from engine_cli.ts) for direct use; wraps same business logic as panel |
| **CLI output adapters** | `ICounterOutputAdapter` wraps `ICounter`; `counter_adapter.total` → formatted string; `.internals` for debugging |

---

## Architecture Overview

**Shared domain; server adds persistence, client adds DOM.**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  PRESENTATION ADAPTERS (inherit / compose shared domain)                │
│  ───────────────────────────────────────────────────────────────────────│
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │ SERVER VIEW     │  │ CLIENT          │  │ CLI             │          │
│  │ postMessage     │  │ Domain +        │  │ Domain +        │          │
│  │ uses Server     │  │ DOM only        │  │ TTY|JSON|HTML   │          │
│  │ Domain          │  │ postMessage     │  │ output adapters │          │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘          │
└───────────┼────────────────────┼────────────────────┼───────────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  SERVER DOMAIN (extends Domain) — adds persistence                          │
│  CounterServer extends Counter; _load(), _save()                            │
└─────────────────────────────────────────────────────────────────────────────┘
            │ inherits from
            ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  DOMAIN (Pure TS — no DOM, no VS Code, no Node APIs)                         │
│  Engine → Counter, Foo. Shared by client and CLI.                            │
└────────────────────────────────┬─────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE (File System, Paths)                                        │
│  fs, path, JSON—as needed by business logic                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```
### Architecture Flow:
CLI → args → lookup(engine, path) → domain. 

or 

Panel → postMessage(command) → view._lookup(command) → domain → postMessage(result).

**Examples:**

```
Domain:     e = new Engine(); e.counter.count(4); e.counter.count(7); e.counter.total → 11
CLI:        cli_engine counter.count --amount 7  → engine.counter.count(7)
            cli_engine counter.total             → 7
            cli_engine counter.foo.bar --value "yum"  → set
Panel:      postMessage({ command: 'counter.count', value: 4 }) → view.counter.count(4) → postMessage({ total: 4 })
```
---

## Architecture Pattern Details

### Presentation Adapters

#### Server (Extension Host)

- **Server view:** EngineView, CounterView—webview panel; message routing; postMessage
- **Server domain:** CounterServer extends Counter—adds persistence (_load, _save)
- **Flow:** Webview `postMessage` → view._lookup → server domain (persists) → `postMessage`
- **Example:** `postMessage({ command: 'counter.count', value: 4 })` → CounterView → CounterServer.count(4) [persists] → `postMessage({ total: 4 })`

#### Client (Webview / DOM)

- **Domain:** Webview HTML; engine_client.js; **shared Counter** (bundled); DOM elements
- **Purpose:** Render UI; capture user input; immediate display via shared domain; sync to server for persistence
- **Flow:** User action → **counter.count(amount)** (shared logic) → `updateDom(counter.total)` → `syncToServer(command, value)` → server persists and echoes
- **Example:** User changes amount → `counter.count(4)` [shared domain] → `updateDom(counter.total)` → `syncToServer("counter.count", 4)` → receive `{ total: 4 }` [confirmation]
- **No duplication:** Client uses the same Counter class as server; DOM layer only binds to domain state.

### Domain

Engine (root) loads Counter; Counter has Foo. Pure TS—no DOM, no VS Code, no CLI. **All counter implementations share `ICounter`** so domain, server domain, server view, client DOM adapter, and CLI adapters are interchangeable at the interface level.

```typescript
// counter/counter.ts — ICounter interface + Counter (root) and Foo (child)
export interface IFoo {
  bar: string;
}

export interface HydrateData {
  total?: number;
  fooBar?: string;
}

/** Shared interface: Counter, CounterServer, CounterView, and client domCounter implement this. CLI output adapters implement ICounterOutputAdapter instead. */
export interface ICounter {
  count(amount: number | string): void;
  reset(): void;
  readonly total: number;
  foo: IFoo;
  hydrate?(data: HydrateData): void;
}

export class Foo implements IFoo {
  bar: string = "";
}

export class Counter implements ICounter {
  private _total: number = 0;
  foo: Foo = new Foo();

  count(amount: number | string): void {
    this._total += Number(amount) || 0;
  }
  get total(): number {
    return this._total;
  }
  reset(): void {
    this._total = 0;
  }
  hydrate(data: HydrateData): void {
    if (data.total !== undefined) this._total = data.total;
    if (data.fooBar !== undefined) this.foo.bar = data.fooBar;
  }
}

// engine/engine.ts
import type { ICounter } from "../counter/counter.js";
import { Counter } from "../counter/counter.js";

export class Engine {
  counter: ICounter;
  constructor(counter?: ICounter) {
    this.counter = counter ?? new Counter();
  }
}
```

**Interface hierarchy:** All counter implementations share `ICounter` (count, reset, total, foo, hydrate?). Implementations: `Counter`, `CounterServer`, `CounterView`, client `domCounter`. CLI output adapters implement `ICounterOutputAdapter` (wrap `ICounter`, `total` → formatted string).

**Inheritance:** Server domain extends domain and adds persistence. Client uses domain + DOM adapter.

```typescript
// counter/counter_server.ts — server domain: implements ICounter via Counter, adds persistence
import { Counter } from "./counter.js";
import * as fs from "fs";
import * as path from "path";

export class CounterServer extends Counter {
  private _filePath: string;

  constructor(filePath: string) {
    super();
    this._filePath = filePath;
    this._load();
  }

  private _load(): void {
    try {
      const data = JSON.parse(fs.readFileSync(this._filePath, "utf8"));
      this.hydrate(data);
    } catch (_) {}
  }

  private _save(): void {
    fs.writeFileSync(this._filePath, JSON.stringify({ total: this.total, fooBar: this.foo.bar }));
  }

  override count(amount: number | string): void {
    super.count(amount);
    this._save();
  }

  override reset(): void {
    super.reset();
    this._save();
  }
}
```

---

### CLI

- **Domain:** The CLI entry point is `engine_cli.ts` (compiled to `engine_cli.js`). It instantiates Engine and uses output adapters (CounterTty, CounterMarkdown, CounterJson) to format results for stdout.
- **Purpose:** Standalone terminal entry point; param parsing; domain lookup on Engine
- **Flow:** `args` → parse `--format` → choose adapter → run commands → `counterAdapter.total` → stdout
- **Where mode is set:** `--format tty|markdown|json` on the command line; default is `tty` if omitted.

```
$ node engine_cli.js count 4 count 7                    → format = "tty"      (default)
$ node engine_cli.js count 4 count 7 --format markdown → format = "markdown"
$ node engine_cli.js count 4 count 7 --format json     → format = "json"

format → adapter:  tty → CounterTty,  markdown → CounterMarkdown,  json → CounterJson
```

- **Data flow:**

```
$ cli_engine counter.count --amount 7
    → lookup(engine, "counter.count") → engine.counter.count(7)
$ cli_engine counter.total
    → lookup(engine, "counter.total") → 7
$ cli_engine counter.foo.bar --value "yum"  # set
$ cli_engine counter.foo.bar                 # get
```

**Example (engine/engine_cli.ts):**
```typescript
import { Engine } from "./engine.js";
import { CounterTty } from "../counter/adapters/counter_tty.js";
import { CounterMarkdown } from "../counter/adapters/counter_markdown.js";
import { CounterJson } from "../counter/adapters/counter_json.js";

const engine = new Engine();  // CLI uses plain Counter (no persistence)

const args = process.argv.slice(2);

// Parse --format (mode) → choose adapter
const formatIdx = args.indexOf("--format");
const format: string = formatIdx >= 0 ? args[formatIdx + 1] || "tty" : "tty";
const cmdArgs = formatIdx >= 0 ? args.slice(0, formatIdx) : args;

const pathStr = cmdArgs.find(a => !a.startsWith("--")) || "counter.total";
const paramArgs = cmdArgs.filter(a => a.startsWith("--"));
const params: Record<string, string> = {};
for (let i = 0; i < paramArgs.length; i += 2) {
  if (paramArgs[i + 1] != null) params[paramArgs[i].slice(2)] = paramArgs[i + 1];
}

function lookup(obj: object, pathStr: string): [object, string] {
  const parts = pathStr.split(".");
  let target: object = obj;
  for (let i = 0; i < parts.length - 1; i++) target = (target as Record<string, unknown>)[parts[i]] as object;
  return [target, parts[parts.length - 1]];
}

const [obj, key] = lookup(engine, pathStr);
const target = (obj as Record<string, unknown>)[key];
let result: unknown;
if (typeof target === "function") {
  result = (target as (...args: unknown[]) => unknown).apply(obj, Object.values(params));
} else if (params.value !== undefined) {
  (obj as Record<string, unknown>)[key] = params.value;
  result = (obj as Record<string, unknown>)[key];
} else {
  result = target;
}

// Output via adapter chosen from format
const counterAdapter = format === "markdown" ? new CounterMarkdown(engine.counter) :
                       format === "json"     ? new CounterJson(engine.counter) :
                       new CounterTty(engine.counter);
process.stdout.write(counterAdapter.total);
```

**Output adapters:** Wrap `ICounter` and implement `ICounterOutputAdapter` — same property names (`total`, `foo`) but `total` returns a formatted string for stdout. Adapters expose `.internals` for debugging.

```typescript
// counter/adapters/counter_adapter.ts
import type { ICounter } from "../counter.js";

/** CLI output adapters: wrap ICounter, expose formatted total (string). */
export interface ICounterOutputAdapter {
  readonly total: string;
  readonly internals: ICounter;
}

// counter/adapters/counter_tty.ts
export class CounterTty implements ICounterOutputAdapter {
  constructor(private _counter: ICounter) {}
  get total(): string { return `Total: ${this._counter.total}\n`; }
  get internals(): ICounter { return this._counter; }
}
// CounterMarkdown, CounterJson similarly implement ICounterOutputAdapter
```

| Adapter | Role | Example |
|---------|------|---------|
| **CounterTty** | Human-readable terminal output | `counter_adapter.total` → `Total: 11\n` |
| **CounterMarkdown** | Formatted for docs/panels | `counter_adapter.total` → `## Counter\n\n**Total:** 11\n` |
| **CounterJson** | Machine-readable; for tooling | `counter_adapter.total` → `{"total":11}` |

### Panel

The Panel has two parts: the **extension host** (server) and the **webview** (client). Both belong to the Panel and extend the shared domain.

#### Server (Extension Host)

- **Server view:** EngineView, CounterView—webview panel; message routing; postMessage
- **Server domain:** CounterServer extends Counter—adds persistence (_load, _save). (CLI uses plain Counter with in-memory state.)
- **Flow:** Webview `postMessage` → view._lookup → server domain (persists) → `postMessage`
- **Example:** `postMessage({ command: 'counter.count', value: 4 })` → CounterView → CounterServer.count(4) [persists] → `postMessage({ total: 4 })`

#### Client (Webview / DOM)

- **Domain:** Webview HTML; engine_client.js; **shared Counter** (bundled); DOM elements
- **Purpose:** Render UI; capture user input; immediate display via shared domain; sync to server for persistence
- **Flow:** User action → `counter.count(amount)` (shared logic) → `updateDom(counter.total)` → `syncToServer(command, value)` → server persists and echoes
- **Example:** User changes amount → `counter.count(4)` [shared domain] → `updateDom(counter.total)` → `syncToServer("counter.count", 4)` → receive `{ total: 4 }` [confirmation]
- **Shared logic:** Client uses the same Counter class; DOM layer binds to domain state.

#### Data flow

```
Initial load:
EngineView.createOrShow(extensionUri)
    → new EngineView(panel, extensionUri)
        → _engine = new Engine()
        → this.counter = new CounterView(panel, _engine.counter, extensionUri)
        → panel.webview.html = _getHtml() [delegates to counter.getHtml(); includes engine_client.js]
    → onDidReceiveMessage(handler) [registered]
    → [webview loads]
        → Client: postMessage({ command: 'counter.total' }), postMessage({ command: 'counter.foo.bar' })
        → Server: handler delegates to view.counter.total(), view.counter.foo.bar()
            → postMessage({ total: 0 }), postMessage({ fooBar: "" })
        → Client: updateTotal(0), updateFooBar(""), display

User changes amount:
    → Client: _total += 4, updateTotal(_total) [immediate]
    → Client: syncToServer("counter.count", 4) → postMessage({ command: 'counter.count', value: 4 })
    → Server: view.counter.count(4) → engine.counter.count(4), view.counter.total() → postMessage({ total: 4 })
    → Client: updateTotal(4) [confirmation]

User sets foo.bar:
    → Client: syncToServer("counter.foo.bar", "yum")
    → Server: view.counter.foo.bar("yum") → engine.counter.foo.bar = "yum", postMessage({ fooBar: "yum" })
    → Client: updateFooBar("yum") [confirmation]
```

Immediate client feedback; server runs business logic async. `command` maps to view path (e.g. `counter.count`). Handler uses `_lookup(command)` to delegate.

#### Layers

| Layer | Role |
|-------|------|
| **Engine** | Root domain; accepts counter (Counter or CounterServer). |
| **BaseView** | Base class for server views: `renderTemplate(path, data)` centralizes placeholder replacement. Swap impl for Handlebars/etc without changing views. |
| **EngineView** | Extends BaseView; loads Engine.html; owns Engine; delegates content to sub-views; handles postMessage. Does not know child markup. |
| **CounterView** | Extends BaseView; loads Counter.html; delegates to domain (CounterServer); posts to webview. Owns counter markup. |
| **engine_client.ts** | Client: uses **shared Counter** (bundled); DOM only (`updateDom`); `syncToServer(command, value)`. No duplicate business logic. |

#### Code

##### BaseView (engine/base_view.ts)

Base class for all server views. Centralizes template loading and placeholder replacement. Swap implementation later (e.g. Handlebars) without changing view code.

```typescript
import * as fs from "fs";
import * as path from "path";
import type { Uri } from "vscode";

export class BaseView {
  protected _extensionUri: Uri;

  constructor(extensionUri: Uri) {
    this._extensionUri = extensionUri;
  }

  /** Load template from path (relative to extension) and replace {{key}} with data[key]. Content key passes through unescaped (HTML). */
  renderTemplate(relativePath: string, data: Record<string, unknown>): string {
    const templatePath = path.join(this._extensionUri.fsPath, ...relativePath.split("/"));
    const html = fs.readFileSync(templatePath, "utf8");
    return this.renderTemplateContent(html, data);
  }

  /** Replace {{key}} placeholders in template string. Content key passes through unescaped (HTML). */
  renderTemplateContent(html: string, data: Record<string, unknown>): string {
    let result = html;
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      const toInsert = (key === "content") ? (value ?? "") : this._escapeHtml(value);
      result = result.split(placeholder).join(toInsert);
    }
    return result;
  }

  private _escapeHtml(value: unknown): string {
    if (value == null) return "";
    return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }
}
```

##### EngineView (engine_view.ts)

EngineView extends BaseView. It owns Engine and sub-views. It does not know child markup—it delegates HTML to each view. Commands use paths like `counter.count`; lookup delegates to sub-sections.

```typescript
import * as vscode from "vscode";
import * as path from "path";
import { BaseView } from "../base_view.js";
import { Engine } from "../engine.js";
import { CounterServer } from "../../counter/counter_server.js";
import { CounterView } from "../../counter/view/counter_view.js";

export class EngineView extends BaseView {
  private _panel: vscode.WebviewPanel;
  private _engine: Engine;

  constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    super(extensionUri);
    this._panel = panel;
    const counterPath = path.join(extensionUri.fsPath, "counter.json");
    this._engine = new Engine(new CounterServer(counterPath));  // server domain (persistence)
    this.counter = new CounterView(this._panel, this._engine.counter, extensionUri);  // server view; has engine

    this._panel.webview.html = this._getHtml();
    this._panel.webview.onDidReceiveMessage((message: { command: string; [key: string]: unknown }) => {
      const { command, ...args } = message;
      const [obj, key] = this._lookup(command);
      const method = (obj as Record<string, unknown>)[key];
      if (typeof method === "function") (method as (...args: unknown[]) => unknown).apply(obj, Object.values(args));
    });
  }

  _lookup(pathStr: string): [object, string] {
    const parts = pathStr.split(".");
    let target: object = this;
    for (let i = 0; i < parts.length - 1; i++) target = (target as Record<string, unknown>)[parts[i]] as object;
    return [target, parts[parts.length - 1]];
  }

  private _getHtml(): string {
    const webview = this._panel.webview;
    const asUri = (p: string[]) => webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, ...p));
    const nonce = getNonce();
    const counterHtml = this.counter.getHtml();  // delegate; EngineView does not know counter markup

    return this.renderTemplate("engine/view/Engine.html", {
      nonce,
      content: counterHtml,
      themeCssUri: asUri(["view", "theme.css"]).toString(),
      engineCssUri: asUri(["engine", "view", "layout.css"]).toString(),
      bundleUri: asUri(["counter", "view", "counter_bundle.js"]).toString(),
      counterClientUri: asUri(["counter", "view", "counter_client.js"]).toString(),
      engineClientUri: asUri(["engine", "view", "engine_client.js"]).toString()
    });
  }

  static createOrShow(extensionUri: vscode.Uri): void { /* create panel, new EngineView(panel, extensionUri) */ }
}
```

##### Engine.html (template)

Loaded by EngineView._getHtml(). Placeholders: `{{nonce}}`, `{{content}}`, `{{themeCssUri}}`, `{{engineCssUri}}`, `{{bundleUri}}`, `{{counterClientUri}}`, `{{engineClientUri}}`.

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-{{nonce}}'; style-src 'unsafe-inline' 'self';">
  <link rel="stylesheet" href="{{themeCssUri}}">
  <link rel="stylesheet" href="{{engineCssUri}}">
</head>
<body>
  <div class="engine-view">{{content}}</div>
  <script nonce="{{nonce}}" src="{{bundleUri}}"></script>
  <script nonce="{{nonce}}" src="{{counterClientUri}}"></script>
  <script nonce="{{nonce}}" src="{{engineClientUri}}"></script>
</body></html>
```

**Note:** CSP `style-src` must allow the CSS URIs. Sub-views (e.g. Counter) include their own `<link>` in their HTML fragment.

##### CounterView (counter_view.ts)

CounterView extends BaseView and **implements ICounter**. It receives the panel, counter (from Engine), and extensionUri. It loads its HTML from a template file and mirrors the counter API. Methods delegate to domain and post to webview.

```typescript
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { BaseView } from "../../engine/base_view.js";
import type { ICounter } from "../../counter/counter.js";

export class CounterView extends BaseView implements ICounter {
  /** Raw template HTML. View loads and stores; tests use for DOM fixtures. Single source of truth. */
  static get template(): string {
    if (!(CounterView as { _template?: string })._template) {
      const p = path.join(__dirname, "Counter.html");
      (CounterView as { _template?: string })._template = fs.readFileSync(p, "utf8");
    }
    return (CounterView as { _template?: string })._template;
  }

  private _panel: vscode.WebviewPanel;
  private _counter: ICounter;
  foo: { bar: string };

  constructor(panel: vscode.WebviewPanel, counter: ICounter, extensionUri: vscode.Uri) {
    super(extensionUri);
    this._panel = panel;
    this._counter = counter;
    const v = this;
    this.foo = {
      get bar(): string { return v._counter.foo.bar; },
      set bar(val: string) {
        v._counter.foo.bar = val;
        v._panel.webview.postMessage({ fooBar: val });
      }
    };
  }

  get total(): number {
    return this._counter.total;
  }

  getHtml(): string {
    const counterCssUri = this._panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "counter", "view", "counter.css"));
    return this.renderTemplate("counter/view/Counter.html", {
      total: String(this._counter.total),
      fooBar: this._counter.foo?.bar ?? "",
      counterCssUri: counterCssUri.toString()
    });
  }

  count(amount: number | string): void {
    this._counter.count(amount);
    this._panel.webview.postMessage({ total: this._counter.total });
  }

  reset(): void {
    this._counter.reset();
    this._panel.webview.postMessage({ total: this._counter.total });
  }

  /** HTML for test fixtures (placeholder defaults). Tests use this for JSDOM. */
  static getFixtureHtml(data?: { total?: number; fooBar?: string; counterCssUri?: string }): string {
    const d = { total: "0", fooBar: "", counterCssUri: "", ...data };
    let html = CounterView.template;
    for (const [k, v] of Object.entries(d)) html = html.split(`{{${k}}}`).join(String(v));
    return html;
  }
}
```

**Note:** The message handler uses `view.counter.total` (getter) and `view.counter.foo.bar` (get/set) for the protocol; `count`/`reset` post the updated total after delegating. The View owns its template; tests use `CounterView.template` or `CounterView.getFixtureHtml()` for DOM fixtures.

##### Counter.html (template)

Loaded by CounterView.getHtml(). Placeholders: `{{total}}`, `{{fooBar}}`, `{{counterCssUri}}`.

```html
<link rel="stylesheet" href="{{counterCssUri}}">
<section class="counter-section">
  <label>Amount: <input id="amount" type="number" value="0" /></label>
  <button id="resetBtn">Reset</button>
  <span id="total">{{total}}</span>
  <label>Foo.bar: <input id="fooBar" type="text" value="{{fooBar}}" /></label>
</section>
```

##### CSS (engine.css, layout.css, counter.css)

- **engine.css** (engine/): Base theme—vars, typography, section spacing. Loaded by Engine.html.
- **layout.css** (engine/view/): Engine-specific layout and overrides.
- **counter.css** (counter/view/): Counter section positioning and styling. Loaded in Counter.html fragment.

##### engine_client.ts

Orchestrator: acquires VS Code API, loads section clients. (Compiled to JS for webview.)

```typescript
import { initCounterClient } from "../counter/view/counter_client.js";

(function (): void {
  const vscode = acquireVsCodeApi();
  initCounterClient(vscode);
})();
```

##### counter_client.ts

**`domCounter` implements `ICounter`** — same interface as domain; each method runs domain op, then updates only the DOM element that changed. (Compiled to JS for webview.)

```typescript
import { Counter } from "../counter.js";
import type { HydrateData, ICounter } from "../counter.js";

interface VsCodeApi {
  postMessage(message: unknown): void;
}

export function initCounterClient(vscode: VsCodeApi): ICounter {
  const amountInput = document.getElementById("amount") as HTMLInputElement;
  const resetBtn = document.getElementById("resetBtn") as HTMLButtonElement;
  const totalEl = document.getElementById("total") as HTMLSpanElement;
  const fooBarInput = document.getElementById("fooBar") as HTMLInputElement;

  const counter = new Counter();

  function syncToServer(command: string, value?: unknown): void {
    vscode.postMessage(value !== undefined ? { command, value } : { command });
  }

  // DOM adapter: implements ICounter; each method runs domain op, updates DOM, syncs to server
  const domCounter: ICounter = {
    count(amount: number | string): void {
      counter.count(Number(amount) || 0);
      totalEl.textContent = String(counter.total);
      syncToServer("counter.count", Number(amount) || 0);
    },
    reset(): void {
      counter.reset();
      totalEl.textContent = String(counter.total);
      syncToServer("counter.reset");
    },
    get total(): number {
      return counter.total;
    },
    get foo() {
      return {
        get bar(): string {
          return counter.foo.bar;
        },
        set bar(val: string) {
          counter.foo.bar = val;
          fooBarInput.value = val;
        }
      };
    },
    hydrate(data: HydrateData): void {
      counter.hydrate(data);
      if (data.total !== undefined) totalEl.textContent = String(counter.total);
      if (data.fooBar !== undefined) fooBarInput.value = counter.foo.bar;
    }
  };

  amountInput.addEventListener("change", () => domCounter.count(amountInput.value));
  resetBtn.addEventListener("click", () => domCounter.reset());
  fooBarInput.addEventListener("change", () => {
    domCounter.foo.bar = fooBarInput.value;
    syncToServer("counter.foo.bar", domCounter.foo.bar);
  });

  window.addEventListener("message", (event: MessageEvent) => {
    if ("total" in event.data || "fooBar" in event.data) domCounter.hydrate(event.data as HydrateData);
  });
  vscode.postMessage({ command: "counter.total" });
  vscode.postMessage({ command: "counter.foo.bar" });
  return domCounter;  // tests call methods directly; no wrapper
}
```

**Note:** `domCounter` implements `ICounter`; same pattern as server view—each method updates only the DOM element that changes.

### File Layout

Each domain (engine, counter) has its own folder: domain objects, cli/adapters, view/ (client js + server view). All server views extend BaseView for template rendering.

```
src/
├── engine/
│   ├── base_view.ts       # BaseView: renderTemplate(relativePath, data); swap impl for Handlebars/etc later
│   ├── engine.css         # Base theme: vars, typography, section spacing
│   ├── engine.ts           # Domain; constructor(counter) for injection
│   ├── engine_cli.ts        # CLI entry (parse args, lookup on Engine, choose adapter)
│   └── view/
│       ├── Engine.html     # Template: loaded by engine_view._getHtml()
│       ├── layout.css       # Engine-specific layout and overrides
│       ├── engine_view.ts  # Server view: loads Engine.html; owns Engine; delegates to sub-views, postMessage
│       └── engine_client.ts # Client orchestrator (compiled to JS for webview)
│
└── counter/
    ├── counter.ts          # Domain (Counter + Foo in same file; pure; no DOM, no Node)
    ├── counter_server.ts   # Server domain: extends Counter; _load, _save
    ├── adapters/           # CLI output adapters
    │   ├── counter_tty.ts
    │   ├── counter_markdown.ts
    │   └── counter_json.ts
    └── view/
        ├── Counter.html    # Template: loaded by counter_view.getHtml()
        ├── counter.css     # Counter section positioning and styling
        ├── counter_view.ts # Server view: loads Counter.html; delegates to ServerCounter; posts to webview
        ├── counter_client.ts # Client: DOM adapter, syncToServer() (compiled to JS for webview)
        └── counter_bundle.js # Build output: Counter+Foo for webview (from counter.ts)
```

### Domain Rule

**Classes that have their own files are roots of a domain** and have this scaffolding for themselves and their children. Child classes (e.g. Foo) live in the root file. See `.cursor/rules/domain-root-scaffolding.mdc`.

### Extension Registration

- Command: `agilebot.viewEngine` → `EngineView.createOrShow(extensionUri)`
- Add to `package.json` contributes.commands

---

## Summary

- **Domain:** Pure TS (Counter, Engine).
- **Common interface (ICounter):** Shared across domain, server domain, server view, and client domCounter. CLI output adapters implement `ICounterOutputAdapter` (wrap `ICounter`, format for stdout).
- **Server domain:** CounterServer extends Counter; adds persistence (_load, _save).
- **Server view:** BaseView (template rendering); EngineView, CounterView extend it; postMessage; uses server domain.
- **HTML templates:** Engine.html, Counter.html; BaseView `renderTemplate(path, data)` with `{{placeholder}}` replacement.
- **CSS:** engine.css (base theme), layout.css (engine layout), counter.css (section styling). Loaded by templates.
- **Client:** Domain (bundled) + DOM adapter. Webview loads shared Counter; no duplicate logic.
- **CLI:** Same domain; output via TTY, Markdown, or JSON adapters.

