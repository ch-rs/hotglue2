<?php

use Smarty\Smarty;

/*
 *	module_loader.inc.php
 *	Automatically run PHP scripts for some pages, and pass data to the page
 *
 *	This source code is licensed under the GNU General Public License.
 *	See the file COPYING for more details.
 */

@require_once('config.inc.php');
require_once('html.inc.php');
require_once('modules.inc.php');

$pages = [];

function loaders_alter_render_early($object) {
    global $pages;

    $page = explode('.', $object['obj']['name'])[0];

    $smarty = new Smarty();
    $data = [];

    if (!isset($pages[$page])) {
        if (file_exists('loaders/' . $page . '.php')) {
            include 'loaders/' . $page . '.php';
        }

        $pages[$page] = $data;
    } else {
        $data = $pages[$page];
    }

    $smarty->assign('data', $data);

    $object['elem'] = set_text_node($object['elem'], $smarty);

    return $object;
}

function set_text_node($elem, $smarty) {
    if (is_array($elem) && !isset($elem['val'])) {
        // If elem is an array, iterate through it
        foreach ($elem as $key => $val) {
            $elem[$key] = set_text_node($val, $smarty);
        }
    } else if (is_array($elem) && isset($elem['val']) && is_array($elem['val'])) {
        // If elem is an array with a 'val' key, check if 'val' is a string and set it
        foreach ($elem['val'] as $key => $val) {
            $elem['val'][$key] = set_text_node($val, $smarty);
        }
    } else if (isset($elem['val']) && is_string($elem['val'])) {
        // If elem is a string, render it with Smarty
        $elem['val'] = $smarty->fetch('string:' . $elem['val']);
    }

    return $elem;
}
