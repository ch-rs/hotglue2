/**
 *	editor/sel
 *	Functions for handling object selection
*/
let drag_prev_grid = false;
let drag_prev_x = false;
let drag_prev_y = false;
let drag_start_x = false;
let drag_start_y = false;
let drag_mouse_start_x = false;
let drag_mouse_start_y = false;
let key_moving = false;

$.glue.sel = function () {
    // this could probably also be body
    $('html').bind('click', function (e) {
        if (e.target == $('body').get(0)) {
            if ($('.glue-selected').length) {
                // deselect when clicking on background
                $.glue.sel.none();
                // prevent the menu from firing
                e.stopImmediatePropagation();
            }
        }
    });

    $('html').bind('keydown', function (e) {
        if (e.which == 9) {
            // cycle through all objects with tab key
            if ($('.glue-selected').length < 2) {
                var next = false;
                if ($('.glue-selected').next('.object').length) {
                    next = $('.glue-selected').next('.object');
                } else {
                    next = $('.object').first();
                }
                if (next) {
                    $.glue.sel.none();
                    $.glue.sel.select(next);
                    // scroll to the selected objects if not currently visible
                    var window_min_x = $(document).scrollLeft();
                    var window_max_x = window_min_x + $(window).width();
                    var window_min_y = $(document).scrollTop();
                    var window_max_y = window_min_y + $(window).height();
                    var h = $(next).outerHeight();
                    var p = $(next).position();
                    var w = $(next).outerWidth();
                    // fit the entire object on the screen
                    // TODO (later): scroll a bit more up/left for the any
                    // context menu to fit in there too
                    if (p.left < window_min_x) {
                        $(document).scrollLeft(p.left);
                    } else if (window_max_x < p.left + w) {
                        $(document).scrollLeft(window_min_x + p.left + w - window_max_x);
                    }
                    if (p.top < window_min_y) {
                        $(document).scrollTop(p.top);
                    } else if (window_max_y < p.top + h) {
                        $(document).scrollTop(window_min_y + p.top + h - window_max_y);
                    }
                }
            }
            return false;
        } else if (33 == e.which && e.shiftKey && $('.glue-selected').length) {
            // shift+pageup: move objects to top of stack
            // we can't use ctrl+page{up,down} as this cycles through tabs
            // only prevent scrolling here
            return false;
        } else if (34 == e.which && e.shiftKey && $('.glue-selected').length) {
            // shift+pagedown: move objects to bottom of stack
            return false;
        } else if (37 <= e.which && e.which <= 40 && $('.glue-selected').length) {
            // move selected elements with arrow keys
            var add_x = 0;
            var add_y = 0;
            if (e.which == 38) {
                add_y = -1;
            } else if (e.which == 39) {
                add_x = 1;
            } else if (e.which == 40) {
                add_y = 1;
            } else if (e.which == 37) {
                add_x = -1;
            }
            // shift multiplier
            if (e.shiftKey && $.glue.grid) {
                // this depends on the grid size
                add_x *= $.glue.grid.x();
                add_y *= $.glue.grid.y();
            }
            $('.glue-selected').not('.locked').each(function () {
                var p = $(this).position();
                // prevent elements from going completely offscreen
                if (1 < p.left + add_x + $(this).outerWidth()) {
                    $(this).css('left', (p.left + add_x) + 'px');
                }
                if (1 < p.top + add_y + $(this).outerHeight()) {
                    $(this).css('top', (p.top + add_y) + 'px');
                }
            });
            // scroll window if neccessary
            // TODO (later): implement for moving multiple objects
            if ($('.glue-selected').length == 1) {
                var window_min_x = $(document).scrollLeft();
                var window_max_x = window_min_x + $(window).width();
                var window_min_y = $(document).scrollTop();
                var window_max_y = window_min_y + $(window).height();
                var elem = $('.glue-selected');
                var p = $(elem).position();
                var w = $(elem).outerWidth();
                var h = $(elem).outerHeight();
                if (p.left < window_min_x) {
                    $(document).scrollLeft(p.left);
                } else if (window_max_x < p.left + w) {
                    $(document).scrollLeft(p.left + w);
                }
                if (p.top < window_min_y) {
                    $(document).scrollTop(p.top);
                } else if (window_max_y < p.top + h) {
                    $(document).scrollTop(p.top + h);
                }
            }
            // trigger event (once, cleared in keyup)
            if (!key_moving) {
                $('.glue-selected').not('.locked').trigger('glue-movestart');
                key_moving = true;
            }
            // prevent window scrolling
            return false;
        } else if (e.ctrlKey && e.which == 65) {
            // select all objects not locked objects
            // selected locked objects will be unselected
            $('.object').not('.glue-selected').not('.locked').each(function () {
                $.glue.sel.select($(this));
            });
            // exclude locked objects from selection
            $('.locked.glue-selected').each(function () {
                $.glue.sel.deselect($(this));
            });
            return false;
        } else if (e.ctrlKey && e.which == 68) {
            // select none
            $.glue.sel.none();
            return false;
        } else if (e.ctrlKey && e.which == 73) {
            // invert selection
            var next = $('.object').not('.glue-selected').not('.locked');
            $.glue.sel.none();
            $(next).each(function () {
                $.glue.sel.select($(this));
            });
            return false;
        } else {
            // DEBUG
            //console.log('html keydown '+e.which);
        }
    });

    $('html').bind('keyup', function (e) {
        if (33 == e.which && e.shiftKey && $('.glue-selected').length) {
            // shift+pageup: move objects to top of stack
            $('.glue-selected').not('.locked').each(function () {
                $.glue.stack.to_top($(this));
                $.glue.object && $.glue.object.save($(this));
            });
            $.glue.stack.compress();
            return false;
        } else if (34 == e.which && e.shiftKey && $('.glue-selected').length) {
            // shift+pagedown: move objects to bottom of stack
            $('.glue-selected').not('.locked').each(function () {
                $.glue.stack.to_bottom($(this));
                $.glue.object && $.glue.object.save($(this));
            });
            $.glue.stack && $.glue.stack.compress();
            return false;
        } else if (37 <= e.which && e.which <= 40 && $('.glue-selected').length) {
            // move selected elements with arrow keys
            $('.glue-selected').not('.locked').trigger('glue-movestop');
            key_moving = false;
            return false;
        } else if (e.which == 46 && $('.glue-selected').length) {
            // delete selected objects
            // this is pretty much copied from object-edit.js
            var objs = $('.glue-selected').not('.locked');
            $(objs).each(function () {
                var id = $(this).attr('id');
                $.glue.object && $.glue.object.unregister($(this));
                $(this).remove();
                // delete in backend as well
                $.glue.backend && $.glue.backend({ method: 'glue.delete_object', name: id });
                // update canvas
                $.glue.canvas && $.glue.canvas.update();
            });
            return false;
        } else {
            // DEBUG
            //console.log('html keydown '+e.which);
        }
    });

    $('.object').live('dragstart', function (e) {
        // contrain to axis when dragging with shift key pressed
        drag_start_x = $(this).position().left;
        drag_start_y = $(this).position().top;
        drag_mouse_start_x = e.pageX;
        drag_mouse_start_y = e.pageY;
        $(this).draggable('option', 'axis', false);
        if (!$(this).hasClass('glue-selected')) {
            // event for selected objects is triggered in the .glue-selected dragstart
            // handler
            $(this).trigger('glue-movestart');
        }
    });

    $('.object').live('dragstop', function (e) {
        // reset previous grid setting
        if (drag_prev_grid) {
            $(this).draggable('option', 'grid', drag_prev_grid);
            drag_prev_grid = false;
        }
    });

    $('.object').live('drag', function (e) {
        // ignore grid when ctrl is pressed
        if (e.ctrlKey) {
            if ($(this).draggable('option', 'grid') !== false) {
                // save previous setting
                drag_prev_grid = $(this).draggable('option', 'grid');
                // disable grid
                $(this).draggable('option', 'grid', false);
            }
        } else {
            // reset previous setting
            if (drag_prev_grid) {
                $(this).draggable('option', 'grid', drag_prev_grid);
                drag_prev_grid = false;
            }
        }
        // contrain to axis when dragging with shift key pressed
        if (e.shiftKey) {
            var dir;
            if (Math.abs(e.pageX - drag_mouse_start_x) < Math.abs(e.pageY - drag_mouse_start_y)) {
                dir = 'y';
            } else {
                dir = 'x';
            }
            var diff = Math.abs(Math.abs(e.pageX - drag_mouse_start_x) - Math.abs(e.pageY - drag_mouse_start_y));
            if ($(this).draggable('option', 'axis') == false) {
                // move object back to the starting position
                $(this).css('left', drag_start_x + 'px');
                $(this).css('top', drag_start_y + 'px');
                $(this).draggable('option', 'axis', dir);
            } else {
                // only change direction if difference is greater than 50 pixels
                if (50 < diff && $(this).draggable('option', 'axis') != dir) {
                    // move object back to the starting position
                    $(this).css('left', drag_start_x + 'px');
                    $(this).css('top', drag_start_y + 'px');
                    $(this).draggable('option', 'axis', dir);
                }
            }
        } else {
            $(this).draggable('option', 'axis', false);
        }
    });

    $('.object').live('dragstop', function (e) {
        if (!$(this).hasClass('glue-selected')) {
            // event for selected objects is triggered in the .glue-selected dragstop
            // handler
            $(this).trigger('glue-movestop');
        }
    });

    $('.glue-selected').live('drag', function (e) {
        if (1 < $('.glue-selected').length) {
            // dragging multiple selected object
            var that = this;
            var that_p = $(this).position();
            $('.glue-selected').each(function () {
                if (this == that) {
                    return;
                }
                var p = $(this).position();
                $(this).css('left', (p.left + that_p.left - drag_prev_x) + 'px');
                $(this).css('top', (p.top + that_p.top - drag_prev_y) + 'px');
            });
            drag_prev_x = that_p.left;
            drag_prev_y = that_p.top;
        }
    });

    $('.glue-selected').live('dragstart', function (e) {
        if (1 < $('.glue-selected').length) {
            var p = $(this).position();
            drag_prev_x = p.left;
            drag_prev_y = p.top;
        }
        $('.glue-selected').trigger('glue-movestart');
    });

    $('.glue-selected').live('dragstop', function (e) {
        // dragging multiple selected object
        // there does not seem to be a drag event for the position where the
        // mouse button is released, so the following is necessary
        var that = this;
        var that_p = $(this).position();
        $('.glue-selected').each(function () {
            if (this == that) {
                return;
            }
            var p = $(this).position();
            $(this).css('left', (p.left + that_p.left - drag_prev_x) + 'px');
            $(this).css('top', (p.top + that_p.top - drag_prev_y) + 'px');
        });
        $('.glue-selected').trigger('glue-movestop');
    });

    $('.object').live('click', function (e) {
        // TODO (later): moving objects after shift clicking on them does not seem to work right on Chrome, document and fill a bug upstream
        if (!e.shiftKey && !$(this).hasClass('glue-selected')) {
            $.glue.sel.none();
        }
        if (e.shiftKey && $(this).hasClass('glue-selected')) {
            $.glue.sel.deselect($(this));
        }
        // shift clicking involving locked object will result in no action
        else if (e.shiftKey && $(this).hasClass('locked') || $('.glue-selected').hasClass('locked')) {
            return;
        } else {
            $.glue.sel.select($(this));
        }

    });

    $('.object').live('glue-movestop', function (e) {
        if ($.glue.object) {
            // update tooltip
            $.glue.object.resizable_update_tooltip(this);
            // save object
            $.glue.object.save(this);
            // update canvas
            $.glue.canvas.update(this);
        }
    });

    $('.object').live('glue-unregister', function (e) {
        $.glue.sel.deselect($(this));
    });

    return {
        // deselect an object
        // obj .. element
        deselect: function (obj) {
            if ($(obj).hasClass('glue-selected')) {
                var border = $(obj).outerHeight() - $(obj).innerHeight();
                $(obj).removeClass('glue-selected');
                $(obj).trigger('glue-deselect');
                var p = $(obj).position();
                $(obj).css('left', (p.left + border / 2) + 'px');
                $(obj).css('top', (p.top + border / 2) + 'px');
                //$(obj).css('width', ($(obj).width()+border)+'px');
                //$(obj).css('height', ($(obj).height()+border)+'px');
                // DEBUG
                //console.log('deselected '+$(obj).attr('id'));
            }
        },
        // select none
        none: function () {
            $('.glue-selected').each(function () {
                $.glue.sel.deselect($(this));
            });
        },
        // select an object
        // obj .. element
        select: function (obj) {
            // TODO (later): handle more than one obj (and change callers)
            if (!$(obj).hasClass('glue-selected')) {
                $(obj).addClass('glue-selected');
                $(obj).trigger('glue-select');
                // TODO (later): the following code works for dashed borders but
                // not for solid ones - read out the border-style on the fly and
                // act accordingly (there seem to be a problem with getting the
                // information through jQuery 1.4.3 however)
                // also needs changes above and in register_alter_pre_save
                var p = $(obj).position();
                var border = $(obj).outerHeight() - $(obj).innerHeight();
                $(obj).css('left', (p.left - border / 2) + 'px');
                $(obj).css('top', (p.top - border / 2) + 'px');
                //$(obj).css('width', ($(obj).width()-border)+'px');
                //$(obj).css('height', ($(obj).height()-border)+'px');
                // DEBUG
                //console.log('selected '+$(obj).attr('id'));
            }
        },
        // return if an object is selected
        // obj .. element
        selected: function (obj) {
            return $(obj).hasClass('glue-selected');
        }
    };
}();