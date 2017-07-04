"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const he_1 = require("he");
function generateErrorView(error) {
    return `
        <div class="error-box">
            <h1 class="error-title">Error</h1>
            <div class="error-details">${error}</div>
        </div>
    `;
}
exports.generateErrorView = generateErrorView;
function generateHistoryHtmlView(entries) {
    const entriesHtml = entries.map((entry, entryIndex) => {
        return `
            <div class="ag-search-entry">
                <div class="media right">
                    <div class="media-content">
                        <a class="search-subject-link" href="#">${he_1.encode(entry)}</a>
                        <div class="search-subject" data-entry-index="${entryIndex}">${he_1.encode(entry)}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    return `
        <a id="showDetail" href="#" style="display:none"><span>showDetail</span></a>
        <a id="hideDetail" href="#" style="display:none"><span>hideDetail</span></a>
        <div id="ag-search-view" class="list-group">
            <div id="search-history">
                ${entriesHtml}
            </div>
        </div>
        `;
}
exports.generateHistoryHtmlView = generateHistoryHtmlView;
//# sourceMappingURL=htmlGenerator.js.map