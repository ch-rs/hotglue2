<?php

/*
 *	module_page_status.inc.php
 *	Module for updating the status of a page ("live", "draft") and intercepting the rendering if page is unpublished
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
// module glue gets loaded on demand

function page_status_render_page_early($args) {
    if ($args['edit']) {
        if (USE_MIN_FILES) {
            html_add_js(base_url() . 'modules/page_status/page_status-edit.min.js');
        } else {
            html_add_js(base_url() . 'modules/page_status/page_status-edit.js');
        }
    }
}

function controller_permission_check($args) {
    if (empty($args[0][0]) && empty($args[0][1])) {
        // take the default page
        $args[0][0] = startpage();
        log_msg('debug', 'controller_default: using the default page');
    } elseif ($args[0][0] == 'edit' && empty($args[0][1])) {
        // quirk: edit the default page
        $args[0][0] = startpage();
        $args[0][1] = 'edit';
        log_msg('debug', 'controller_default: using the default page');
        invoke_controller($args);
        return;
    }

    page_canonical($args[0][0]);
    $obj = expl('.', $args[0][0]);

    // If page exists
    if (page_exists($args[0][0])) {
        $page = $args[0][0];
        $pagefile = $page . '.' . 'page';

        // If pagefile exists
        if (object_exists($pagefile)) {
            $obj = @load_object(["name" => $pagefile]);

            if (!isset($obj)) {
                return controller_default($args);
            }

            if (@isset($obj['#data']) && @isset($obj['#data']['page-status'])) {

                // Only show live pages
                if ($obj['#data']['page-status'] == 'live') {
                    return controller_default($args);
                }

                if ($obj['#data']['page-status'] == 'protected') {

                    // Return 401 if page has no password
                    if (!isset($obj['#data']['page-password'])) {
                        return hotglue_error(401);
                    }

                    // Ask for password with HTTP auth, if not already authenticated, and show the page if correct
                    if (!isset($_SERVER['PHP_AUTH_USER'])) {
                        header('WWW-Authenticate: Basic realm="Password required"');
                        header('HTTP/1.0 401 Unauthorized');
                        echo 'You need to enter the correct password to view this page.';
                        exit;
                    } else {
                        $user = isset($obj['#data']['page-user']) ? $obj['#data']['page-user'] : 'guest';
                        $password = $obj['#data']['page-password'];
                        if ($_SERVER['PHP_AUTH_USER'] == $user && $_SERVER['PHP_AUTH_PW'] == $password) {
                            return controller_default($args);
                        } else {
                            header('WWW-Authenticate: Basic realm="Password required"');
                            header('HTTP/1.0 401 Unauthorized');
                            echo 'You need to enter the correct password to view this page.';
                            exit;
                        }
                    }
                }
            }
        } else {
            return controller_default($args);
        }
    } else {
        return controller_default($args);
    }

    return hotglue_error(404);
}

register_controller('*', '*', 'controller_permission_check');
