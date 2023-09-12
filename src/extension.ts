import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';


export function activate(context: vscode.ExtensionContext) {

	const provider = new testViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(testViewProvider.viewType, provider));

	context.subscriptions.push(
		vscode.commands.registerCommand('wedatatest.addTest', () => {
			provider.addTest();
		}));

	let disposable = vscode.commands.registerCommand('extension.runCode', () => {
		// 在这里执行你想要运行的代码
		// 例如，你可以调用一个脚本或者执行一段特定的代码
	});

	context.subscriptions.push(disposable);

	vscode.commands.registerCommand('wedatatest.addTestFile', () => {
		// Specify the base file name and extension
		const baseFileName = 'Untitled';
		const fileExtension = '.test.sql';

		// Get the current workspace folder
		const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;

		// Specify the subdirectory name
		const subdirectory = 'test';

		// Create the subdirectory if it doesn't exist
		const subdirectoryPath = path.join(workspaceFolder, subdirectory);
		if (!fs.existsSync(subdirectoryPath)) {
			fs.mkdirSync(subdirectoryPath);
		}

		// Find the next available file name
		let fileIndex = 1;
		let fileName = `${baseFileName}-${fileIndex}${fileExtension}`;
		let filePath = path.join(subdirectoryPath, fileName);

		while (fs.existsSync(filePath)) {
			fileIndex++;
			fileName = `${baseFileName}-${fileIndex}${fileExtension}`;
			filePath = path.join(subdirectoryPath, fileName);
		}

		// Specify the file content
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
	END;
		`;

		// Create the file
		fs.writeFileSync(filePath, fileContent);

		// Open the newly created file
		vscode.workspace.openTextDocument(filePath).then((document) => {
			vscode.window.showTextDocument(document);
		});
	});
	context.subscriptions.push(
		vscode.commands.registerCommand('wedatatest.cleartest', () => {
			provider.cleartest();
		}));
}

class testViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'wedatatest.testView';

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case 'testelected':
					{
						vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(`#${data.value}`));
						break;
					}
			}
		});
	}

	public addTest() {
		if (this._view) {
			this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
			this._view.webview.postMessage({ type: 'addTest' });
		}
	}

	public cleartest() {
		if (this._view) {
			this._view.webview.postMessage({ type: 'cleartest' });
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js'));

		// Do the same for the stylesheet.
		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'reset.css'));
		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'vscode.css'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'main.css'));

		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading styles from our extension directory,
					and only allow scripts that have a specific nonce.
					(See the 'webview-sample' extension sample for img-src content security policy examples)
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet">
				<link href="${styleVSCodeUri}" rel="stylesheet">
				<link href="${styleMainUri}" rel="stylesheet">

				<title>Cat test</title>
			</head>
			<body>
				<ul class="color-list">
				</ul>

				<button class="add-color">add test item</button>

				<script nonce="${nonce}" src="${scriptUri}">
				</script>
			</body>
			</html>`;
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
