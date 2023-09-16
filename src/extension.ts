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

    vscode.commands.registerCommand('wedata-test.showHello', async (node: TreeNode) => {
        // Define the snippets to be inserted
        const snippets = new vscode.SnippetString('/*\n' +
            '测试id：check_null_field\n' +
            '描述：检查字段是否为 NULL 值\n' +
            '参数：\n' +
            '  - p_table_name: 要检查的表\n' +
            '  - p_column_name: 要检查的字段\n' +
            '返回：\n' +
            '  - r_result: 字段包含 NULL 值\n' +
            '*/\n' +
            'BEGIN\n' +
            '\n' +
            '-- 获取字段值\n' +
            'SELECT count(1) INTO p_column_value FROM r_result WHERE p_column_name is null; -- 添加适当的 WHERE 子句来选择记录\n' +
            '  -- 检查字段是否为 NULL\n' +
            '  IF r_result IS NOT NULL THEN\n' +
            '    RAISE_APPLICATION_ERROR(-20001, \'The field contains NULL value.\');\n' +
            '  END IF;\n' +
            '\n' +
            'END;');
    
        // Insert the snippets into the active editor
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.insertSnippet(snippets);
        }
    });
    vscode.commands.registerCommand('wedata-test.showHello', (node: TreeNode) => {
        console.log(`Clicked on node: ${node.label}`);
        const helloText = 'hello';
        vscode.workspace.openTextDocument({ content: helloText })
            .then(vscode.window.showTextDocument);
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
        webviewView.webview.html = this.getWebviewContent();

        webviewView.webview.onDidReceiveMessage(message => {
            if (message.command === 'myCommand') {
                // 执行相应的逻辑
            }
        });
    }

    private getWebviewContent(): string {
        return `
            <html>
            <body>
                <h1>Hello, Webview!</h1>
                <button onclick="sendMessage()">Send Message</button>

                <script>
                    function sendMessage() {
                        vscode.postMessage({ command: 'myCommand', text: 'Hello from Webview!' });
                    }
                </script>
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