<?php

/*
 *	index.php
 *	Main HTTP request handler
 *
 *	Copyright Gottfried Haider, Danja Vasiliev 2010.
 *	This source code is licensed under the GNU General Public License.
 *	See the file COPYING for more details.
 */

require 'vendor/autoload.php';

@require_once('config.inc.php');
require_once('log.inc.php');
log_msg('info', '--- request ---');
require_once('controller.inc.php');
require_once('modules.inc.php');

// Check if the script is being run via CLI
if (PHP_SAPI === 'cli') {
    log_msg('info', 'Script is being run via CLI');
    // Get arguments from $argv
    $args = $argv;
    array_shift($args);
    $args = [$args];
} else {
    log_msg('info', 'Script is being run via web server');
    $args = parse_query_string();
}

log_msg('info', 'index: query arguments ' . var_dump_inl($args));
//log_msg('debug', 'index: base url is ' . quot(base_url()));
invoke_controller($args);
