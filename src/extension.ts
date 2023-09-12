import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  const provider = new TestViewProvider(context.extensionUri);
  context.subscriptions.push(vscode.window.registerWebviewViewProvider(TestViewProvider.viewType, provider));
  context.subscriptions.push(vscode.commands.registerCommand('wedatatest.addTest', () => provider.addTest()));
  context.subscriptions.push(vscode.commands.registerCommand('extension.runCode', () => { /* 在这里执行你想要运行的代码 */ }));
  context.subscriptions.push(vscode.commands.registerCommand('wedatatest.addTestFile', () => addTestFile()));
  context.subscriptions.push(vscode.commands.registerCommand('wedatatest.clearTest', () => provider.clearTest()));
}

class TestViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'wedatatest.testView';
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) { }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(data => {
      if (data.type === 'testSelected') {
        vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(`#${data.value}`));
      }
    });
  }

  public addTest() {
    if (this._view) {
      this._view.show?.(true);
      this._view.webview.postMessage({ type: 'addTest' });
    }
  }

  public clearTest() {
    if (this._view) {
      this._view.webview.postMessage({ type: 'clearTest' });
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));
    const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
    const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
    const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));
    const nonce = getNonce();

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleResetUri}" rel="stylesheet">
        <link href="${styleVSCodeUri}" rel="stylesheet">
        <link href="${styleMainUri}" rel="stylesheet">
        <title>Cat test</title>
      </head>
      <body>
        <ul class="color-list"></ul>
        <button class="add-color">add test item</button>
		<button class="add-color1">export pdf report</button>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }
}

function addTestFile() {
  const baseFileName = 'Untitled';
  const fileExtension = '.test.sql';
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  if (workspaceFolder) {
    const subdirectory = 'test';
    const subdirectoryPath = path.join(workspaceFolder, subdirectory);
    fs.mkdirSync(subdirectoryPath, { recursive: true });

    let fileIndex = 1;
    let fileName = `${baseFileName}-${fileIndex}${fileExtension}`;
    let filePath = path.join(subdirectoryPath, fileName);

    while (fs.existsSync(filePath)) {
      fileIndex++;
      fileName = `${baseFileName}-${fileIndex}${fileExtension}`;
      filePath = path.join(subdirectoryPath, fileName);
    }

    const fileContent = `
      /*
      测试id：check_null_field
      描述：检查字段是否为 NULL 值
      参数：
        - p_table_name: 要检查的表
        - p_column_name: 要检查的字段
      返回：
        - r_result: 字段包含 NULL 值
    */
    BEGIN

	-- 获取字段值
	SELECT count(1) INTO p_column_value FROM r_result WHERE p_column_name is null; -- 添加适当的 WHERE 子句来选择记录
	  -- 检查字段是否为 NULL
	  IF r_result IS NOT NULL THEN
		RAISE_APPLICATION_ERROR(-20001, 'The field contains NULL value.');
	  END IF;

    END;`;

    fs.writeFileSync(filePath, fileContent);

    vscode.workspace.openTextDocument(filePath).then(doc => {
      vscode.window.showTextDocument(doc);
    });
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
}

export function deactivate() { }
