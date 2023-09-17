import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
interface CursorRecord {
    selection: vscode.Selection;
    timestamp: number;
  }
  

  function getExtentionPath() : string{
    const currentExtension = vscode.extensions.getExtension('frankrun.wedata-test');
    if (!currentExtension) {return "";}
    return currentExtension.extensionPath;
  }

export async function activate(context: vscode.ExtensionContext) {

    console.log('Congratulations, your extension "wedata-test" is now active!');
    let cursorRecords : CursorRecord[] = [];

    vscode.window.onDidChangeTextEditorSelection(event => {
      const editor = event.textEditor;
      const selections = editor.selections;
      const timestamp = Date.now();
    
      for (const selection of selections) {
        const cursorRecord = {
          selection: selection,
          timestamp: timestamp
        };
    
        const keyExists = cursorRecords.some(record => {
          return record.selection.isEqual(selection);
        });
    
        if (!keyExists) {
          cursorRecords.push(cursorRecord);  
        }
      }
    });


    let disposable = vscode.commands.registerCommand('wedata-test.showTreeView',  () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          const selections = editor.selections.slice(); // 创建副本

          selections.sort((a, b) => {
            // 按照光标的按下顺序排序
            return a.anchor.compareTo(b.anchor);
          });
    
          for (const selection of selections) {
            // 在这里处理每个光标位置
            const start = selection.start;
            const end = selection.end;
            console.log(`光标位置：${start.line}:${start.character} - ${end.line}:${end.character}`);
          }
        }
      });
    
	context.subscriptions.push(disposable);
    registerCommands();

    // 获取插件的绝对路径

    const snippetsPath = path.join(getExtentionPath(), 'snippets', 'snippets.json');

    // 读取代码片段文件的内容
    const fileUri = vscode.Uri.file(snippetsPath);
    const content =  JSON.parse((await vscode.workspace.fs.readFile(fileUri)).toString());

    const treeDataProvider = new SnippetsTreeDataProvider(content);

    // 注册树视图
    vscode.window.registerTreeDataProvider('testView', treeDataProvider);
 
    const dbViewProvider = new MyWebviewViewProvider();
    vscode.window.registerWebviewViewProvider('dbView', dbViewProvider);

    let func = (nume: number, feature: string) =>{


        const options: vscode.QuickPickOptions = {
            canPickMany: false, // 是否可以多选
            placeHolder: '请选择一个选项', // 弹窗的占位符
            ignoreFocusOut: true // 是否在失去焦点时关闭弹窗
        };
    
        const items: vscode.QuickPickItem[] = [
            { label: '选项1', description: '第一个选项' },
            { label: '选项2', description: '第二个选项' },
            { label: '选项3', description: '第三个选项' }
        ];



    };

    context.subscriptions.push(vscode.commands.registerCommand('wedata-test.hideTreeView', async () => {
        cursorRecords.sort((a, b) => a.timestamp - b.timestamp);
        const cnt = cursorRecords.length;

        for (const cursorRecord of cursorRecords) {
          const selection = cursorRecord.selection;
          const start = selection.start;
          const end = selection.end;
          vscode.window.showInformationMessage(`光标位置：${start.line}:${start.character} - ${end.line}:${end.character}`);
        }
    
        cursorRecords = []; // 清空记录

        const options: vscode.QuickPickOptions = {
            canPickMany: false, // 是否可以多选
            placeHolder: '请选择一个选项', // 弹窗的占位符
            ignoreFocusOut: true // 是否在失去焦点时关闭弹窗
        };
    
        const items: vscode.QuickPickItem[] = [
            { label: '选项1', description: '第一个选项' },
            { label: '选项2', description: '第二个选项' },
            { label: '选项3', description: '第三个选项' }
        ];
    
        const selectedOption = await vscode.window.showQuickPick(items, options);
    
        if (selectedOption) {
            // 用户选择了一个选项
            vscode.window.showInformationMessage(`你选择了: ${selectedOption.label}`);
        }


      }));
}

function registerCommands() {
    vscode.commands.registerCommand('wedata-test.runTest', async () => {
        const options: vscode.QuickPickOptions = {
            canPickMany: false, // 是否可以多选
            placeHolder: '请选择一个选项', // 弹窗的占位符
            ignoreFocusOut: true // 是否在失去焦点时关闭弹窗
        };
    
        const items: vscode.QuickPickItem[] = [
            { label: '选项1', description: '第一个选项' },
            { label: '选项2', description: '第二个选项' },
            { label: '选项3', description: '第三个选项' }
        ];
    
        const selectedOption = await vscode.window.showQuickPick(items, options);
    
        if (selectedOption) {
            // 用户选择了一个选项
            vscode.window.showInformationMessage(`你选择了: ${selectedOption.label}`);
        }
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
            vscode.window.showInformationMessage(s.value);
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

    public body:string;
    public feature: string;
    public count: number;

    constructor(label: string, code: any) {
        super(label);
        this.tooltip = code.description;
        this.body = code.body.join("\n");
        this.feature = code.description.substring(0, code.description.indexOf(':')).trim();    
       
        const variablePattern = /\$[0-9]+/g;
        const variables = this.body.match(variablePattern);
        const uniqueVariables = new Set(variables);
        this.count = uniqueVariables.size;

        if (this.feature == 'Validity'){
            this.iconPath = new vscode.ThemeIcon('smiley');
          }
          else if (this.feature == 'Reliability'){
            this.iconPath = new vscode.ThemeIcon('shield');
          }
          else if (this.feature == 'Accuracy'){
            this.iconPath = new vscode.ThemeIcon('pass');
          }
          else if (this.feature == 'Completeness'){
            this.iconPath = new vscode.ThemeIcon('pie-chart');
        
          }
          else if (this.feature == 'Uniqueness'){
            this.iconPath = new vscode.ThemeIcon('key');
        
          }
          else if (this.feature == 'Consistency'){
            this.iconPath = new vscode.ThemeIcon('list-selection');
        }
        else {
            this.iconPath = new vscode.ThemeIcon('star');
        }
        
          
    }
}

// 创建树视图提供者类
class SnippetsTreeDataProvider implements vscode.TreeDataProvider<SnippetNode> {
    constructor(public snippets: any) {}

    getTreeItem(element: SnippetNode): vscode.TreeItem {
        return element;
    }

    getChildren(element?: SnippetNode): vscode.ProviderResult<SnippetNode[]> {
        if (!element) {
            // 根节点，返回所有代码片段
            return Object. keys(this.snippets).map(label => new SnippetNode(label, this.snippets[label]));
        }
        return [];
    }
}


class MyWebviewViewProvider implements vscode.WebviewViewProvider {

    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void {
        
        const assetUri = (fp: string) => {

            const currentExtension = vscode.extensions.getExtension('frankrun.wedata-test');
            if (!currentExtension) {return;}
            
            const fragments = fp.split('/');

            let furi =  vscode.Uri.file(
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