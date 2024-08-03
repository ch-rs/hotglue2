$(document).ready(function() {
	var elem = $('<img src="'+$.glue.base_url+'modules/build/build-one.png" width="32" height="32">');
	$(elem).attr('title', 'build this page as HTML');

	$(elem).bind('mousedown', function (e) {
		window.location = $.glue.base_url+'?'+$.glue.page_id+'/build';
	});

	$.glue.menu.register('page', elem, 17);

    elem = $('<img src="'+$.glue.base_url+'modules/build/build-all.png" width="32" height="32">');
	$(elem).attr('title', 'build all pages as HTML');

	$(elem).bind('mousedown', function (e) {
		window.location = $.glue.base_url+'?'+$.glue.page_id+'/build_all';
	});

	$.glue.menu.register('page', elem, 17);
});