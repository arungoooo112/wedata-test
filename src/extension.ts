import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

function getExtentionPath(): string {
  const currentExtension = vscode.extensions.getExtension('frankrun.wedata-test');
  if (!currentExtension) { return ""; }
  return currentExtension.extensionPath;
}

export async function activate(context: vscode.ExtensionContext) {

  console.log('Congratulations, your extension "wedata-test" is now active!');
  let cursorRecords: string[] = [];
  
  vscode.window.onDidChangeTextEditorSelection(event => {
    const selections = event.selections;
    if (selections.length <= 1) return;
    cursorRecords = [];
    for (const selection of selections) {
      const wordRange = event.textEditor.document.getWordRangeAtPosition(selection.start);
      if (!wordRange) {
        return;
      }
      const word = event.textEditor.document.getText(wordRange);
      cursorRecords.push(word);
    }
    console.log(selections.length, ': ', cursorRecords.join('; '));
  });

  registerCommands();

  // 获取插件的绝对路径

  const snippetsPath = path.join(getExtentionPath(), 'snippets', 'snippets.json');

  // 读取代码片段文件的内容
  const fileUri = vscode.Uri.file(snippetsPath);
  const content = JSON.parse((await vscode.workspace.fs.readFile(fileUri)).toString());

  const treeDataProvider = new SnippetsTreeDataProvider(content);

  // 注册树视图
  vscode.window.registerTreeDataProvider('testView', treeDataProvider);

  const historyTreeDataProvider = new SnippetsTreeDataProvider(JSON.parse('{}'));

  // 注册树视图s
  vscode.window.registerTreeDataProvider('historyView', historyTreeDataProvider);

  const dbViewProvider = new MyWebviewViewProvider();
  vscode.window.registerWebviewViewProvider('dbView', dbViewProvider);

  let runTest = async (label: string) => {

   const cnt = cursorRecords.length;
    if (cnt == 0) return;

    let items: vscode.QuickPickItem[] = [
      { label: label, description: '第一个选项' },
      { label: label, description: '第二个选项' },
      { label: label, description: '第三个选项' }
    ];

    for (const node of treeDataProvider.SnippetNodes) {
      if (node.feature == label && node.count == cnt) {
        items.push({ label: node.feature, description: node.label });
      }
    };

    const options: vscode.QuickPickOptions = {
      canPickMany: false, // 是否可以多选
      placeHolder: cursorRecords.join('; '), // 弹窗的占位符
      ignoreFocusOut: true // 是否在失去焦点时关闭弹窗
    };

    const selectedOption = await vscode.window.showQuickPick(items, options);

    if (selectedOption) {
      // 用户选择了一个选项
      if (selectedOption.description) {
        let snippets = treeDataProvider.snippets[selectedOption.description];
        let snibody: string = snippets.body.join("\n");

        for (let i = 1; i <= cursorRecords.length; i++) {
          const pattern = new RegExp(`\\$${i}`, 'g');
          snibody = snibody.replace(pattern, cursorRecords[i - 1]);
        }
        await vscode.window.withProgress({
          location: vscode.ProgressLocation.Notification,
        }, async (progress) => {
          progress.report({
            message: 'Testing...',
          });

          // todo: connect database
          await new Promise(resolve => setTimeout(resolve, 2000));
          vscode.window.showErrorMessage(`Test Fail: ${snibody}`);
          if (selectedOption.description) {
            historyTreeDataProvider.addSnippet(selectedOption.description, snippets);
          }
        })
      }
    }

    cursorRecords = []; // 清空记录  
  };

  context.subscriptions.push(vscode.commands.registerCommand('wedata-test.Validity', async () => {
    runTest("Validity");
  }));
  context.subscriptions.push(vscode.commands.registerCommand('wedata-test.Reliability', async () => {
    runTest("Reliability");
  }));
  context.subscriptions.push(vscode.commands.registerCommand('wedata-test.Accuracy', async () => {
    runTest("Accuracy");
  }));
  context.subscriptions.push(vscode.commands.registerCommand('wedata-test.Completeness', async () => {
    runTest("Completeness");
  }));
  context.subscriptions.push(vscode.commands.registerCommand('wedata-test.Uniqueness', async () => {
    runTest("Uniqueness");
  }));
  context.subscriptions.push(vscode.commands.registerCommand('wedata-test.Consistency', async () => {
    runTest("Consistency");
  }));
}

function registerCommands() {
  vscode.commands.registerCommand('wedata-test.runTest', async () => {

  });


  vscode.commands.registerCommand('wedata-test.openNewFile', () => {
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
  vscode.commands.registerCommand('wedata-test.showHello', async (node: SnippetNode) => {

    if (typeof node.label == 'string') {
      //这一段有输出
      //vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(node.label));
    };

    if (node.body) {
      console.log(node.body);
      //  vscode.window.showInformationMessage(node.body);
      const s = new vscode.SnippetString(node.body);
      vscode.window.activeTextEditor?.insertSnippet(s);
    }
  }
  );

  vscode.commands.registerCommand('wedata-test.refresh', () => {
    console.log('Show Tree View command executed');
    vscode.commands.executeCommand('setContext', 'showTreeView', true);
  });


  vscode.commands.registerCommand('wedata-test.openDBView', () => {
    console.log('Open DB View command executed');
    vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('wedata-db://dbView'));
  });
}
class SnippetNode extends vscode.TreeItem {
  public body: string;
  public feature: string;
  public count: number;
  public head: string;
  public override  label: string;

  constructor(label: string, code: any) {
    super(label);
    this.label = label;

    this.tooltip = code.description;
    this.head = code.description;
    this.body = code.body.join("\n");
    this.feature = code.description.substring(0, code.description.indexOf(':')).trim();

    const variablePattern = /\$[0-9]+/g;
    const variables = this.body.match(variablePattern);
    const uniqueVariables = new Set(variables);
    this.count = uniqueVariables.size;

    if (this.feature == 'Validity') {
      this.iconPath = new vscode.ThemeIcon('smiley');
    }
    else if (this.feature == 'Reliability') {
      this.iconPath = new vscode.ThemeIcon('shield');
    }
    else if (this.feature == 'Accuracy') {
      this.iconPath = new vscode.ThemeIcon('pass');
    }
    else if (this.feature == 'Completeness') {
      this.iconPath = new vscode.ThemeIcon('pie-chart');
    }
    else if (this.feature == 'Uniqueness') {
      this.iconPath = new vscode.ThemeIcon('key');

    }
    else if (this.feature == 'Consistency') {
      this.iconPath = new vscode.ThemeIcon('list-selection');
    }
    else {
      this.iconPath = new vscode.ThemeIcon('star');
    }
  }
}

// 创建树视图提供者类·
class SnippetsTreeDataProvider implements vscode.TreeDataProvider<SnippetNode> {
  public snippets: any;
  public SnippetNodes: SnippetNode[];

  private _onDidChangeTreeData: vscode.EventEmitter<SnippetNode | undefined | null | void> = new vscode.EventEmitter<SnippetNode | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<SnippetNode | undefined | null | void> = this._onDidChangeTreeData.event;
  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }
  //   updateItem(label: string, description: string): void {
  //     const item = this.SnippetNodes.find((item) => item.label === label);
  //     if (item) {
  //         item.description = description;
  //         this._onDidChangeTreeData.fire(item);
  //     }
  // }

  // 新增节点的方法
  addSnippet(label: string, snippet: string): void {
    //this.snippets[label] = snippet;
    const newSnippetNode = new SnippetNode(label, snippet);
    this.SnippetNodes.push(newSnippetNode);
    this._onDidChangeTreeData.fire(undefined); // 触发树视图数据更改事件，传递新增的节点
  }
  constructor(snippets: any) {
    this.snippets = snippets;
    this.SnippetNodes = [];
  }

  getTreeItem(element: SnippetNode): vscode.TreeItem {
    return element;
  }

  getChildren(element?: SnippetNode): vscode.ProviderResult<SnippetNode[]> {
    if (!element) {
      // 根节点，返回所有代码片段
      this.SnippetNodes = Object.keys(this.snippets).map(label => new SnippetNode(label, this.snippets[label]));
      return Promise.resolve(this.SnippetNodes);
    }
    return Promise.resolve([]);
  }
}


class MyWebviewViewProvider implements vscode.WebviewViewProvider {

  resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void {

    const assetUri = (fp: string) => {

      const currentExtension = vscode.extensions.getExtension('frankrun.wedata-test');
      if (!currentExtension) { return; }

      const fragments = fp.split('/');

      let furi = vscode.Uri.file(
        path.join(currentExtension.extensionPath, ...fragments)
      );
      console.log(furi.path);
      return webviewView.webview.asWebviewUri(furi);
    };
    const { cspSource } = webviewView.webview;

    webviewView.webview.html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <link rel="stylesheet" href="${assetUri('node_modules/vscode-codicons/dist/codicon.css')}" id="vscode-codicon-stylesheet">
            <script src="${assetUri('node_modules/@bendera/vscode-webview-elements/dist/bundled.js')}" type="module"></script>
        </head>
        <body>
        <h1>Hello, Wedata Test</h1>
        </body>
        </html>
    `;

    webviewView.webview.onDidReceiveMessage(message => {
      if (message.command === 'myCommand') {
        // 执行相应的逻辑
      }
    });
  }
}




export function deactivate() {
  console.log('Your extension "wedata-test" has been deactivated.');
}