$(document).ready(function () {
    var elem = $('<img src="' + $.glue.base_url + 'modules/page_status/page_status-icon-draft.png" width="32" height="32">');
    $(elem).attr('title', 'change page status');

    var currentMode
    var modes = ['live', 'draft', 'protected'];

    function showHidePasswordIcon() {
        if (passwordElem) {
            if (currentMode == 2) {
                passwordElem.show();
            }
            else {
                passwordElem.hide();
            }
        }
    }

    $.glue.backend({ method: 'glue.load_object', name: $.glue.page + '.page' }, function (data) {
        if (!data['#data'] && !data['#data']['page-status']) {
            currentMode = 1
        }
        else {
            currentMode = modes.indexOf(data['#data']['page-status']);
        }

        showHidePasswordIcon();

        $(elem).attr('src', $.glue.base_url + 'modules/page_status/page_status-icon-' + modes[currentMode] + '.png');
    }, false);

    $(elem).bind('mousedown', function (e) {
        var that = this;
        var nextMode = (currentMode + 1) % modes.length;

        alert('Page is now: ' + modes[nextMode]);
        $(elem).attr('src', $.glue.base_url + 'modules/page_status/page_status-icon-' + modes[nextMode] + '.png');

        $.glue.backend({ method: 'glue.update_object', name: $.glue.page + '.page', 'page-status': modes[nextMode] });
        currentMode = nextMode;

        showHidePasswordIcon();

        $(that).attr('title', 'change page status (currently ' + modes[nextMode] + ')');
        $.glue.menu.hide();
    });

    $.glue.menu.register('page', elem, 0);

    var passwordElem = $('<img src="' + $.glue.base_url + 'modules/page_status/page_status-icon-set-password.png" class="password-icon" width="32" height="32">');
    $(passwordElem).attr('title', 'set page password');
    $(passwordElem).bind('mousedown', function (e) {
        // Prompt for new password
        var password = prompt('Enter new password for this page');
        if (password) {
            $.glue.backend({ method: 'glue.update_object', name: $.glue.page + '.page', 'page-password': password });
            alert('New password has been set for this page.');
        }
    });

    $.glue.menu.register('page', passwordElem, 1);
});