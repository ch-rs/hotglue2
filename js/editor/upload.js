/**
 *	editor/upload
 *	Functions for handling uploads
*/


$(document).ready(function () {
    // generic upload button
    var elem = $('<div style="height: 32px; max-height: 32px; max-width: 32px; overflow: hidden; width: 32px;"><img src="' + $.glue.base_url + 'img/upload.png" alt="btn" width="32" height="32"></div>');
    var upload = $.glue.upload.default_upload_handling();
    upload.multiple = true;

    if (!$.glue.page) {
        $.glue.error('No page set, cannot upload files');
        return;
    }

    $.glue.upload.button(elem, { method: 'glue.upload_files', page: $.glue.page }, upload);

    if (!$.glue.menu) {
        $(elem).bind('click', function (e) {
            // update x, y  
            var p = $.glue.menu.spawn_coords();
            upload.x = p.x;
            upload.y = p.y;
        });
        $.glue.menu.register('new', elem, 11);
    }

    // handle drop events on body
    // this is based on http://developer.mozilla.org/en/using_files_from_web_applications
    // does not seem to be possible in jQuery at the moment
    // we use html here as body doesn't get enlarged when zooming out e.g.
    $('html').get(0).addEventListener('dragover', function (e) {
        e.stopPropagation();
        e.preventDefault();
    }, false);

    $('html').get(0).addEventListener('drop', function (e) {
        e.stopPropagation();
        e.preventDefault();
        // pageX, pageY are available in Firefox and Chrome
        // TODO (later): pageX, pageY does not seem to handle zoomed pages in Chrome (report)
        var upload = $.glue.upload.default_upload_handling(e.pageX, e.pageY);
        $.glue.upload.files(e.dataTransfer.files, { method: 'glue.upload_files', page: $.glue.page }, upload);
    }, false);
});

$.glue.upload = function () {
    // helper function that provides a default upload
    // orig_x .. (page) x position of upload (can be set on the fly in .x)
    // orig_y .. (page) y position of upload (can be set on the fly in .y)
    // TODO (later): expose this through $.glue.upload.default_upload_handling
    return {
        default_upload_handling: function (orig_x, orig_y) {
            if (orig_x === undefined) {
                orig_x = 0;
            }
            if (orig_y === undefined) {
                orig_y = 0;
            }
            var uploading = 0;
            return {
                error: function (e) {
                    // remove status indicator if no file uploading anymore
                    uploading--;
                    if (uploading == 0) {
                        $(this.status).detach();
                    }
                    // e.target.status suggested in
                    // http://developer.mozilla.org/en/XMLHttpRequest/Using_XMLHttpRequest
                    if (e && e.target && e.target.status) {
                        $.glue.error('There was a problem uploading a file (status ' + e.target.status + ')');
                    } else {
                        $.glue.error('There was a problem uploading a file. Make sure you are not exceeding the file size limits set in the server configuration.');
                        // DEBUG
                        console.error(e);
                    }
                },
                finish: function (data) {
                    // DEBUG
                    //console.log('finished uploading');
                    // remove status indicator if no file uploading anymore
                    uploading--;
                    if (uploading == 0) {
                        // DEBUG
                        //console.log('no files uploading anymore, removing status indicator');
                        $(this.status).detach();
                    }
                    // handle response
                    $.glue.upload.handle_response(data, this.x, this.y);
                },
                progress: function (e) {
                    // update status indicator
                    // TODO (later): values are off on Chrome when uploading multiple file, one after another (it jumps back and forth) (report)
                    $(this.status).children('.glue-upload-statusbar-done').css('width', (e.loaded / e.total * 100) + '%');
                    $(this.status).attr('title', e.loaded + ' of ' + e.total + ' bytes (' + (e.loaded / e.total * 100).toFixed(1) + '%)');
                },
                start: function (e) {
                    // DEBUG
                    //console.log('started uploading');
                    $.glue.menu && $.glue.menu.hide();
                    uploading++;
                    // add status indicator to dom
                    $('body').append(this.status);
                    $(this.status).children('.glue-upload-statusbar-done').css('width', '0%');
                    $(this.status).css('left', (this.x - $(this.status).outerWidth() / 2) + 'px');
                    $(this.status).css('top', (this.y - $(this.status).outerHeight() / 2) + 'px');
                },
                status: $('<div class="glue-upload-statusbar glue-ui" style="position: absolute; z-index: 202;"><div class="glue-upload-statusbar-done"></div></div>'),
                x: orig_x,
                y: orig_y
            }
        },
        // elem .. element to turn into a file button
        // data .. other parameters to send to the service
        // options ..	multiple => allow multiple files to be uploaded (boolean, defaults to false)
        //				tooltip => title attribute on the file button
        //				abort => function called if the upload didn't start
        //				start => function called when the upload started
        //				progress => function called periodically during the upload
        //				error => function called when an error occured
        //				finish => function called after the upload has completed
        button: function (elem, data, options) {
            // add a file input to the element
            if (!options) {
                options = {};
            }
            if (!options.tooltip) {
                options.tooltip = 'upload a file';
            }
            $(elem).prepend('<input type="file" title="' + options.tooltip + '" style="height: 100%; opacity: 0; position: absolute; width: 100%; z-index: 300;">');
            if (options.multiple) {
                $(elem).children('input').first().attr('multiple', 'multiple');
            }
            // add event handler
            $(elem).children('input').first().bind('change', function (e) {
                if (!this.files || this.files.length == 0) {
                    if (typeof options.abort == 'function') {
                        options.abort();
                    }
                    return false;
                } else {
                    $.glue.upload.files(this.files, data, options);
                    return false;
                }
            });
        },
        // files .. array of file-objects (see $.glue.upload.button)
        // data .. other parameters to send to the service
        // options ..	abort => function called if the upload didn't start
        //				start => function called when the upload started
        //				progress => function called periodically during the upload
        //				error => function called when an error occured
        //				finish => function called after the upload has completed
        files: function (files, data, options) {
            // based on http://www.appelsiini.net/2009/10/html5-drag-and-drop-multiple-file-upload
            // and jquery-html5-upload
            if (!data) {
                data = {};
            }
            if (!options) {
                options = {};
            }
            var xhr = new XMLHttpRequest();
            if (typeof options.progress == 'function') {
                // this is needed otherwise this is XMLHttpRequestUpload in the
                // progress handler
                xhr.upload['onprogress'] = function (e) {
                    options.progress(e);
                }
            }
            if (typeof options.finish == 'function') {
                xhr.onload = function (e) {
                    try {
                        options.finish($.parseJSON(e.target.responseText));
                    } catch (e) {
                        if (typeof options.error == 'function') {
                            options.error(e);
                        }
                    }
                };
            }
            if (typeof options.error == 'function') {
                xhr.onerror = function (e) {
                    options.error(e);
                }
            }
            xhr.open('POST', $.glue.base_url + 'json.php', true);
            if (window.FormData) {
                // DEBUG
                //console.log('upload: using FormData');
                var f = new FormData();
                // other parameters
                for (var key in data) {
                    f.append(key, JSON.stringify(data[key]));
                }
                // files
                for (var i = 0; i < files.length; i++) {
                    f.append('user_file' + i, files[i]);
                }
                xhr.send(f);
                if (typeof options.start == 'function') {
                    options.start(files);
                }
                return true;
            } else if (files[0] && files[0].getAsBinary) {
                // DEBUG
                //console.log('upload: using getAsBinary');
                // build RFC2388 string
                var boundary = '----multipartformboundary' + (new Date).getTime();
                var builder = '';
                // other parameters
                for (var key in data) {
                    builder += '--' + boundary + '\r\n';
                    builder += 'Content-Disposition: form-data; name="' + key + '"' + '\r\n';
                    builder += '\r\n';
                    builder += JSON.stringify(data[key]) + '\r\n';
                }
                // files
                for (var i = 0; i < files.length; i++) {
                    var file = files[i];
                    builder += '--' + boundary + '\r\n';
                    builder += 'Content-Disposition: form-data; name="user_file' + i + '"';
                    if (file.fileName) {
                        builder += '; filename="' + file.fileName + '"';
                    }
                    builder += '\r\n';
                    if (file.type) {
                        builder += 'Content-Type: ' + file.type + '\r\n';
                    } else {
                        builder += 'Content-Type: application/octet-stream' + '\r\n';
                    }
                    builder += '\r\n';
                    builder += file.getAsBinary();
                    builder += '\r\n';
                }
                // mark end of request
                builder += '--' + boundary + '--' + '\r\n';
                xhr.setRequestHeader('Content-Type', 'multipart/form-data; boundary=' + boundary);
                xhr.sendAsBinary(builder);
                if (typeof options.start == 'function') {
                    options.start(files);
                }
                return true;
            } else {
                $.glue.error('Your browser is not supported. Update to a recent version of Firefox or Chrome.');
                if (typeof options.abort == 'function') {
                    options.abort();
                }
                return false;
            }
        },
        handle_response: function (data, x, y) {
            if (!data) {
                $.glue.error('There was a problem communicating with the server');
            } else if (data['#error']) {
                $.glue.error('There was a problem uploading the file (' + data['#data'] + ')');
            } else {
                // add new elements to the dom and register them
                if (data['#data'].length == 0) {
                    // special case for no new elements
                    $.glue.error('The server did not reply with any object. The file type you were uploading could either not be supported (look around for more modules!) or there could be an internal problem. Check the log file to be sure!');
                    return;
                }
                // we're not selecting the new objects but at least clear the current selection
                $.glue.sel && $.glue.sel.none();
                for (var i = 0; i < data['#data'].length; i++) {
                    var obj = $(data['#data'][i]);

                    // load event handler
                    var content_loaded = function (e) {
                        // function scope bites us in the ass here
                        var mode = e.data.mode;
                        var target_x = e.data.target_x;
                        var target_y = e.data.target_y;
                        if ($(this).hasClass('object')) {
                            var obj = $(this);
                        } else {
                            var obj = $(this).parents('.object').first();
                        }
                        // set default width and height
                        $(obj).css('width', $(obj).width() + 'px');
                        $(obj).css('height', $(obj).height() + 'px');
                        // DEBUG
                        //console.log('glue-upload-dynamic-late: '+$(obj).attr('id'));
                        // fire handler (can overwrite width and height)
                        $(obj).trigger('glue-upload-dynamic-late', [this]);
                        // position object
                        if (mode == 'center') {
                            // move to the center of mouseclick
                            $(obj).css('left', (target_x - $(obj).outerWidth() / 2) + 'px');
                            $(obj).css('top', (target_y - $(obj).outerHeight() / 2) + 'px');
                        } else {
                            // move to stack
                            $(obj).css('left', (target_x + 'px'));
                            $(obj).css('top', (target_y + 'px'));
                        }
                        // restore visibility
                        $(obj).css('visibility', $(obj).data('orig_visibility'));
                        $(obj).removeData('orig_visibility');

                        if ($.glue.object) {
                            // register object
                            $.glue.object.register(obj);
                            // save object
                            $.glue.object.save(obj);
                        }
                    }

                    // set mode and target x, y
                    if (data['#data'].length == 1) {
                        var mode = 'center';
                        var target_x = x;
                        var target_y = y;
                    } else {
                        var mode = 'stack';
                        var target_x = x + i * $.glue.grid.x();
                        var target_y = y + i * $.glue.grid.y();
                    }
                    // check if we have dimensions already
                    var width = parseInt($(obj).get(0).style.getPropertyValue('width'));
                    if (isNaN(width) || width === 0) {
                        // bind load event handlers
                        $(obj).bind('load', { 'mode': mode, 'target_x': target_x, 'target_y': target_y }, content_loaded);
                        $(obj).find('*').bind('load', { 'mode': mode, 'target_x': target_x, 'target_y': target_y }, content_loaded);
                        // save initial visibility and make object invisible
                        $(obj).data('orig_visibility', $(obj).css('visibility'));
                        $(obj).css('visibility', 'hidden');
                        // add to dom
                        $(containerSelector).append(obj);
                        // DEBUG
                        //console.log('glue-upload-dynamic-early: '+$(obj).attr('id'));
                        // fire handler
                        $(obj).trigger('glue-upload-dynamic-early', [mode, target_x, target_y]);
                    } else {
                        // add to dom
                        $(containerSelector).append(obj);
                        // position object
                        if (mode == 'center') {
                            // move to the center of mouseclick
                            $(obj).css('left', (target_x - $(containerSelector).offset().left - $(obj).outerWidth() / 2) + 'px');
                            $(obj).css('top', (target_y - $(obj).outerHeight() / 2) + 'px');
                        } else {
                            // move to stack
                            $(obj).css('left', (target_x + 'px'));
                            $(obj).css('top', (target_y + 'px'));
                        }
                        // register object
                        $.glue.object && $.glue.object.register(obj);
                        // DEBUG
                        //console.log('registered static upload: '+$(obj).attr('id'));
                        // fire handler
                        $(obj).trigger('glue-upload-static', [mode]);
                        // save object
                        $.glue.object && $.glue.object.save(obj);
                    }
                }
            }
        }
    };
}();