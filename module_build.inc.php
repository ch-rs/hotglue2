<?php

/*
 *	module_build.inc.php
 *	Module for building a page as static HTML
 *
 *	Copyright Gottfried Haider, Danja Vasiliev 2010.
 *	This source code is licensed under the GNU General Public License.
 *	See the file COPYING for more details.
 */

@require_once('config.inc.php');
require_once('common.inc.php');
require_once('controller.inc.php');
require_once('html.inc.php');
require_once('modules.inc.php');

function build_render_page_early($args)
{
	if ($args['edit']) {
		if (USE_MIN_FILES) {
			html_add_js(base_url().'modules/build/build-edit.min.js');
		} else {
			html_add_js(base_url().'modules/build/build-edit.js');
		}
		//html_add_css(base_url().'modules/build/build-edit.css');
	}
	
	//html_add_css(base_url().'modules/build/build.css');
}

function get_single_page_html ($page_name) {
	global $base_url_cached;
	$base_url_cached = '/';

	$page = $page_name;
    page_canonical($page);

	$args[0] = array($page);

	load_modules('glue');
	html_flush();
	default_html(false);
	render_page(array('page'=>$page, 'edit'=>false, 'build'=>true));
	$html = html_finalize();

	return $html;
}

function write_single_page ($page_name, $html) {
	// save the HTML to a file
	if ($page_name == 'start') {
	    $filename = STATIC_DIR. '/index.html';
	}
	else {
	    $filename = STATIC_DIR . '/' . $page_name . '.html';
	}
	
	file_put_contents($filename, $html);
}

function copy_folders ($dirs) {
	foreach($dirs as $in => $out){
		// Create directory if it doesn't exist
		if (!is_dir($out)) {
			mkdir($out, 0777, true);
		}

		// Clear directory
		$files = glob($out . '/*');
		foreach($files as $file){
			if(is_file($file)) {
				unlink($file);
			}
		}

		// Copy files from $in to $out
		if (is_dir($in)) {
			$files = glob($in . '/*');
			foreach($files as $file){
				if(is_file($file)) {
					$filename = basename($file);
					copy($file, $out . '/' . $filename);
				}
			}
		}	
	}
}

function copy_global_assets () {
	$dirs = [
		'css' => STATIC_DIR . '/css',
		'img' => STATIC_DIR . '/img',
		'js' => STATIC_DIR . '/js'
	];

	copy_folders($dirs);
}

function copy_page_assets ($page_name) {
	// Copy uploads to static directory
	$uploads_in = CONTENT_DIR . '/' . $page_name . '/shared';
	$uploads_out = STATIC_DIR . STATIC_UPLOAD_DIR . '/' . $page_name;

	// Make sure key directories exist
	$dirs = [
		$uploads_in => $uploads_out
	];

	copy_folders($dirs);
}


function controller_builder($args)
{
	if ($args[0][1] == 'build_all') {
		load_modules('glue');
		$pns = pagenames(array());
		$pns = $pns['#data'];
		foreach ($pns as $pn) {
			$page_html = get_single_page_html($pn);
			write_single_page($pn, $page_html);
			copy_page_assets($pn);
		}
		copy_global_assets();
	}
	else {
		$page_name = $args[0][0];

		$page_html = get_single_page_html($page_name);
		write_single_page($page_name, $page_html);
		copy_page_assets($page_name);
		copy_global_assets();
	}

	// If referrer exists, redirect back to it, otherwise redirect to $page
	if (isset($_SERVER['HTTP_REFERER'])) {
        header('Location: ' . $_SERVER['HTTP_REFERER']);
    } else {
        header('Location: ' . str_replace('/build', '/edit', $_SERVER['REQUEST_URI']));
    }
}

register_controller('*', 'build', 'controller_builder', array('auth'=>PAGES_NEED_AUTH));
register_controller('*', 'build_all', 'controller_builder', array('auth'=>PAGES_NEED_AUTH));