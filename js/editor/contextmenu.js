/**
 *	editor/contextmenu
 *	Functions for handling the context menu
*/

$.glue.contextmenu = function () {
    var default_prio = 10;
    var left = [];
    var m = {};
    var owner = false;
    var prev_owner = false;
    var top = [];
    var veto = {};

    $('.object').live('glue-deselect', function (e) {
        // hide menu when deselecting
        $.glue.contextmenu.hide();
    });

    $('.object').live('glue-movestart', function (e) {
        // hide menu when moving the selected object
        if (this == owner) {
            prev_owner = owner;
            $.glue.contextmenu.hide();
        }
    });

    $('.object').live('glue-movestop', function (e) {
        // show menu again when we hid the menu because of movement
        if (this == prev_owner) {
            $.glue.contextmenu.show(prev_owner);
            prev_owner = false;
        }
    });

    $('.object').live('glue-select', function (e) {
        // show menu when one object is selected
        if ($('.glue-selected').length == 1) {
            $.glue.contextmenu.show(this);
        } else {
            $.glue.contextmenu.hide();
        }
    });

    return {
        hide: function () {
            if (owner) {
                while (left.length) {
                    var item = left.shift();
                    $(item.elem).trigger('glue-menu-deactivate');
                    $(item.elem).detach();
                }
                while (top.length) {
                    var item = top.shift();
                    $(item.elem).trigger('glue-menu-deactivate');
                    $(item.elem).detach();
                }
                owner = false;
            }
        },
        is_shown: function () {
            if (owner) {
                return true;
            } else {
                return false;
            }
        },
        register: function (cls, name, elem, prio) {
            if (!m[cls]) {
                m[cls] = [];
            }
            if (prio === undefined) {
                prio = default_prio;
            }
            m[cls].push({ 'name': name, 'elem': elem, 'prio': prio });
        },
        reuse: function (cls, name, as, prio) {
            if (prio === undefined) {
                prio = default_prio;
            }
            for (var cur_m in m) {
                for (var i = 0; i < m[cur_m].length; i++) {
                    if (m[cur_m][i].name == name) {
                        // clone element with data and events
                        var new_elem = $(m[cur_m][i].elem).clone(true);
                        $.glue.contextmenu.register(cls, as, new_elem, prio);
                        // return new element
                        return new_elem;
                    }
                }
            }
            return false;
        },
        show: function (obj) {
            if (owner) {
                if (obj == owner) {
                    return;
                } else {
                    $.glue.contextmenu.hide();
                }
            }
            // unless object is locked construct default menus
            if (!$(obj).hasClass('locked')) {
                for (var cls in m) {
                    if ($(obj).hasClass(cls)) {
                        var target;
                        // add to left or top
                        if (cls == 'object') {
                            target = left;
                        } else {
                            target = top;
                        }
                        // sort by priority ascending
                        for (var i = 0; i < m[cls].length; i++) {
                            var added = false;
                            for (var j = 0; j < target.length; j++) {
                                if (m[cls][i].prio < target[j].prio) {
                                    target.splice(j, 0, m[cls][i]);
                                    added = true;
                                    break;
                                }
                            }
                            if (!added) {
                                target.push(m[cls][i]);
                            }
                        }
                    }
                }
                // if object is locked show only 'object-lock' in object menu
            } else {
                var target = left;
                // find out position of 'object-lock' module in module array
                for (var i = 0; i < m['object'].length; i++) {
                    if (m['object'][i]['name'] == 'object-lock') {
                        target.push(m['object'][i]);
                    }
                }
            }
            // remove specific menu items again
            var obj_cls = $(obj).attr('class').replace(/\s+/, ' ').split(' ');
            for (var cls in veto) {
                for (var i = 0; i < obj_cls.length; i++) {
                    if (cls == obj_cls[i]) {
                        for (var j = 0; j < veto[cls].length; j++) {
                            for (var k = 0; k < left.length; k++) {
                                if (left[k].name == veto[cls][j]) {
                                    left.splice(k, 1);
                                    k--;
                                }
                            }
                            for (var k = 0; k < top.length; k++) {
                                if (top[k].name == veto[cls][j]) {
                                    top.splice(k, 1);
                                    k--;
                                }
                            }
                        }
                    }
                }
            }
            // position items
            for (var i = 0; i < 2; i++) {
                var target;
                // Get the current position of the object relative to the document
                var cur_left = $(obj).offset().left;
                var cur_top = $(obj).offset().top;
                var offset = 48; // menu offset (when can't calculate height or width)
                if (i == 0) {
                    target = top;
                    // this is to make sure that the context menu for objects positioned at 0, 0 is accessible
                    // TODO (later): can be improved
                    if (left.length) {
                        if (cur_left - $(left[0].elem).outerWidth(true) < 0) {
                            cur_left = $(left[0].elem).outerWidth(true) + offset;
                        }
                        // if left menu is empty shift top menu right by 48px (to make fisrt icon visible)
                        // TODO: calculate offset dynamically
                    } else {
                        if (cur_left - offset < 0) {
                            cur_left = offset;
                        }
                    }
                } else {
                    target = left;
                    // this is to make sure that the context menu for objects positioned at 0, 0 is accessible
                    // TODO (later): can be improved
                    if (top.length) {
                        if (cur_top - $(top[0].elem).outerHeight(true) < 0) {
                            cur_top = $(top[0].elem).outerHeight(true);
                        }
                        // if top menu is empty shift left menu down by 48px (to make fisrt icon visible)
                        // TODO: calculate offset dynamically
                    } else {
                        if (cur_top - offset < 0) {
                            cur_top = offset;
                        }
                    }
                }
                // add items to dom
                for (var j = 0; j < target.length; j++) {
                    // set crucial css properties
                    $(target[j].elem).attr('id', 'glue-contextmenu-' + target[j].name);
                    if (target == left) {
                        $(target[j].elem).addClass('glue-contextmenu-left');
                    } else {
                        $(target[j].elem).addClass('glue-contextmenu-top');
                    }
                    $(target[j].elem).addClass('glue-ui');
                    $(target[j].elem).css('position', 'absolute');
                    $(target[j].elem).css('visibility', 'hidden');
                    $(target[j].elem).css('z-index', '201');
                    // add to dom and move
                    $('body').append(target[j].elem);
                    if (target == top) {
                        $(target[j].elem).css('left', cur_left + 'px');
                        var temp_top = cur_top - $(target[j].elem).outerHeight(true);
                        if (temp_top < 0) {
                            temp_top = 0;
                        }
                        $(target[j].elem).css('top', temp_top + 'px');
                        var cur_width = $(target[j].elem).outerWidth(true);
                    } else {
                        var temp_left = cur_left - $(target[j].elem).outerWidth(true);
                        if (temp_left < 0) {
                            temp_left = 0;
                        }
                        $(target[j].elem).css('left', temp_left + 'px');
                        $(target[j].elem).css('top', cur_top + 'px');
                        var cur_height = $(target[j].elem).outerHeight(true);
                    }
                    // set owner and trigger event
                    $(target[j].elem).data('owner', obj);
                    $(target[j].elem).trigger('glue-menu-activate');
                    // check if we still want to show the icon ;)
                    if ($(target[j].elem).css('display') == 'none') {
                        continue;
                    }
                    // show it for real
                    if (target == left) {
                        cur_top += cur_height;
                    } else {
                        cur_left += cur_width;
                    }
                    $(target[j].elem).css('visibility', '');
                    $(target[j].elem).hide();
                    $(target[j].elem).fadeIn(333);
                }
            }
            owner = obj;
            // reset prev_owner as well
            prev_owner = false;
            return true;
        },
        veto: function (cls, name) {
            if (!veto[cls]) {
                veto[cls] = [];
            }
            veto[cls].push(name);
        }
    };
}();