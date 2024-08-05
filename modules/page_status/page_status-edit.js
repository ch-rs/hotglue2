$(document).ready(function () {
    var elem = $('<img src="' + $.glue.base_url + 'modules/page_status/page_status-icon-draft.png" width="32" height="32">');
    $(elem).attr('title', 'change page status');

    var currentMode
    var modes = ['live', 'draft'];

    $.glue.backend({ method: 'glue.load_object', name: $.glue.page + '.page' }, function (data) {
        if (!data['page-status']) {
            currentMode = 1
        }
        else {
            currentMode = modes.indexOf(data['page-status']);
        }

        $(elem).attr('src', $.glue.base_url + 'modules/page_status/page_status-icon-' + modes[currentMode] + '.png');
    });

    $(elem).bind('mousedown', function (e) {
        var that = this;
        var nextMode = (currentMode + 1) % modes.length;

        alert('Page is now: ' + modes[nextMode]);
        $(elem).attr('src', $.glue.base_url + 'modules/page_status/page_status-icon-' + modes[nextMode] + '.png');

        $.glue.backend({ method: 'glue.update_object', name: $.glue.page + '.page', 'page-status': modes[nextMode] });
        currentMode = nextMode;

        $(that).attr('title', 'change page status (currently ' + modes[nextMode] + ')');
        $.glue.menu.hide();
    });

    $.glue.menu.register('page', elem, 0);
});