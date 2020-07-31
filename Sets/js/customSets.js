function displaySet(s) {
	console.log(s)
}

function getSets() {
    
    jQuery.getJSON('getSets.php', function(data) {
        jQuery('.num-sets').text("There are currently no sets.");
	if (data == null)
	    return;
	if (data.length == 1)
	    jQuery('.num-sets').text("There is currently " + data.length + " set.");
	else {
	    jQuery('.num-sets').text("There are currently " + data.length + " sets.");
	}
	for (var i = 0; i < data.length; i++) {
	    displaySet(data[i]);
	}
	// make card editable
	jQuery('.card-title').editable(function(value, settings) {
	    console.log("got a changed value");
	    console.log(value);
	    console.log(settings);
	    jQuery.getJSON('getSets.php', { "action": "save", "name": value, "id": jQuery(this).parent().attr("id") }, function(data) {
		console.log("got back: " + data);
	    });
	    return value;
	}, {
	    type: 'textarea',
	    method: 'GET',
	    submit: 'OK'
	});
    });
}

jQuery(document).ready(function() {

	getSets();



});