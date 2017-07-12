/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const vscode_1 = require("vscode");
const vscode_languageclient_1 = require("vscode-languageclient");
var Is;
(function (Is) {
    const toString = Object.prototype.toString;
    function boolean(value) {
        return value === true || value === false;
    }
    Is.boolean = boolean;
    function string(value) {
        return toString.call(value) === '[object String]';
    }
    Is.string = string;
})(Is || (Is = {}));
var ValidateItem;
(function (ValidateItem) {
    function is(item) {
        let candidate = item;
        return candidate && Is.string(candidate.language) && (Is.boolean(candidate.autoFix) || candidate.autoFix === void 0);
    }
    ValidateItem.is = is;
})(ValidateItem || (ValidateItem = {}));
var Status;
(function (Status) {
    Status[Status["ok"] = 1] = "ok";
    Status[Status["warn"] = 2] = "warn";
    Status[Status["error"] = 3] = "error";
})(Status || (Status = {}));
var StatusNotification;
(function (StatusNotification) {
    StatusNotification.type = new vscode_languageclient_1.NotificationType('standard/status');
})(StatusNotification || (StatusNotification = {}));
var NoStandardLibraryRequest;
(function (NoStandardLibraryRequest) {
    NoStandardLibraryRequest.type = new vscode_languageclient_1.RequestType('standard/noLibrary');
})(NoStandardLibraryRequest || (NoStandardLibraryRequest = {}));
const exitCalled = new vscode_languageclient_1.NotificationType('standard/exitCalled');
function enable() {
    if (!vscode_1.workspace.rootPath) {
        vscode_1.window.showErrorMessage('JavaScript Standard Style can only be enabled if VS Code is opened on a workspace folder.');
        return;
    }
    vscode_1.workspace.getConfiguration('standard').update('enable', true, false);
}
function disable() {
    if (!vscode_1.workspace.rootPath) {
        vscode_1.window.showErrorMessage('JavaScript Standard Style can only be disabled if VS Code is opened on a workspace folder.');
        return;
    }
    vscode_1.workspace.getConfiguration('standard').update('enable', false, false);
}
let dummyCommands;
function activate(context) {
    let supportedLanguages;
    function configurationChanged() {
        supportedLanguages = new Set();
        let settings = vscode_1.workspace.getConfiguration('standard');
        if (settings) {
            let toValidate = settings.get('validate', undefined);
            if (toValidate && Array.isArray(toValidate)) {
                toValidate.forEach(item => {
                    if (Is.string(item)) {
                        supportedLanguages.add(item);
                    }
                    else if (ValidateItem.is(item)) {
                        supportedLanguages.add(item.language);
                    }
                });
            }
        }
    }
    configurationChanged();
    const configurationListener = vscode_1.workspace.onDidChangeConfiguration(configurationChanged);
    let activated;
    let notValidating = () => vscode_1.window.showInformationMessage('JavaScript Standard Style is not validating any files yet.');
    dummyCommands = [
        vscode_1.commands.registerCommand('standard.executeAutofix', notValidating),
        vscode_1.commands.registerCommand('standard.showOutputChannel', notValidating)
    ];
    function didOpenTextDocument(textDocument) {
        if (supportedLanguages.has(textDocument.languageId)) {
            configurationListener.dispose();
            openListener.dispose();
            activated = true;
            realActivate(context);
        }
    }
    ;
    const openListener = vscode_1.workspace.onDidOpenTextDocument(didOpenTextDocument);
    for (let textDocument of vscode_1.workspace.textDocuments) {
        if (activated) {
            break;
        }
        didOpenTextDocument(textDocument);
    }
    context.subscriptions.push(vscode_1.commands.registerCommand('standard.enable', enable), vscode_1.commands.registerCommand('standard.disable', disable));
}
exports.activate = activate;
function realActivate(context) {
    let statusBarItem = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Right, 0);
    let standardStatus = Status.ok;
    let serverRunning = false;
    statusBarItem.text = 'JavaScript Standard Style';
    statusBarItem.command = 'standard.showOutputChannel';
    function showStatusBarItem(show) {
        if (show) {
            statusBarItem.show();
        }
        else {
            statusBarItem.hide();
        }
    }
    function updateStatus(status) {
        switch (status) {
            case Status.ok:
                statusBarItem.color = undefined;
                break;
            case Status.warn:
                statusBarItem.color = 'yellow';
                break;
            case Status.error:
                statusBarItem.color = '#aaa';
                break;
        }
        standardStatus = status;
        udpateStatusBarVisibility(vscode_1.window.activeTextEditor);
    }
    function udpateStatusBarVisibility(editor) {
        statusBarItem.text = standardStatus === Status.ok ? 'JavaScript Standard Style' : 'JavaScript Standard Style!';
        showStatusBarItem(serverRunning &&
            (standardStatus !== Status.ok ||
                (editor && (editor.document.languageId === 'javascript' || editor.document.languageId === 'javascriptreact'))));
    }
    vscode_1.window.onDidChangeActiveTextEditor(udpateStatusBarVisibility);
    udpateStatusBarVisibility(vscode_1.window.activeTextEditor);
    // We need to go one level up since an extension compile the js code into
    // the output folder.
    // serverModule
    let serverModule = path.join(__dirname, '..', 'server', 'server.js');
    let debugOptions = { execArgv: ["--nolazy", "--debug=6010"] };
    let serverOptions = {
        run: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc },
        debug: { module: serverModule, transport: vscode_languageclient_1.TransportKind.ipc, options: debugOptions }
    };
    let defaultErrorHandler;
    let serverCalledProcessExit = false;
    let staticDocuments = [{ scheme: 'file', pattern: '**/package.json' }];
    let languages = ['javascript', 'javascriptreact'];
    let clientOptions = {
        documentSelector: staticDocuments,
        diagnosticCollectionName: 'standard',
        revealOutputChannelOn: vscode_languageclient_1.RevealOutputChannelOn.Never,
        synchronize: {
            configurationSection: 'standard',
            fileEvents: [
                vscode_1.workspace.createFileSystemWatcher('**/package.json')
            ]
        },
        initializationOptions: () => {
            let configuration = vscode_1.workspace.getConfiguration('standard');
            return {
                legacyModuleResolve: configuration ? configuration.get('_legacyModuleResolve', false) : false,
                nodePath: configuration ? configuration.get('nodePath', undefined) : undefined,
                languageIds: configuration ? configuration.get('validate', languages) : languages
            };
        },
        initializationFailedHandler: (error) => {
            client.error('Server initialization failed.', error);
            client.outputChannel.show(true);
            return false;
        },
        errorHandler: {
            error: (error, message, count) => {
                return defaultErrorHandler.error(error, message, count);
            },
            closed: () => {
                if (serverCalledProcessExit) {
                    return vscode_languageclient_1.CloseAction.DoNotRestart;
                }
                return defaultErrorHandler.closed();
            }
        }
    };
    let client = new vscode_languageclient_1.LanguageClient('standard', serverOptions, clientOptions);
    defaultErrorHandler = client.createDefaultErrorHandler();
    const running = 'JavaScript Standard Style server is running.';
    const stopped = 'JavaScript Standard Style server stopped.';
    client.onDidChangeState((event) => {
        if (event.newState === vscode_languageclient_1.State.Running) {
            client.info(running);
            statusBarItem.tooltip = running;
            serverRunning = true;
        }
        else {
            client.info(stopped);
            statusBarItem.tooltip = stopped;
            serverRunning = false;
        }
        udpateStatusBarVisibility(vscode_1.window.activeTextEditor);
    });
    client.onReady().then(() => {
        client.onNotification(StatusNotification.type, (params) => {
            updateStatus(params.state);
        });
        client.onNotification(StatusNotification.type, (params) => {
            updateStatus(params.state);
        });
        defaultErrorHandler = client.createDefaultErrorHandler();
        client.onNotification(exitCalled, (params) => {
            serverCalledProcessExit = true;
            client.error(`Server process exited with code ${params[0]}. This usually indicates a misconfigured JavaScript Standard Style setup.`, params[1]);
            vscode_1.window.showErrorMessage(`JavaScript Standard Style server shut down itself. See 'JavaScript Standard Style' output channel for details.`);
        });
        // when server reports that no `standard` library installed neither locally or globally
        client.onRequest(NoStandardLibraryRequest.type, (params) => {
            const key = 'noStandardMessageShown';
            let state = context.globalState.get(key, {});
            let uri = vscode_1.Uri.parse(params.source.uri);
            if (vscode_1.workspace.rootPath) {
                client.info([
                    '',
                    `Failed to load the JavaScript Standard Style library for the document '${uri.fsPath}'.`,
                    '',
                    'To use JavaScript Standard Style in this workspace please install standard using \'npm install standard\' or globally using \'npm install -g standard\'.',
                    'You need to reopen the workspace after installing standard.',
                    '',
                    `Alternatively you can disable JavaScript Standard Style for this workspace by executing the 'Disable JavaScript Standard Style for this workspace' command.`
                ].join('\n'));
                if (!state.workspaces) {
                    state.workspaces = Object.create(null);
                }
                if (!state.workspaces[vscode_1.workspace.rootPath]) {
                    state.workspaces[vscode_1.workspace.rootPath] = true;
                    client.outputChannel.show(true);
                    context.globalState.update(key, state);
                }
            }
            else {
                const style = vscode_1.workspace.getConfiguration('standard').semistandard ? 'semistandard' : 'standard';
                client.info([
                    `Failed to load the JavaScript Standard Style library for the document '${uri.fsPath}'.`,
                    `To use JavaScript ${style.charAt(0).toUpperCase().concat(style.substr(1))} Style for single JavaScript file install ${style} globally using 'npm install -g ${style}'.`,
                    'You need to reopen VS Code after installing standard.',
                ].join('\n'));
                if (!state.global) {
                    state.global = true;
                    client.outputChannel.show(true);
                    context.globalState.update(key, state);
                }
            }
            // update status bar
            updateStatus(3);
            return {};
        });
    });
    if (dummyCommands) {
        dummyCommands.forEach(command => command.dispose());
        dummyCommands = undefined;
    }
    context.subscriptions.push(new vscode_languageclient_1.SettingMonitor(client, 'standard.enable').start(), vscode_1.commands.registerCommand('standard.executeAutofix', () => {
        let textEditor = vscode_1.window.activeTextEditor;
        if (!textEditor) {
            return;
        }
        let textDocument = {
            uri: textEditor.document.uri.toString(),
            version: textEditor.document.version
        };
        let params = {
            command: 'standard.applyAutoFix',
            arguments: [textDocument]
        };
        client.sendRequest(vscode_languageclient_1.ExecuteCommandRequest.type, params).then(undefined, () => {
            vscode_1.window.showErrorMessage('Failed to apply JavaScript Standard Style fixes to the document. Please consider opening an issue with steps to reproduce.');
        });
    }), vscode_1.commands.registerCommand('standard.showOutputChannel', () => { client.outputChannel.show(); }), statusBarItem);
}
exports.realActivate = realActivate;
function deactivate() {
    if (dummyCommands) {
        dummyCommands.forEach(command => command.dispose());
    }
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map