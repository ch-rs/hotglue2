/**
 *	editor/menu
 *	Functions for handling menus (non-context)
*/

let num_shown;

$(document).ready(function () {
    // trigger menus on click and doubleclick
    var menu_dblclick_timeout = false;
    $('html').bind('click', function (e) {
        // make sure no iframe has focus as this breaks keyboard shortcuts etc
        window.focus();
        // we use 'html' here to give the colorpicker et al a chance to stop the
        // propagation of the event in 'body'
        if (e.target == $('body').get(0)) {
            if (!$.glue.menu.is_shown()) {
                if (menu_dblclick_timeout) {
                    clearTimeout(menu_dblclick_timeout);
                    menu_dblclick_timeout = false;
                    // show page menu
                    $.glue.menu.show('page', e.clientX, e.clientY);
                    return false;
                }
                menu_dblclick_timeout = setTimeout(function () {
                    menu_dblclick_timeout = false;
                    // prevent the new menu from showing when the user wants to
                    // simply clear any open menu
                    if ($.glue.menu.prev_menu() == '') {
                        // show new menu
                        $.glue.menu.show('new', e.clientX, e.clientY);
                    }
                }, 300);
            }
        }
    });

    // menu shortcuts
    $('html').bind('keyup', function (e) {
        if (e.altKey && e.which == 79) {
            // alt+o: show new object menu
            $.glue.menu.show('new');
            return false;
        } else if (e.altKey && e.which == 80) {
            // alt+p: show page menu
            $.glue.menu.show('page');
            return false;
        } else if (e.ctrlKey && e.which == 90) {
            // ctrl+z: show revisions browser to suggest using revisions in place of undo
            if (confirm('Looking for an "undo" option?\nHOTGLUE keeps record of your recent edits - it\'s called "revisions".\nWould you like to browse through the revisions of this page?')) {
                window.location = $.glue.base_url + '?' + $.glue.page + '/revisions';
                return false;
            }
        }
    });

    // I really don't know why, but when we don't handle the mousedown event here
    // double-clicking the page does select some object (the first child of body
    // on Firefox and the nearest element on Chrome)
    $('html').bind('mousedown', function (e) {
        return false;
    });
});

$.glue.menu = function () {
    var default_prio = 10;
    var cur = false;
    var m = {};
    var prev_menu = '';
    var spawn_coords = false;

    var close_menu = function (e) {
        // close menu when clicking outside of an ui element
        if (!$(e.target).hasClass('glue-ui') && $(e.target).parents('.glue-ui').length == 0) {
            // this also unregisters the event
            // when we close a menu like this we want to keep the name of the
            // previous menu, hence false
            $.glue.menu.hide(false);
        }
    };

    $('.object').live('glue-select', function (e) {
        // hide any menu when an object gets selected
        if (cur) {
            $.glue.menu.hide();
        }
    });

    return {
        // hide any currently shown menus
        hide: function (reset_prev_menu) {
            // reset the previous menu, so we can launch the same menu immediately
            // for almost all callers (except close_menu above)
            if (reset_prev_menu === undefined || reset_prev_menu) {
                prev_menu = '';
            }
            if (cur) {
                for (var i = 0; i < cur.length; i++) {
                    $(cur[i].elem).trigger('glue-menu-deactivate');
                    $(cur[i].elem).detach();
                }
                cur = false;
            }
            $('body').unbind('click', close_menu);
        },
        // return whether or not a menu is shown
        // menu .. menu name (if undefined, any menu)
        is_shown: function (menu) {
            if (menu === undefined) {
                if (cur) {
                    return true;
                } else {
                    return false;
                }
            } else {
                if (m[menu] && m[menu] == cur) {
                    return true;
                } else {
                    return false;
                }
            }
        },
        prev_menu: function () {
            var ret = prev_menu;
            prev_menu = '';
            return ret;
        },
        // register a menu item
        // menu .. menu name
        // elem .. element to add
        // prio .. priority (ascending) - optional
        register: function (menu, elem, prio) {
            if (!m[menu]) {
                m[menu] = [];
            }
            if (prio === undefined) {
                prio = default_prio;
            }
            // add sorted by prio ascending
            var added = false;
            for (var i = 0; i < m[menu].length; i++) {
                if (prio < m[menu][i].prio) {
                    m[menu].splice(i, 0, { 'elem': elem, 'prio': prio });
                    added = true;
                    break;
                }
            }
            if (!added) {
                m[menu].push({ 'elem': elem, 'prio': prio });
            }
        },
        // show a menu
        // this also hides any currently shown menus
        // menu .. menu name
        // x, y .. window coordinates to launch the menu
        show: function (menu, x, y) {
            if (!m[menu]) {
                return false;
            }
            // hide any active menu
            if (cur) {
                $.glue.menu.hide();
            }
            // default x & y coordinates
            if (x === undefined) {
                x = $(window).width() / 2;
            }
            if (y === undefined) {
                y = $(window).height() / 2;
            }

            var max_w = 0;
            var max_h = 0;
            cur = m[menu];
            // add items to dom
            num_shown = 0;
            for (var i = 0; i < cur.length; i++) {
                var elem = cur[i].elem;
                // set crucial css properties
                $(elem).addClass('glue-menu-' + menu);
                $(elem).addClass('glue-menu');
                $(elem).addClass('glue-ui');
                $(elem).css('left', x + 'px');
                $(elem).css('position', 'fixed');
                $(elem).css('top', y + 'px');
                $(elem).css('visibility', 'hidden');
                $(elem).css('z-index', '201');
                // add to dom
                $('body').append(elem);
                // trigger event
                $(elem).trigger('glue-menu-activate');

                // check if we still want to show the icon ;)
                if ($(elem).css('display') == 'none') {
                    continue;
                } else {
                    num_shown++;
                }
                // calculate max width & height
                // make sure you specify the width & height attribute for images etc
                if (max_w < $(elem).outerWidth(true)) {
                    max_w = $(elem).outerWidth(true);
                }
                if (max_h < $(elem).outerHeight(true)) {
                    max_h = $(elem).outerHeight(true);
                }
            }
            // position items
            var num_rows = 1;
            while (num_rows * num_rows < num_shown) {
                num_rows++;
            }
            var num_cols = num_rows;
            if (num_shown <= num_rows * (num_rows - 1)) {
                num_cols--;
            }
            var cur_row = 0;
            var cur_col = 0;
            for (var i = 0; i < cur.length; i++) {
                var elem = cur[i].elem;
                // check if the icon is shown
                if ($(elem).css('display') == 'none') {
                    continue;
                }
                if (cur_col == num_cols) {
                    cur_row++;
                    cur_col = 0;
                }
                // make visible
                $(elem).css('opacity', '0.0');
                $(elem).css('visibility', '');
                $(elem).animate({
                    left: (x - (num_rows * max_w) / 2 + cur_col * max_w) + 'px',
                    opacity: 1.0,
                    top: (y - (num_rows * max_h) / 2 + cur_row * max_h) + 'px'
                }, 200);
                cur_col++;
            }
            // register close menu event and set prev_menu
            $('body').bind('click', close_menu);
            prev_menu = menu;
            // convert x, y to page and save them
            spawn_coords = { x: $(document).scrollLeft() + x, y: $(document).scrollTop() + y };
            return true;
        },
        spawn_coords: function () {
            return spawn_coords;
        }
    };
}();