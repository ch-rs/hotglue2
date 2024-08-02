<?php

/*
 *	module_responsive.inc.php
 *	Module for adding responsive modes
 *
 *	Copyright Gottfried Haider, Danja Vasiliev 2010.
 *	This source code is licensed under the GNU General Public License.
 *	See the file COPYING for more details.
 */

@require_once('config.inc.php');
require_once('common.inc.php');
require_once('html.inc.php');
require_once('util.inc.php');


function responsive_render_page_early($args)
{
	if ($args['edit']) {
		if (USE_MIN_FILES) {
			html_add_js(base_url().'modules/responsive/responsive-edit.min.js');
		} else {
			html_add_js(base_url().'modules/responsive/responsive-edit.js');
		}
		html_add_css(base_url().'modules/responsive/responsive-edit.css');
	}
	
	html_add_css(base_url().'modules/responsive/responsive.css');

	// set reponsive mode
	load_modules('glue');
    $obj = load_object(array('name'=>$args['page'].'.page'));

	if (isset($obj['#data']['page-responsive-mode']) && $obj['#data']['page-responsive-mode'] != 'default') {
		html_add_data('responsive-mode', $obj['#data']['page-responsive-mode']);

		if (isset($obj['#data']['page-container-width'])) {
			html_css('--container-width', $obj['#data']['page-container-width']);
		}

		$responsive_script = "
			const addSize = () => document.documentElement.style.setProperty('--vw', window.outerWidth);

			let cancel;
			window.onresize = function(){
				clearTimeout(cancel);
				cancel = setTimeout(addSize, 100);
			};
		";

		html_add_js_inline(preg_replace('/\s+/', ' ', $responsive_script), 0, "Responsive mode sizing");

		html_add_body_inline("<script>addSize();</script>", 9, "Responsive mode sizing");
	}
}