"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = void 0;
const vscode = require("vscode");
const fs = require("fs");
function activate(context) {
    const provider = new testViewProvider(context.extensionUri);
    context.subscriptions.push(vscode.window.registerWebviewViewProvider(testViewProvider.viewType, provider));
    context.subscriptions.push(vscode.commands.registerCommand('wedatatest.addTest', () => {
        provider.addTest();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('wedatatest.addTestFile', () => {
        // Specify the file name and extension
        const fileName = 'testFile.test.sql';
        // Specify the file content
        const fileContent = '-- This is a test SQL file';
        // Get the current workspace folder
        const workspaceFolder = vscode.workspace.workspaceFolders[0].uri.fsPath;
        // Create the full file path
        const filePath = `${workspaceFolder}/${fileName}`;
        // Check if the file already exists
        if (fs.existsSync(filePath)) {
            vscode.window.showErrorMessage(`File ${fileName} already exists.`);
            return;
        }
        // Create the file
        fs.writeFileSync(filePath, fileContent);
        // Open the newly created file
        vscode.workspace.openTextDocument(filePath).then((document) => {
            vscode.window.showTextDocument(document);
        });
    }));
    context.subscriptions.push(vscode.commands.registerCommand('wedatatest.cleartest', () => {
        provider.cleartest();
    }));
}
exports.activate = activate;
class testViewProvider {
    constructor(_extensionUri) {
        this._extensionUri = _extensionUri;
    }
    resolveWebviewView(webviewView, context, _token) {
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
    addTest() {
        if (this._view) {
            this._view.show?.(true); // `show` is not implemented in 1.49 but is for 1.50 insiders
            this._view.webview.postMessage({ type: 'addTest' });
        }
    }
    cleartest() {
        if (this._view) {
            this._view.webview.postMessage({ type: 'cleartest' });
        }
    }
    _getHtmlForWebview(webview) {
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
testViewProvider.viewType = 'wedatatest.testView';
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
//# sourceMappingURL=extension.js.map