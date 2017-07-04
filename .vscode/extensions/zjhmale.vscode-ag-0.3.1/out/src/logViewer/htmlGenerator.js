"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const he_1 = require("he");
function generateErrorView(error) {
    return `
        <div class="error-box animated pulse">
            <div class="error-icon"><i class="octicon octicon-stop" aria-hidden="true"></i></div>
            <h1 class="error-title">Error</h1>
            <div class="error-details">${error}</div>
        </div>
    `;
}
exports.generateErrorView = generateErrorView;
function generateHistoryListContainer(entries, entriesHtml, searchValue) {
    return `
        <a id="showDetail" href="#" style="display:none"><span>showDetail</span></a>
        <a id="hideDetail" href="#" style="display:none"><span>hideDetail</span></a>
        <div id="log-view" class="list-group">
            <svg xmlns="http://www.w3.org/2000/svg"></svg>
            <div id="commit-history">
                ${entriesHtml}
            </div>
        </div>

        <div id="details-view" class="hidden">
        </div>
        `;
}
function generateHistoryHtmlView(entries, searchValue) {
    const entriesHtml = entries.map((entry, entryIndex) => {
        return `
            <div class="log-entry">
                <div class="media right">
                    <div class="media-content">
                        <a class="commit-subject-link" href="${encodeURI('command:ag.open?' + JSON.stringify([entry]))}">${he_1.encode(entry)}</a>
                        <div class="commit-subject" data-entry-index="${entryIndex}">${he_1.encode(entry)}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    return generateHistoryListContainer(entries, entriesHtml, searchValue);
}
exports.generateHistoryHtmlView = generateHistoryHtmlView;
//# sourceMappingURL=htmlGenerator.js.map