"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const rubocop_1 = require("./rubocop");
// entry point of extension
function activate(context) {
    'use strict';
    const diag = vscode.languages.createDiagnosticCollection('ruby');
    const rubocopAutocorrect = new rubocop_1.default(diag, ['--auto-correct']);
    vscode.commands.registerCommand('ruby.rubocopAutocorrect', () => {
        const document = vscode.window.activeTextEditor.document;
        if (document.languageId !== 'ruby') {
            return;
        }
        document.save().then(() => {
            rubocopAutocorrect.execute(document, () => rubocop.execute(document));
        });
    });
    context.subscriptions.push(diag);
    const rubocop = new rubocop_1.default(diag);
    const disposable = vscode.commands.registerCommand('ruby.rubocop', () => {
        const document = vscode.window.activeTextEditor.document;
        rubocop.execute(document);
    });
    context.subscriptions.push(disposable);
    const ws = vscode.workspace;
    ws.textDocuments.forEach((e) => {
        rubocop.execute(e);
    });
    ws.onDidOpenTextDocument((e) => {
        rubocop.execute(e);
    });
    ws.onDidSaveTextDocument((e) => {
        if (rubocop.isOnSave) {
            rubocop.execute(e);
        }
    });
    ws.onDidCloseTextDocument((e) => {
        rubocop.clear(e);
    });
}
exports.activate = activate;
//# sourceMappingURL=extension.js.map