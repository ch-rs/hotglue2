<?php

/**
 *	module_minify.inc.php
 *	Keep track of modified dates of JS files, and minify them if changed
 */


@require_once('config.inc.php');
require_once('modules.inc.php');
require_once('common.inc.php');

require_once('modules/minify/class.JavaScriptPacker.php');

function minify_file($path) {
    $new_path = str_replace('.js', '.min.js', $path);

    $code = file_get_contents($path);

    $jsPacker = new JavaScriptPacker($code);

    file_put_contents($new_path, $jsPacker->pack());
}

function minify_render_page_early($args) {
    if (USE_INTERNAL_MINIFIER == false || !defined('USE_INTERNAL_MINIFIER')) {
        return;
    }

    // If JShrink is not installed, return
    if (!class_exists('JShrink\Minifier')) {
        log_msg('error', 'JShrink is not installed, cannot minify JS files');
        return;
    }

    $files = glob("js/*.js");
    $files = array_merge($files, glob("modules/*/*.js"));

    // Remove files with .min.js extension
    $files = array_filter($files, function ($file) {
        return strpos($file, '.min.js') === false;
    });

    $changed_count = 0;
    $missing_count = 0;

    // Last modified times are stored as JSON in /content/last_changed.json
    if (!file_exists(CONTENT_DIR . '/last_changed.json')) {
        $last_modified_times = [];
    } else {
        $last_modified_times = json_decode(file_get_contents(CONTENT_DIR . '/last_changed.json'), true);
    }

    foreach ($files as $file) {

        // If file does not exist in last_modified_times
        if (!array_key_exists($file, $last_modified_times)) {
            minify_file($file);
            $last_modified_times[$file] = time();

            // Set last modified time to current time
            $changed_count++;

            continue;
        }

        // If file has been modified since last check
        if (filemtime($file) > $last_modified_times[$file]) {
            minify_file($file);
            $last_modified_times[$file] = time();

            // Set last modified time to current time
            $changed_count++;

            continue;
        }

        // If file has not been minified yet
        // Check for sibling file that has .min.js extension
        if (!file_exists(str_replace('.js', '.min.js', $file))) {
            minify_file($file);
            $last_modified_times[$file] = time();

            // Set last modified time to current time
            $missing_count++;

            continue;
        }
    }

    // Save last modified times to file
    file_put_contents(CONTENT_DIR . '/last_changed.json', json_encode($last_modified_times));

    log_msg('info', 'minified: ' . $changed_count . ' files changed, and ' . $missing_count . ' files that weren\'t minifed yet');
}
