"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const taskQueue_1 = require("./taskQueue");
const cp = require("child_process");
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");
function isFileUri(uri) {
    return uri.scheme === 'file';
}
class Rubocop {
    constructor(diagnostics, additionalArguments = [], platform = process.platform) {
        this.taskQueue = new taskQueue_1.TaskQueue();
        this.diag = diagnostics;
        this.command = (platform === 'win32') ? 'rubocop.bat' : 'rubocop';
        this.additionalArguments = additionalArguments;
        this.resetConfig();
    }
    execute(document, onComplete) {
        if (document.languageId !== 'ruby' || document.isUntitled || !isFileUri(document.uri)) {
            // git diff has ruby-mode. but it is Untitled file.
            return;
        }
        this.resetConfig();
        if (!this.path || 0 === this.path.length) {
            vscode.window.showWarningMessage('execute path is empty! please check ruby.rubocop.executePath config');
            return;
        }
        const fileName = document.fileName;
        const uri = document.uri;
        let currentPath = vscode.workspace.rootPath;
        if (!currentPath) {
            currentPath = path.dirname(fileName);
        }
        let onDidExec = (error, stdout, stderr) => {
            if (this.hasError(error, stderr)) {
                return;
            }
            this.diag.delete(uri);
            let rubocop = this.parse(stdout);
            if (rubocop === undefined || rubocop === null) {
                return;
            }
            let entries = [];
            rubocop.files.forEach((file) => {
                let diagnostics = [];
                file.offenses.forEach((offence) => {
                    const loc = offence.location;
                    const range = new vscode.Range(loc.line - 1, loc.column - 1, loc.line - 1, loc.length + loc.column - 1);
                    const sev = this.severity(offence.severity);
                    const message = `${offence.message} (${offence.severity}:${offence.cop_name})`;
                    const diagnostic = new vscode.Diagnostic(range, message, sev);
                    diagnostics.push(diagnostic);
                });
                entries.push([uri, diagnostics]);
            });
            this.diag.set(entries);
        };
        const executeFile = this.path + this.command;
        let args = this.commandArguments(fileName);
        let task = new taskQueue_1.Task(uri, token => {
            let process = cp.execFile(executeFile, args, { cwd: currentPath }, (error, stdout, stderr) => {
                if (token.isCanceled) {
                    return;
                }
                onDidExec(error, stdout, stderr);
                token.finished();
                if (onComplete) {
                    onComplete();
                }
            });
            return () => process.kill();
        });
        this.taskQueue.enqueue(task);
    }
    get isOnSave() {
        return this.onSave;
    }
    clear(document) {
        let uri = document.uri;
        if (isFileUri(uri)) {
            this.taskQueue.cancel(uri);
            this.diag.delete(uri);
        }
    }
    // extract argument to an array
    commandArguments(fileName) {
        let commandArguments = [fileName, '--format', 'json', '--force-exclusion'];
        if (this.configPath !== '') {
            if (fs.existsSync(this.configPath)) {
                const config = ['--config', this.configPath];
                commandArguments = commandArguments.concat(config);
            }
            else {
                vscode.window.showWarningMessage(`${this.configPath} file does not exist. Ignoring...`);
            }
        }
        return commandArguments.concat(this.additionalArguments);
    }
    // parse rubocop(JSON) output
    parse(output) {
        let rubocop;
        if (output.length < 1) {
            let message = `command ${this.path}${this.command} returns empty output! please check configuration.`;
            vscode.window.showWarningMessage(message);
            return null;
        }
        try {
            rubocop = JSON.parse(output);
        }
        catch (e) {
            if (e instanceof SyntaxError) {
                let regex = /[\r\n \t]/g;
                let message = output.replace(regex, ' ');
                let errorMessage = `Error on parsing output (It might non-JSON output) : "${message}"`;
                vscode.window.showWarningMessage(errorMessage);
                return null;
            }
        }
        return rubocop;
    }
    // checking rubocop output has error
    hasError(error, stderr) {
        let errorOutput = stderr.toString();
        if (error && error.code === 'ENOENT') {
            vscode.window.showWarningMessage(`${this.path} + ${this.command} is not executable`);
            return true;
        }
        else if (error && error.code === 127) {
            vscode.window.showWarningMessage(stderr);
            console.log(error.message);
            return true;
        }
        else if (errorOutput.length > 0) {
            vscode.window.showErrorMessage(stderr);
            console.log(this.path + this.command);
            console.log(errorOutput);
            return true;
        }
        return false;
    }
    /**
     * Read the workspace configuration for 'ruby.rubocop' and set the
     * `path`, `configPath`, and `onSave` properties.
     *
     * @todo Refactor Rubocop to use vscode.workspace.onDidChangeConfiguration
     *   rather than running Rubocop.resetConfig every time the Rubocop binary is executed
     */
    resetConfig() {
        const conf = vscode.workspace.getConfiguration('ruby.rubocop');
        this.path = conf.get('executePath', '');
        // try to autodetect the path (if it's not specified explicitly)
        if (!this.path || 0 === this.path.length) {
            this.path = this.autodetectExecutePath();
        }
        this.configPath = conf.get('configFilePath', '');
        this.onSave = conf.get('onSave', true);
    }
    severity(sev) {
        switch (sev) {
            case 'refactor': return vscode.DiagnosticSeverity.Hint;
            case 'convention': return vscode.DiagnosticSeverity.Information;
            case 'warning': return vscode.DiagnosticSeverity.Warning;
            case 'error': return vscode.DiagnosticSeverity.Error;
            case 'fatal': return vscode.DiagnosticSeverity.Error;
            default: return vscode.DiagnosticSeverity.Error;
        }
    }
    autodetectExecutePath() {
        const key = 'PATH';
        let paths = process.env[key];
        if (!paths) {
            return '';
        }
        let pathparts = paths.split(path.delimiter);
        for (let i = 0; i < pathparts.length; i++) {
            let binpath = path.join(pathparts[i], this.command);
            if (fs.existsSync(binpath)) {
                return pathparts[i] + path.sep;
            }
        }
        return '';
    }
}
exports.default = Rubocop;
//# sourceMappingURL=rubocop.js.map