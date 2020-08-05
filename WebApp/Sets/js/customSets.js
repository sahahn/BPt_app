

function getSets() {

	jQuery.getJSON('getSets.php', function(data) {
		console.log(data)
	});

}

jQuery(document).ready(function() {

	getSets();



});