// Mock VS Code API for testing
export const Uri = {
  file: (path: string) => ({ fsPath: path, toString: () => path }),
  joinPath: (base: { fsPath: string }, ...segments: string[]) => ({
    fsPath: [base.fsPath, ...segments].join("/"),
    toString: () => [base.fsPath, ...segments].join("/"),
  }),
};

export interface WebviewPanel {
  webview: {
    postMessage: (message: unknown) => Thenable<boolean>;
    asWebviewUri: (uri: unknown) => unknown;
    html: string;
  };
  onDidReceiveMessage: (handler: (message: unknown) => void) => void;
  dispose: () => void;
}

export function createMockWebviewPanel(postedMessages: unknown[]): WebviewPanel {
  return {
    webview: {
      postMessage: (msg: unknown) => {
        postedMessages.push(msg);
        return Promise.resolve(true);
      },
      asWebviewUri: (uri: unknown) => uri,
      html: "",
    },
    onDidReceiveMessage: () => {},
    dispose: () => {},
  };
}
