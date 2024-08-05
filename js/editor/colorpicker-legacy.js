/**
 *	editor/colorpicker-legacy
 *  A colorpicker that uses the farbtastic library
*/

$.glue.colorpicker = function () {
    var change_func = false;
    var color = false;
    var finish_func = false;
    var shown = false;

    // setup element
    var elem = $('<div id="glue-colorpicker" class="glue-ui" style="z-index: 202;"><div id="glue-colorpicker-transparent" class="glue-ui"></div><div id="glue-colorpicker-wheel" style="height: 195px; width: 195px;" title="set transparent"></div></div>');
    $(elem).children('#glue-colorpicker-wheel').farbtastic(function (col) {
        if (col !== color) {
            // update tooltip
            $(elem).children('#glue-colorpicker-wheel').find('.marker').attr('title', col);
            $(elem).children('#glue-colorpicker-transparent').removeClass('glue-colorpicker-transparent-set');
            $(elem).children('#glue-colorpicker-transparent').addClass('glue-colorpicker-transparent-notset');
            if (typeof change_func == 'function') {
                change_func(col);
            }
            color = col;
        }
    });
    $(elem).children('#glue-colorpicker-transparent').bind('click', function (e) {
        $(this).addClass('glue-colorpicker-transparent-set');
        $(this).removeClass('glue-colorpicker-transparent-notset');
        if (typeof change_func == 'function') {
            change_func('transparent');
        }
        color = 'transparent';
    });

    var close_colorpicker = function (e) {
        // close colorpicker when clicking outside of it or its children
        // note: this handler is also being called right after colorpicker
        // creation
        if (!$(e.target).hasClass('glue-ui') && $(e.target).parents('.glue-ui').length == 0) {
            // this also unregisters the event
            $.glue.colorpicker.hide();
            // prevent the menu from firing
            e.stopImmediatePropagation();
        }
    };

    return {
        hide: function (cancel) {
            if (shown) {
                if (cancel === undefined || cancel == false) {
                    if (typeof finish_func == 'function') {
                        finish_func(color);
                    }
                }
                $(elem).detach();
                shown = false;
            }
            // unregister event
            $('body').unbind('click', close_colorpicker);
        },
        is_shown: function () {
            return shown;
        },
        set_color: function (col) {
            $.color.setColor(col);
            var rgba = $.color.getRGB();
            var hex = $.color.getHex();
            if ($(elem).children('#glue-colorpicker-transparent').css('display') == 'block') {
                // showing transparency button
                if (rgba.a == 0) {
                    $(elem).children('#glue-colorpicker-transparent').addClass('glue-colorpicker-transparent-set');
                    $(elem).children('#glue-colorpicker-transparent').removeClass('glue-colorpicker-transparent-notset');
                    col = 'transparent';
                } else {
                    $(elem).children('#glue-colorpicker-transparent').removeClass('glue-colorpicker-transparent-set');
                    $(elem).children('#glue-colorpicker-transparent').addClass('glue-colorpicker-transparent-notset');
                }
            } else {
                // not showing transparency button
                // a special case for color 'transparent'
                if (rgba.r == 0 && rgba.g == 0 && rgba.b == 0 && rgba.a == 0) {
                    // set color to white
                    hex = '#ffffff';
                }
            }
            // set color wheel
            $.farbtastic($(elem).children('#glue-colorpicker-wheel')).setColor(hex);
            $(elem).children('#glue-colorpicker-wheel').find('.marker').attr('title', hex);
            color = col;
        },
        show: function (def, transp, change, finish) {
            if (shown) {
                $.glue.colorpicker.hide();
            }
            color = false;

            // set functions first, as $.farbtastic().setColor() immediately
            // triggers a change event
            change_func = change;
            finish_func = finish;

            if (transp) {
                $(elem).children('#glue-colorpicker-transparent').css('display', 'block');
            } else {
                $(elem).children('#glue-colorpicker-transparent').css('display', 'none');
            }

            if (typeof def != 'string' || def.length == 0) {
                // set a sane default
                $.farbtastic($(elem).children('#glue-colorpicker-wheel')).setColor('#ff0000');
                $(elem).children('#glue-colorpicker-wheel').find('.marker').removeAttr('title');
            } else {
                $.glue.colorpicker.set_color(def);
            }

            // add to dom
            $('body').append(elem);
            shown = true;
            // register event
            $('body').bind('click', close_colorpicker);
        }
    };
}();