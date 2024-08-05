/**
 *	editor/canvas
 *	Functions for handling the canvas (used for grid and object positioning)
*/

$(document).ready(function () {
	// make sure we call enlarge body even if there are no objects
	$.glue.canvas.update();

	// enlarge body when we resize the window
	var resize_timer;
	$(window).bind('resize', function (e) {
		clearTimeout(resize_timer);
		resize_timer = setTimeout(function () {
			$.glue.canvas.update();
		}, 100);
	});
});

$.glue.canvas = function () {
	return {
		update: function (elem) {
			if (elem === undefined) {
				elem = $('.object');
			}
			var max_x = 0;
			var max_y = 0;
			$(elem).each(function () {
				var p = $(this).position();
				if (max_x < p.left + $(this).outerWidth()) {
					max_x = p.left + $(this).outerWidth();
				}
				if (max_y < p.top + $(this).outerHeight()) {
					max_y = p.top + $(this).outerHeight();
				}
			});
			// make body at least match the window width and height but don't
			// send these values to the backend in any case
			if (max_x < $(window).width()) {
				max_x = $(window).width();
			}
			if (max_y < $(window).height()) {
				max_y = $(window).height();
			}

			// resize body
			//$('body').css('width', max_x+'px');
			//$('body').css('height', max_y+'px');

			// update grid
			if ($.glue.grid) {
				$.glue.grid.update();
			}
		}
	};
}();
