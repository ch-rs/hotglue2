/**
 *	modules/page/responsive-edit.js
 *	Frontend code for responsive modes
 *
 *	Copyright Gottfried Haider, Danja Vasiliev 2010.
 *	This source code is licensed under the GNU General Public License.
 *	See the file COPYING for more details.
 */

$(document).ready(function () {
	var elem = $('<img src="' + $.glue.base_url + 'modules/responsive/responsive-temp-icon.png" width="32" height="32">');
	$(elem).attr('title', 'change responsive mode');
	$(elem).bind('mousedown', function (e) {
		var that = this;
		var modes = ['default', 'fluid-container', 'fluid-left-container', 'fluid-tiles'];
		var currentMode = modes.indexOf($('html').attr('data-responsive-mode'));
		if (currentMode < 0) {
			currentMode = 0;
		}

		var nextMode = (currentMode + 1) % modes.length;

		alert('Responsive mode is now ' + modes[nextMode]);

		$('html').attr('data-responsive-mode', modes[nextMode]);
		$.glue.backend({ method: 'glue.update_object', name: $.glue.page + '.page', 'page-responsive-mode': modes[nextMode] });

		$(that).attr('title', 'change responsive mode (currently ' + modes[nextMode] + ')');
		$.glue.menu.hide();
	});

	$.glue.menu.register('page', elem, 14);

	// Drag to set container width
	elem = $('<img src="' + $.glue.base_url + 'modules/responsive/page-container-size.png" width="32" height="32">');
	$(elem).attr('title', 'change responsive mode (' + (parseInt(document.documentElement.style.getPropertyValue('--container-width')) || 'unset') + ')');
	$(elem).bind('mousedown', function (e) {
		var that = this;
		let initialWidth = parseInt(document.documentElement.style.getPropertyValue('--container-width')) || 500;
		$.glue.slider(e, function (x, y, evt) {
			var containerWidth = Math.max(200, initialWidth + x);
			document.documentElement.style.setProperty('--container-width', containerWidth)
		}, function (x, y) {
			$.glue.backend({ method: 'glue.update_object', name: $.glue.page + '.page', 'page-container-width': (initialWidth + parseInt(x)) });
			$(that).attr('title', 'change responsive mode (currently ' + (initialWidth + parseInt(x)) + ')');
			$.glue.menu.hide();
		});
	});

	$.glue.menu.register('page', elem, 15);
});
