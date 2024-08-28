<?php

use Michelf\Markdown;

/*
 *	module_markdown.inc.php
 *	Convert text fields to and from markdown
 *
 *	This source code is licensed under the GNU General Public License.
 *	See the file COPYING for more details.
 */

@require_once('config.inc.php');
require_once('html.inc.php');
require_once('modules.inc.php');

$pages = [];

function markdown_alter_render_early($object) {

    // If Markdown is not installed, return
    if (!class_exists('Michelf\Markdown')) {
        log_msg('debug', 'Michelf Markdown is not installed, not converting text');
        return $object;
    }

    $object['elem'] = markdown_text_nodes($object['elem']);

    return $object;
}

function markdown_text_nodes($elem) {
    if (is_array($elem) && !isset($elem['val'])) {
        // If elem is an array, iterate through it
        foreach ($elem as $key => $val) {
            $elem[$key] = markdown_text_nodes($val);
        }
    } else if (is_array($elem) && isset($elem['val']) && is_array($elem['val'])) {
        // If elem is an array with a 'val' key, check if 'val' is a string and set it
        foreach ($elem['val'] as $key => $val) {
            $elem['val'][$key] = markdown_text_nodes($val);
        }
    } else if (isset($elem['val']) && is_string($elem['val'])) {
        // If elem is a string, render it with Smarty
        // Only if val contains a newline character
        if (strpos($elem['val'], "\n") > 1) {
            $elem['val'] = Markdown::defaultTransform($elem['val']);
            $elem['class'][] = 'markdown';
        }
    }

    return $elem;
}
