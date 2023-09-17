import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {


    console.log('Congratulations, your extension "wedata-test" is now active!');

    let disposable = vscode.commands.registerCommand('wedata-test.showTreeView', () => {
		// The code you place here will be executed every time your command is executed

		const columnToShowIn = vscode.window.activeTextEditor
        ? vscode.window.activeTextEditor.viewColumn
        : undefined;

		const currentPanel = vscode.window.createWebviewPanel(
			'vscweHello',
			'Hello World',
			<vscode.ViewColumn>columnToShowIn,
			{
				enableScripts: true,
			}
		);

        const assetUri = (fp: string) => {

            const currentExtension = vscode.extensions.getExtension('frankrun.wedata-test');
            if (!currentExtension) {return;}
            
            const fragments = fp.split('/');

            let furi =  vscode.Uri.file(
                path.join(currentExtension.extensionPath, ...fragments)
            );
        console.log(furi.path);
			return currentPanel.webview.asWebviewUri(furi);
		};

		const { cspSource } = currentPanel.webview;

		currentPanel.webview.html = `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<link rel="stylesheet" href="${assetUri('node_modules/vscode-codicons/dist/codicon.css')}" id="vscode-codicon-stylesheet">
				<script src="${assetUri('node_modules/@bendera/vscode-webview-elements/dist/bundled.js')}" type="module"></script>
			</head>
			<body>
			<vscode-button>Hello World!</vscode-button>
			</body>
			</html>
		`;
	});

	context.subscriptions.push(disposable);
    registerCommands();

    // 获取插件的绝对路径
    const extensionPath = context.extensionPath;
    const snippetsPath = path.join(extensionPath, 'snippets', 'snippets.json');

    // 读取代码片段文件的内容
    const fileUri = vscode.Uri.file(snippetsPath);
    vscode.workspace.fs.readFile(fileUri).then(content => {
        const snippets = JSON.parse(content.toString());

        // 创建树视图提供者
        const treeDataProvider = new SnippetsTreeDataProvider(snippets);

        // 注册树视图
        vscode.window.registerTreeDataProvider('testView', treeDataProvider);
    });

    const dbViewProvider = new MyWebviewViewProvider();
    vscode.window.registerWebviewViewProvider('dbView', dbViewProvider);
}

function registerCommands() {
    vscode.commands.registerCommand('wedata-test.showCommandDialog', async () => {
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
        // Define the snippets to be inserted
        const tooltip = node.tooltip;
        const snippet = tooltip instanceof vscode.MarkdownString ? tooltip.value : tooltip;
  
        if (snippet) {
            vscode.window.showInformationMessage('wedata-test.showHello');
            console.log(snippet);
        }
        // Insert the snippets into the active editor

        vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString('wedata-test.showHello'));
        
    
    });
    vscode.commands.registerCommand('wedata-test.refresh', () => {
        console.log('Show Tree View command executed');
        vscode.commands.executeCommand('setContext', 'showTreeView', true);

    });

    vscode.commands.registerCommand('wedata-test.hideTreeView', () => {
        console.log('Hide Tree View command executed');
        vscode.commands.executeCommand('setContext', 'hideTreeView', false);
    });

    vscode.commands.registerCommand('wedata-test.openDBView', () => {
        console.log('Open DB View command executed');
        vscode.commands.executeCommand('vscode.open', vscode.Uri.parse('wedata-db://dbView'));
    });
}
class SnippetNode extends vscode.TreeItem {
    
    constructor(label: string, code: string) {
        super(label);
        this.tooltip = code;
    }
}

// 创建树视图提供者类
class SnippetsTreeDataProvider implements vscode.TreeDataProvider<SnippetNode> {
    constructor(private snippets: { [key: string]: string }) {}

    getTreeItem(element: SnippetNode): vscode.TreeItem {
        return element;
    }

    getChildren(element?: SnippetNode): vscode.ProviderResult<SnippetNode[]> {
        if (!element) {
            // 根节点，返回所有代码片段
            return Object.keys(this.snippets).map(label => new SnippetNode(label, this.snippets[label]));
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
        <vscode-button>Hello World!</vscode-button>
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