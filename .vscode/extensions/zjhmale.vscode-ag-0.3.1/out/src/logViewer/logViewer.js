"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const htmlGenerator = require("./htmlGenerator");
const path = require("path");
const cp = require("child_process");
const os = require("os");
const _ = require("lodash");
const gitHistorySchema = 'git-history-viewer';
let previewUri = vscode.Uri.parse(gitHistorySchema + '://authority/git-history');
let matchRecords = [];
let searchText = "";
let alreadyOpened = false;
let outputChannel = vscode.window.createOutputChannel('AG Detail');
class TextDocumentContentProvider {
    constructor() {
        this._onDidChange = new vscode.EventEmitter();
    }
    provideTextDocumentContent(uri, token) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.entries = matchRecords.concat(_.times(8, _.constant("")));
                let html = this.generateHistoryView();
                return html;
            }
            catch (error) {
                return this.generateErrorView(error);
            }
        });
    }
    get onDidChange() {
        return this._onDidChange.event;
    }
    update(uri) {
        this._onDidChange.fire(uri);
    }
    getStyleSheetPath(resourceName) {
        return vscode.Uri.file(path.join(__dirname, '..', '..', '..', 'resources', resourceName)).toString();
    }
    getScriptFilePath(resourceName) {
        return vscode.Uri.file(path.join(__dirname, '..', '..', 'src', 'browser', resourceName)).toString();
    }
    getNodeModulesPath(resourceName) {
        return vscode.Uri.file(path.join(__dirname, '..', '..', '..', 'node_modules', resourceName)).toString();
    }
    generateErrorView(error) {
        return `
            <head>
                <link rel="stylesheet" href="${this.getNodeModulesPath(path.join('normalize.css', 'normalize.css'))}" >
                <link rel="stylesheet" href="${this.getStyleSheetPath('main.css')}" >
            </head>
            <body>
                ${htmlGenerator.generateErrorView(error)}
            </body>
        `;
    }
    generateHistoryView() {
        const innerHtml = htmlGenerator.generateHistoryHtmlView(this.entries, searchText);
        return `
            <head>
                <link rel="stylesheet" href="${this.getNodeModulesPath(path.join('normalize.css', 'normalize.css'))}" >
                <link rel="stylesheet" href="${this.getStyleSheetPath('main.css')}" >
                <script src="${this.getNodeModulesPath(path.join('jquery', 'dist', 'jquery.min.js'))}"></script>
                <script src="${this.getScriptFilePath('detailsView.js')}"></script>
            </head>

            <body>
                ${innerHtml}
            </body>
        `;
    }
}
function activate(context) {
    let provider = new TextDocumentContentProvider();
    let registration = vscode.workspace.registerTextDocumentContentProvider(gitHistorySchema, provider);
    let disposable = vscode.commands.registerCommand('ag.search', () => {
        vscode.window.showInputBox({ prompt: 'Search something here' }).then((value) => {
            let result = cp.spawnSync("ag", ["--nocolor", "--nogroup", "--column", value], { cwd: '/Users/capitalmatch/Documents/cm/capital-match' });
            if (value.length >= 3 && result.status == 0) {
                matchRecords = result.stdout.toString().split(os.EOL).filter((l) => { return !_.isEmpty(l); });
            }
            else {
                vscode.window.showErrorMessage(result.stderr.toString());
                matchRecords = [];
            }
            searchText = value;
            if (alreadyOpened) {
                provider.update(previewUri);
            }
            else {
                alreadyOpened = true;
                previewUri = vscode.Uri.parse(gitHistorySchema + '://authority/git-history?x=' + new Date().getTime().toString());
                vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.Two, 'Git History (git log)').then((success) => {
                }, (reason) => {
                    vscode.window.showErrorMessage(reason);
                });
            }
        });
    });
    context.subscriptions.push(disposable, registration);
    disposable = vscode.commands.registerCommand('ag.open', (value) => {
        let reg = new RegExp("(.*):(\\d+):(\\d+):(.*)", "g");
        let result = reg.exec(value);
        if (result) {
            let file = result[1];
            let line = parseInt(result[2]);
            let column = parseInt(result[3]);
            vscode.workspace.openTextDocument('/Users/capitalmatch/Documents/cm/capital-match' + '/' + file).then(document => {
                vscode.window.showTextDocument(document).then((editor) => {
                    editor.revealRange(new vscode.Range(line - 1, column - 1, line - 1, column - 1), vscode.TextEditorRevealType.InCenter);
                    editor.selection = new vscode.Selection(line - 1, column - 1, line - 1, column - 1);
                });
            });
        }
    });
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand('ag.showDetail', (value) => {
        outputChannel.append(value);
        outputChannel.show();
    });
    context.subscriptions.push(disposable);
    disposable = vscode.commands.registerCommand('ag.hideDetail', (value) => {
        outputChannel.clear();
        outputChannel.hide();
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
//# sourceMappingURL=logViewer.js.map