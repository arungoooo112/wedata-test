import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "wedata-test" is now active!');

    // 创建树状视图面板
    const testViewProvider = new TreeViewProvider();
    vscode.window.registerTreeDataProvider('testView', testViewProvider);

    const allTestViewProvider = new TreeViewProvider();
    vscode.window.registerTreeDataProvider('filesView', allTestViewProvider);

    // 创建数据库连接视图面板
    const viewType = 'myWebviewView';
    const dbViewProvider = new MyWebviewViewProvider("dbview");
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
    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext, token: vscode.CancellationToken): Thenable<void> | void { 
        webviewView.webview.html = getWebviewContent();
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


function getWebviewContent() {
    return `
      <html>
      <style>
        .container {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
        }
        .container input[type="text"] {
          margin-right: 10px;
        }
        .container ul {
          list-style-type: none;
          padding: 0;
        }
        .container ul li {
          margin-bottom: 5px;
        }
      </style>
      <body>
        <div class="container">
          <input type="text" id="myInput" placeholder="请输入内容">
          <button onclick="showValue()">
            <img src="../media/add.svg" alt="图标">
          </button>
        </div>
  
        <ul id="treeView">
          <li>节点1</li>
          <li>节点2</li>
          <li>节点3</li>
        </ul>
  
        <script>
          function showValue() {
            const input = document.getElementById('myInput');
            const value = input.value;
            alert('你输入的内容是：' + value);
          }
  
          const treeView = document.getElementById('treeView');
          treeView.addEventListener('click', event => {
            const target = event.target;
            if (target.tagName === 'LI') {
              alert('你点击了节点：' + target.textContent);
            }
          });
        </script>
      </body>
      </html>
    `;
  }


  export class MyWebviewViewProvider implements vscode.WebviewViewProvider {
    private readonly viewType: string;

    constructor(viewType: string) {
        this.viewType = viewType;
    }

    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void {
        // 设置 Webview 的 HTML 内容
        webviewView.webview.html = this.getWebviewContent();

        // 注册 Webview 接收消息的处理程序
        webviewView.webview.onDidReceiveMessage(message => {
            // 处理收到的消息
            if (message.command === 'myCommand') {
                // 执行相应的逻辑
            }
        });
    }

    private getWebviewContent(): string {
        // 返回包含 HTML 内容的字符串
        return `
            <html>
            <body>
                <h1>Hello, Webview!</h1>
                <button onclick="sendMessage()">Send Message</button>

                <script>
                    function sendMessage() {
                        // 向扩展发送消息
                        vscode.postMessage({ command: 'myCommand', text: 'Hello from Webview!' });
                    }
                </script>
            </body>
            </html>
        `;
    }
}