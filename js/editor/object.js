/**
 *	editor/object
 *	Functions for handling objects
*/

$(document).ready(function () {
    // register all objects
    $('.object').each(function () {
        $.glue.object.register($(this));
    });
});

$.glue.object = function () {
    var alter_pre_save = {};
    var resize_prev_grid = false;
    var reg_objs = {};

    $('.resizable').live('glue-pre-clone', function (e) {
        // remove the jqueryui resizable-related stuff from the object
        $(this).removeClass('ui-resizable');
        $(this).children('.ui-resizable-handle').remove();
    });

    $('.object').live('resize', function (e) {
        // ignore grid when ctrl is pressed
        if (e.ctrlKey) {
            if ($(this).resizable('option', 'grid') !== false) {
                // save previous setting
                resize_prev_grid = $(this).resizable('option', 'grid');
                // disable grid
                $(this).resizable('option', 'grid', false);
            }
        } else {
            // reset previous setting
            if (resize_prev_grid) {
                $(this).resizable('option', 'grid', resize_prev_grid);
                resize_prev_grid = false;
            }
        }
        $.glue.object.resizable_update_tooltip(this);
        $(this).trigger('glue-resize');
    });

    $('.object').live('resizestart', function (e) {
        $(this).trigger('glue-resizestart');
    });

    $('.object').live('resizestop', function (e) {
        // reset previous grid setting
        if (resize_prev_grid) {
            $(this).resizable('option', 'grid', resize_prev_grid);
            resize_prev_grid = false;
        }
        $.glue.object.save(this);
        $(this).trigger('glue-resizestop');

        $.glue.canvas && $.glue.canvas.update(this);
    });

    $(document).ready(function () {
        $.glue.object.register_alter_pre_save('resizable', function (obj, orig) {
            // remove the jqueryui resizable-related stuff from the object
            $(obj).removeClass('ui-resizable');
            $(obj).children('.ui-resizable-handle').remove();
        });
        $.glue.object.register_alter_pre_save('object', function (obj, orig) {
            // remove the jqueryui draggable-related stuff from the object
            $(obj).removeClass('ui-draggable-dragging');
        });
        $.glue.object.register_alter_pre_save('glue-selected', function (obj, orig) {
            var border = $(orig).outerHeight() - $(orig).innerHeight();
            var p = $(orig).position();
            // remove class
            $(obj).removeClass('glue-selected');
            // and remove border offset
            $(obj).css('left', (p.left + border / 2) + 'px');
            $(obj).css('top', (p.top + border / 2) + 'px');
            //$(obj).css('width', ($(orig).width()+border)+'px');
            //$(obj).css('height', ($(orig).height()+border)+'px');
        });
    });

    return {
        // obj .. element
        register: function (obj) {
            // prevent double registration
            if (reg_objs[$(obj).attr('id')]) {
                return false;
            } else {
                reg_objs[$(obj).attr('id')] = true;
            }
            // make sure everything has a z-index
            if ($.glue.stack && isNaN(parseInt($(obj).css('z-index')))) {
                $(obj).css('z-index', $.glue.stack.default_z());
            }
            // obj must have width & height for draggable to work
            $(obj).draggable({ addClasses: false, distance: 10 });
            // obj must not be an img element (otherwise resizable creates a
            // wrapper which fucks things up)
            if ($(obj).hasClass('resizable')) {
                $(obj).resizable();
                $.glue.object.resizable_update_tooltip(obj);
            }
            $(obj).trigger('glue-register');
            $.glue.canvas && $.glue.canvas.update(obj);
        },
        register_alter_pre_save: function (cls, func) {
            alter_pre_save[cls] = func;
        },
        resizable_update_tooltip: function (obj) {
            var p = $(obj).position();
            // don't include any border in the calculation
            $(obj).children('.ui-resizable-handle').attr('title', $(obj).innerWidth() + 'x' + $(obj).innerHeight() + ' at ' + p.left + 'x' + p.top);
        },
        save: function (obj) {
            var elem = $(obj).clone();
            var elem_cls = $(elem).attr('class').replace(/\s+/, ' ').split(' ');
            for (var i = 0; i < elem_cls.length; i++) {
                if (typeof alter_pre_save[elem_cls[i]] == 'function') {
                    alter_pre_save[elem_cls[i]](elem, obj);
                }
            }
            // trim element content
            // necessary, otherwise we'd be sending \n\t back again
            $(elem).html($.trim($(elem).html()));
            // convert to string
            var html = $('<div></div>').html(elem).html();
            // DEBUG
            //console.log(html);
            $.glue.backend && $.glue.backend({ method: 'glue.save_state', 'html': html });
        },
        // obj .. element
        unregister: function (obj) {
            $(obj).trigger('glue-unregister');
            // can't update canvas here as object to be deleted is still in the
            // dom
        }
    };
}();