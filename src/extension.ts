import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "wedata-test" is now active!');
    // 注册 webview 的消息处理程序
    vscode.window.registerWebviewViewProvider('wedata-test', {
        resolveWebviewView(webviewView: vscode.WebviewView) {
            webviewView.webview.onDidReceiveMessage(message => {
                if (message.command === 'newFile') {
                    // 在这里执行新建文件的逻辑
                    vscode.window.showInformationMessage('执行新建文件操作');
                }
            });
        }
    });
    // 创建树状视图面板
    const testViewProvider = new TreeViewProvider();
    vscode.window.registerTreeDataProvider('testView', testViewProvider);

    const allTestViewProvider = new TreeViewProvider();
    vscode.window.registerTreeDataProvider('filesView', allTestViewProvider);

    // 创建数据库连接视图面板
    const dbViewProvider = new DBViewProvider();
    vscode.window.registerWebviewViewProvider('dbView', dbViewProvider);

    // 监听树节点点击事件
    vscode.commands.registerCommand('wedata-test.showHello', (node: TreeNode) => {
        console.log(`Clicked on node: ${node.label}`);

        // 在笔记本窗口中生成 "hello" 文本
        const helloText = 'hello';
        vscode.workspace.openTextDocument({ content: helloText })
            .then(vscode.window.showTextDocument);
    });

    // 注册命令以显示树状视图
    vscode.commands.registerCommand('wedata-test.showTreeView', () => {
        console.log('Show Tree View command executed');
        vscode.commands.executeCommand('setContext', 'showTreeView', true);
    });

    // 注册命令以隐藏树状视图
    vscode.commands.registerCommand('wedata-test.hideTreeView', () => {
        console.log('Hide Tree View command executed');
        vscode.commands.executeCommand('setContext', 'showTreeView', false);
    });

    // 注册命令以打开数据库连接视图
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

class DBViewProvider implements vscode.WebviewViewProvider {
    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void {
        webviewView.webview.html = '<h1>Database Connection View</h1>';
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