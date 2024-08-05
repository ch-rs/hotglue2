/**
 *	editor/grid
 *	Functions for handling the grid and guides
*/

$.glue.grid = function () {
    var guides = [];		// list of elements
    var guides_x = [];		// list of y coordinates for x-guides
    var guides_y = [];		// list of x coordinates for y-guides
    var lines = [];			// list of elements
    var grid_height = false;
    var grid_mode = 0;
    var grid_width = false;
    var grid_x = 50;
    var grid_y = 50;

    var draw = function () {
        // bit 0 draws the grid and guides
        // i'd have preferred to use the canvas element for this, but as it
        // would need to be on top it'd receive all the click events..
        // TODO (later): there seem to be an off-by-one bug in Chrome when rendering the line over an object below
        if ((grid_mode & 1)) {
            if (grid_height !== $(document).height() || grid_width !== $(document).width()) {
                // optimization: only redraw the grid when width & height changes
                remove();
                grid_height = $(document).height();
                grid_width = $(document).width();
                // get background color
                var bg_color = '#ffffff';	// default to white
                if ($('body').css('background-color').length) {
                    $.color.setColor($('body').css('background-color'));
                    var bg_a = $.color.getArray();
                    // xcolor doesn't handle the complementary of rgba(0, 0, 0, 0)
                    if (bg_a[3] != 0) {
                        bg_color = $.color.getHex();
                    }
                }
                // add grid lines
                for (var x = grid_x; x <= grid_width; x += grid_x) {
                    var elem = $('<div></div>');
                    // set crucial css properties
                    $(elem).addClass('glue-grid-y');
                    $(elem).addClass('glue-grid');
                    $(elem).addClass('glue-ui');
                    // use complementary color
                    $(elem).css('background-color', $.xcolor.complementary(bg_color));
                    $(elem).css('height', grid_height + 'px');
                    $(elem).css('left', x + 'px');
                    $(elem).css('position', 'absolute');
                    $(elem).css('top', '0px');
                    $(elem).css('width', '1px');
                    $(elem).css('z-index', '200');
                    // add to dom and list
                    $('body').append(elem);
                    lines.push(elem);
                }
                for (var y = grid_y; y <= grid_height; y += grid_y) {
                    var elem = $('<div></div>');
                    $(elem).addClass('glue-grid-x');
                    $(elem).addClass('glue-grid');
                    $(elem).addClass('glue-ui');
                    // use complementary color
                    $(elem).css('background-color', $.xcolor.complementary(bg_color));
                    $(elem).css('height', '1px');
                    $(elem).css('left', '0px');
                    $(elem).css('position', 'absolute');
                    $(elem).css('top', y + 'px');
                    $(elem).css('width', grid_width + 'px');
                    $(elem).css('z-index', '200');
                    $('body').append(elem);
                    lines.push(elem);
                }
                // and guides
                for (var i in guides_x) {
                    var elem = $('<div></div>');
                    $(elem).addClass('glue-guide-x');
                    $(elem).addClass('glue-guide');
                    $(elem).addClass('glue-ui');
                    // use a different color than background and grid lines
                    $(elem).css('background-color', $.xcolor.average($.xcolor.complementary(bg_color), bg_color));
                    $(elem).css('height', grid_height + 'px');
                    $(elem).css('left', guides_x[i] + 'px');
                    $(elem).css('position', 'absolute');
                    $(elem).css('top', '0px');
                    $(elem).css('width', '1px');
                    $(elem).css('z-index', '200');
                    $('body').append(elem);
                    guides.push(elem);
                }
                for (var i in guides_y) {
                    var elem = $('<div></div>');
                    $(elem).addClass('glue-guide-y');
                    $(elem).addClass('glue-guide');
                    $(elem).addClass('glue-ui');
                    // use a different color than background and grid lines
                    $(elem).css('background-color', $.xcolor.average($.xcolor.complementary(bg_color), bg_color));
                    $(elem).css('height', '1px');
                    $(elem).css('left', '0px');
                    $(elem).css('position', 'absolute');
                    $(elem).css('top', guides_y[i] + 'px');
                    $(elem).css('width', grid_width + 'px');
                    $(elem).css('z-index', '200');
                    $('body').append(elem);
                    guides.push(elem);
                }
            }
        } else {
            remove();
        }
        // bit 1 changes drag behavior
        // this is not working as expected (the object snaps every x/y pixels
        // form the current position, not from 0/0)
        // TODO (later): implement this properly
        if ((grid_mode & 2)) {
            $('.object').draggable('option', 'grid', [grid_x, grid_y]);
        } else {
            $('.object').draggable('option', 'grid', false);
        }
        // bit 2 changes resize behavior
        // this is not working as expected (the object snaps every x/y pixels
        // form the current position, not from 0/0)
        // TODO (later): implement this properly
        if ((grid_mode & 4)) {
            $('.resizable').resizable('option', 'grid', [grid_x, grid_y]);
        } else {
            $('.resizable').resizable('option', 'grid', false);
        }
    };

    var remove = function () {
        // remove lines
        while (lines.length) {
            var line = lines.shift();
            $(line).remove();
        }
        // and guides
        while (guides.length) {
            var guide = guides.shift();
            $(guide).remove();
        }
        grid_height = false;
        grid_width = false;
    };

    return {
        add_guide_x: function (y) {
            guides_x.push(y);
        },
        add_guide_y: function (x) {
            guides_y.push(x);
        },
        mode: function (val) {
            if (val === undefined) {
                return grid_mode;
            } else {
                grid_mode = val;
                // call update() to redraw
            }
        },
        update: function (force) {
            if (force !== undefined && force) {
                grid_height = false;
                grid_width = false;
            }
            draw();
        },
        x: function (val) {
            if (val === undefined) {
                return grid_x;
            } else {
                grid_x = val;
                // call update() to redraw
            }
        },
        y: function (val) {
            if (val === undefined) {
                return grid_y;
            } else {
                grid_y = val;
                // call update() to redraw
            }
        }
    };
}();