# System Architecture Diagram

This diagram shows which files/classes run on which systems in the VS Code extension architecture.

```mermaid
graph TB
    subgraph SERVER["NODE SERVER / EXTENSION HOST<br/>(Node.js Runtime)"]
        subgraph "Extension Entry"
            EXT[extension.ts<br/>VS Code activation]
        end
        
        subgraph "Server Views (postMessage routing)"
            EV[engine_view.ts<br/>EngineView]
            CV[counter_view.ts<br/>CounterView]
            BV[base_view.ts<br/>BaseView]
        end
        
        subgraph "Server Domain (Business Logic + Persistence)"
            CS[counter_server.ts<br/>CounterServer<br/>extends Counter<br/>+ persistence]
            E[engine.ts<br/>Engine]
            C[counter.ts<br/>Counter domain]
        end
        
        subgraph "CLI Entry Point"
            CLI[engine_cli.ts<br/>EngineCLI<br/>Command parser]
        end
        
        subgraph "Output Adapters"
            CA[counter_adapter.ts<br/>ICounterOutputAdapter]
            CTT[counter_tty.ts<br/>CounterTty]
            CJ[counter_json.ts<br/>CounterJson]
            CM[counter_markdown.ts<br/>CounterMarkdown]
        end
        
        EXT --> EV
        EV --> CV
        EV --> E
        CV --> CS
        E --> CS
        CS --> C
        CLI --> E
        CLI --> CA
        CA --> CTT
        CA --> CJ
        CA --> CM
        EV -.inherits.-> BV
        CV -.inherits.-> BV
    end
    
    subgraph COMM[COMMUNICATION]
        MSG[postMessage API]
    end

    subgraph CLIENT["CLIENT-SIDE WEBVIEW<br/>(Browser/Webview Context)"]
        subgraph "Client Scripts (Bundled JS)"
            CC[counter_client.ts<br/>DOM adapter + sync]
            EC[engine_client.ts<br/>UI orchestration]
            CD[counter.ts<br/>Shared Domain Logic<br/>BUNDLED]
        end
        
        subgraph "UI Assets"
            CH[Counter.html]
            EH[Engine.html]
            CSS[counter.css<br/>engine.css<br/>theme.css<br/>layout.css]
        end
        
        CC --> CD
        EC --> CC
        CC --> CH
        EC --> EH
    end
    
    CC <--> MSG
    EC <--> MSG
    MSG <--> EV
    MSG <--> CV
    
    style CLIENT fill:#e1f5ff,stroke:#0066cc,stroke-width:3px
    style SERVER fill:#fff4e1,stroke:#cc6600,stroke-width:3px
    style COMM fill:#f0f0f0,stroke:#666,stroke-width:2px
```

## System Boundaries

### 1. Client-Side Webview (Browser Context)
**Runtime:** Browser JavaScript engine inside VS Code webview  
**Purpose:** UI rendering, user interaction, immediate feedback  
**Files:**
- `counter_client.ts` - DOM adapter that uses shared Counter logic
- `engine_client.ts` - UI orchestration and initialization
- `counter.ts` - **Shared domain logic** (bundled to JS)
- `Counter.html`, `Engine.html` - HTML templates
- `*.css` - Styling (counter.css, engine.css, theme.css, layout.css)

**Key Characteristics:**
- Cannot access Node.js APIs (fs, path, etc.)
- Communicates with server via `postMessage` API
- Uses bundled Counter domain logic for immediate UI updates
- Syncs state to server for persistence

### 2. Node Server / Extension Host
**Runtime:** Node.js (TypeScript compiled to JavaScript)  
**Purpose:** Business logic, persistence, VS Code integration, CLI  
**Files:**

**Extension Entry:**
- `extension.ts` - VS Code extension activation

**Server Views:**
- `engine_view.ts` - EngineView (creates webview panel, routes messages)
- `counter_view.ts` - CounterView (routes counter commands)
- `base_view.ts` - BaseView (shared functionality)

**Server Domain:**
- `counter_server.ts` - CounterServer (extends Counter, adds persistence)
- `engine.ts` - Engine (composes Counter)
- `counter.ts` - Counter (pure domain logic)

**CLI Entry:**
- `engine_cli.ts` - EngineCLI (command parser, standalone usage)

**Output Adapters:**
- `counter_adapter.ts` - ICounterOutputAdapter interface
- `counter_tty.ts` - Terminal output
- `counter_json.ts` - JSON output
- `counter_markdown.ts` - Markdown output

**Key Characteristics:**
- Full Node.js API access (fs, path, crypto, etc.)
- VS Code extension API access
- Handles persistence (persistence/counter.json)
- Provides CLI interface via engine_cli.ts
- Communicates with webview via `postMessage` API

## Communication Flow

### Client → Server (Persistence)
```
User Action → counter.count(amount) [shared logic]
          → updateDOM(counter.total)
          → syncToServer("counter.count", amount)
          → postMessage({ command, value })
          → EngineView._handleMessage()
          → CounterView routes to CounterServer
          → CounterServer.count(amount) + save()
```

### Server → Client (Hydration/Updates)
```
CounterServer persists → postMessage({ total, fooBar })
                      → Webview receives message
                      → counter.hydrate(data)
                      → updateDOM()
```

### CLI Usage (Direct Node.js)
```
node engine_cli.js counter.count --amount 5
              → EngineCLI.run()
              → engine.counter.count(5)
              → CounterTty.format(result)
              → stdout
```

## Design Principles

1. **Shared Domain Logic:** `counter.ts` is shared between client and server (bundled for webview)
2. **Server Adds Persistence:** `CounterServer` extends `Counter`, adding `_load()` and `_save()`
3. **Client Adds DOM:** `counter_client.ts` wraps domain logic with DOM updates
4. **CLI Separate Entry:** `engine_cli.ts` provides standalone Node.js interface
5. **No Logic Duplication:** Business logic lives once in TypeScript; client bundles it
