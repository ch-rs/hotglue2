/**
 *	editor/slider
 *	Functions for handling sliders
 *
*/

$.glue.slider = function () {
    return function (e, change, stop) {
        var old_e = e;
        var mousemove = function (e) {
            if (typeof change == 'function') {
                change(e.pageX - old_e.pageX, e.pageY - old_e.pageY, e);
            }
            return false;
        };
        var mouseup = function (e) {
            $('html').unbind('mousemove', mousemove);
            $('html').unbind('mouseup', mouseup);
            if (typeof change == 'function') {
                change(e.pageX - old_e.pageX, e.pageY - old_e.pageY, e);
            }
            if (typeof stop == 'function') {
                stop(e.pageX - old_e.pageX, e.pageY - old_e.pageY, e);
            }
            return false;
        };
        $('html').bind('mousemove', mousemove);
        $('html').bind('mouseup', mouseup);
    };
}();