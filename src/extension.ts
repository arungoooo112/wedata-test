import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "wedata-test" is now active!');

    // 创建树状视图面板
    const treeViewProvider = new TreeViewProvider();
    vscode.window.registerTreeDataProvider('myTreeView', treeViewProvider);

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