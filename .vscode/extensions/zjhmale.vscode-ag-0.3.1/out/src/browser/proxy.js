(function () {
    window.GITHISTORY = {};
    $(document).ready(() => {
        let searchValue = $('#ag-filter').val();
        $('#ag-filter').val('');
        $('#ag-filter').val(searchValue);
        $('#ag-filter').focus();
        window.GITHISTORY.initializeDetailsView();
    });
})();
//# sourceMappingURL=proxy.js.map