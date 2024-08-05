/**
 *	editor/stack
 *	Functions for handling the z-index stack
*/

$.glue.stack = function () {
    var default_z = 100;
    var max_z = 199;
    var min_z = 0;

    var intersecting = function (a, b) {
        var a_h = $(a).outerHeight();
        var a_p = $(a).position();
        var a_w = $(a).outerWidth();
        var b_h = $(b).outerHeight();
        var b_p = $(b).position();
        var b_w = $(b).outerWidth();
        if ((a_p.left <= b_p.left + b_w && b_p.left <= a_p.left + a_w) &&
            (a_p.top <= b_p.top + b_h && b_p.top <= a_p.top + a_h)) {
            return true;
        } else {
            return false;
        }
    };

    return {
        compress: function () {
            var max = min_z - 1;
            var min = max_z + 1;
            var shift = 0;
            // get min and max z of all objects
            $('.object').not('.locked').each(function () {
                var z = parseInt($(this).css('z-index'));
                if (isNaN(z)) {
                    return;
                }
                if (z < min) {
                    min = z;
                }
                if (max < z) {
                    max = z;
                }
            });
            // compress levels
            for (var i = min; i <= max; i++) {
                // for each z-index level
                // check if there is an object in this level
                var found = false;
                $('.object').not('.locked').each(function () {
                    var z = parseInt($(this).css('z-index'));
                    if (isNaN(z)) {
                        return;
                    } else if (z == i) {
                        found = true;
                    }
                });
                // if not, move all upper levels one down
                if (!found) {
                    // DEBUG
                    //console.log('compressing level '+i);
                    max--;
                    $('.object').not('.locked').each(function () {
                        var z = parseInt($(this).css('z-index'));
                        if (isNaN(z)) {
                            return;
                        } else if (i < z) {
                            $(this).css('z-index', --z);
                            $(this).addClass('need_save');
                        }
                    });
                }
            }
            // calculcate how much we want to shift all z's
            shift = default_z - Math.round((max - min) / 2) - min;
            // DEBUG
            //console.log('shift is '+shift);
            if (Math.abs(shift) < 20) {
                shift = 0;
            } else {
                $('.object').addClass('need_save');
            }
            // save objects
            $('.need_save').each(function () {
                var z = parseInt($(this).css('z-index'));
                if (!isNaN(z)) {
                    $(this).css('z-index', z + shift);
                    $.glue.object && $.glue.object.save(this);
                }
                $(this).removeClass('need_save');
            });
        },
        default_z: function () {
            return default_z;
        },
        to_bottom: function (obj) {
            var local_min_z = max_z + 1;
            var old_z = parseInt($(obj).css('z-index'));
            $('.object').not('.locked').each(function () {
                if (this == $(obj).get(0)) {
                    return;
                }
                if (!intersecting(obj, this)) {
                    return;
                } else {
                    // DEBUG
                    //console.log('object intersects '+$(this).attr('id'));
                }
                if ($(this).css('z-index').length) {
                    var z = parseInt($(this).css('z-index'));
                    if (!isNaN(z) && z < local_min_z) {
                        local_min_z = z;
                    }
                }
            });
            // check if we need to update the object
            if (isNaN(old_z) || local_min_z <= old_z) {
                // check if we really found an intersecting element (otherwise
                // local_min_z is max_z+1) and if we are inside min_z
                if (local_min_z <= max_z && min_z < local_min_z) {
                    $(obj).css('z-index', local_min_z - 1);
                    // DEBUG
                    //console.log('set z-index to '+(local_min_z-1));
                    return true;
                }
            }
            return false;
        },
        to_top: function (obj) {
            var local_max_z = min_z - 1;
            var old_z = parseInt($(obj).css('z-index'));
            $('.object').not('.locked').each(function () {
                if (this == $(obj).get(0)) {
                    return;
                }
                if (!intersecting(obj, this)) {
                    return;
                } else {
                    // DEBUG
                    //console.log('object intersects '+$(this).attr('id'));
                }
                if ($(this).css('z-index').length) {
                    var z = parseInt($(this).css('z-index'));
                    if (!isNaN(z) && local_max_z < z) {
                        local_max_z = z;
                    }
                }
            });
            // check if we need to update the object
            if (isNaN(old_z) || old_z <= local_max_z) {
                // check if we really found an intersecting element (otherwise
                // local_max_z is min_z-1) and if we are inside max_z
                if (min_z <= local_max_z && local_max_z < max_z) {
                    $(obj).css('z-index', local_max_z + 1);
                    // DEBUG
                    //console.log('set z-index to '+(local_max_z+1));
                    return true;
                }
            }
            return false;
        }
    };
}();