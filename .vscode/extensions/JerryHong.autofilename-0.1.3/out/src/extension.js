'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
var fs = require('fs');
var path = require('path');
function activate(context) {
    var completeProvider = new CompleteProvider();
    vscode.languages.getLanguages().then(function (data) { return console.log(data); });
    var disposable = vscode.languages.registerCompletionItemProvider('*', completeProvider, '"', '\'', '/');
    context.subscriptions.push(disposable);
}
exports.activate = activate;
/**
 *  CompleteProvider
 */
var CompleteProvider = (function () {
    function CompleteProvider() {
    }
    CompleteProvider.prototype.provideCompletionItems = function (document, position, token) {
        var currentPath = getCurrentPath(document.fileName);
        var lineText = document.getText(document.lineAt(position).range);
        var userKeyInStr = getUserKeyIn(lineText, position.character);
        var finalPath = path.resolve(currentPath, userKeyInStr);
        return new Promise(function (resolve, reject) {
            fs.access(finalPath, fs.F_OK, function (err) {
                var realPath = err ? getCurrentPath(finalPath) : finalPath;
                fs.readdir(realPath, function (err, data) {
                    if (err) {
                        reject();
                    }
                    else {
                        data.unshift(''); // hack .ts file, first one is empty string and it will be correct when user typing dot 
                        resolve(data
                            .filter(function (item) { return item[0] !== '.'; })
                            .map(function (item) { return new vscode.CompletionItem(item, vscode.CompletionItemKind.File); }));
                    }
                });
            });
        });
    };
    return CompleteProvider;
}());
function getUserKeyIn(lineText, toCharacter) {
    var tempArr = lineText.lastIndexOf('\'') > lineText.lastIndexOf('"') ?
        lineText.substr(0, toCharacter).split('\'') :
        lineText.substr(0, toCharacter).split('"');
    return tempArr[tempArr.length - 1];
}
var getCurrentPath = function (fileName) { return fileName.substring(0, fileName.lastIndexOf(path.sep)); };
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map