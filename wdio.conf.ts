// wdio.conf.ts — WebdriverIO configuration for VS Code E2E testing
import fs from 'node:fs/promises'
import url from 'node:url'
import path from 'node:path'
import type { Options } from '@wdio/types' with { "resolution-mode": "import" };



// const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export const config: Options.Testrunner = {
  runner: "local",
  autoCompileOpts: {
    autoCompile: true,
    tsNodeOpts: {
      project: path.join(__dirname, 'tsconfig.json'),
      transpileOnly: true,
    },
  },

  specs: ["./test/e2e/**/*.e2e.ts"],
  exclude: [],

  maxInstances: 1,
  capabilities: [
    {
      browserName: "vscode",
      browserVersion: "stable",
      "wdio:vscodeOptions": {
        // extensionPath should point to the root directory containing package.json of the extension. it doesn't necessarily need to be the repo root
        extensionPath: __dirname, 
        workspacePath: __dirname,        
        userSettings: {
          "editor.fontSize": 14,
        },
        vscodeArgs: { 
          disableExtensions: false,
          "disable-workspace-trust": true
        }
      },
    },
  ],

  logLevel: "info",
  bail: 0,
  waitforTimeout: 10000,
  connectionRetryTimeout: 120000,
  connectionRetryCount: 3,

  services: ["vscode"],

  framework: "mocha",
  mochaOpts: {
    ui: "bdd",
    timeout: 60000,
  },

  reporters: ["spec"],
};
