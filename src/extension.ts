import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "wedata-test" is now active!');

    registerCommands();

    const testViewProvider = new TreeViewProvider();
    vscode.window.registerTreeDataProvider('testView', testViewProvider);

    const dbViewProvider = new MyWebviewViewProvider("dbView");
    vscode.window.registerWebviewViewProvider(dbViewProvider.viewType, dbViewProvider);
}

function registerCommands() {
    vscode.commands.registerCommand('wedata-test.showHello', (node: TreeNode) => {
        console.log(`Clicked on node: ${node.label}`);
        const helloText = 'hello';

        // 获取当前打开的文本编辑器
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            // 在当前光标位置追加文本
            editor.edit(editBuilder => {
                editBuilder.insert(editor.selection.active, helloText);
            });
        }
    });

    vscode.commands.registerCommand('wedata-test.showTreeView', () => {
        console.log('Show Tree View command executed');
        vscode.commands.executeCommand('setContext', 'showTreeView', true);
    });

    vscode.commands.registerCommand('wedata-test.hideTreeView', () => {
        console.log('Hide Tree View command executed');
        vscode.commands.executeCommand('setContext', 'showTreeView', false);
    });

    vscode.commands.registerCommand('wedata-test.openDBView', () => {
        console.log('Open DB View command executed');
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('wedata-db://dbView'));
    });
}

class TreeViewProvider implements vscode.TreeDataProvider<TreeNode> {
    private data: TreeNode[];

    constructor() {
        this.data = [
            new TreeNode('Node 1', vscode.TreeItemCollapsibleState.None),
            new TreeNode('Node 2', vscode.TreeItemCollapsibleState.Collapsed),
            new TreeNode('Node 3', vscode.TreeItemCollapsibleState.None),
        ];
    }

    getTreeItem(element: TreeNode): vscode.TreeItem {
        return element;
    }

    getChildren(element?: TreeNode): Thenable<TreeNode[]> {
        if (element) {
            return Promise.resolve([]);
        } else {
            return Promise.resolve(this.data);
        }
    }
}

class MyWebviewViewProvider implements vscode.WebviewViewProvider {
    readonly viewType: string;

    constructor(viewType: string) {
        this.viewType = viewType;
    }

    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void {
        webviewView.webview.html = this.getWebviewContent(webviewView);
        webviewView.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'myCommand':  {
                    // 获取当前打开的文本编器
                    vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(`#${message.text}`));
                    break;
					}
              }
        } 
        );
    }

    private getWebviewContent(webviewView: vscode.WebviewView): string {
        return `
            <html>
            <body>
                <h1>Hello, Webview!</h1>
                <button onclick="sendMessage()">Send Message</button>

                <script>
                    function sendMessage() {
                        const message = { command: 'myCommand', text: 'Hello from Webview!' };
                        vscode.postMessage(message);
                    }
                </script>

                <div id="container"></div>
            </body>
            </html>
        `;
    }
}

class TreeNode extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.command = {
            command: 'wedata-test.showHello',
            title: 'Show Hello',
            arguments: [this]
        };
    }
}

export function deactivate() {
    console.log('Your extension "wedata-test" has been deactivated.');
}