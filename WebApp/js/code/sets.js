function getSetTableHTML(set_id) {

    var html = '' +
    '<div>' +
    '<br>' +
    '<table id="table-'+set_id+'" data-id="'+set_id+'" class="table table-striped" style="width:100% display: none>"></table>' +
    '</div>';

    return html;
}

function initSetTable(set_id, variables) {
    
    var table = jQuery('#table-'+set_id);
    
    // Make sure empty and displayed
    table.empty();
    table.css('display', 'block');

    // Make data table with passed variables
    var rm_btn = '<button class="btn btn btn-danger set-rm">Remove</button>';
    table.DataTable({
        data: variables.map(v => [v, rm_btn]),
        columns: [{title: "Variable"},  {title: "", orderable: false, className: "text-center"}],
        scrollX: true,
        autoWidth: true,
        lengthChange: true,
        lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, "All"]],
    });

}

function addSet(set, shown_sets) {


    var html = '';

    if (shown_sets % 2 == 0) {
        html += '<div class="row">'
    }

    html += '<div class="col col-md-6">' +

    '<div class="card">' +
    '<div class="card-body">' +
        '<h5 class="card-title"><input type="text" class="set-name form-control" placeholder="Set Name" value="'+set['name']+'"></h5>' +
        '<hr>' +
         getPopLabel(undefined, "Set From RegExp ", "Blah Blah Blah") +

        '<div class="row">' +
        '<div class="col">' +
        '<div>' +
        '<input type="text" class="form-control search-text" style="width: 70%; margin-right:3px; display:inline-block">' +
        '<button data-id="'+set['id']+'" class="btn search-button">Search</button>' +
        '</div>' +
        getSetTableHTML(set['id']) +
        '</div></div>' +
    
    '</div>' +
    '</div>';

    if (shown_sets % 2 == 1) {
        html += '</div>';
    }

    jQuery('#body-sets').append(html);

    if (set['variables'].length > 0) {
        initSetTable(set_id, set['variables']);
    }




    //"name": "smri",
    //"variables": [],
    //"id":





    return shown_sets + 1;
}

function showSets() {

    // Clear everything
    noProjectDefault();
    jQuery('#body-noproj').css('display', 'none');

    // If already loaded
    if (jQuery('#body-sets').html().length > 30) {
        jQuery('#body-sets').css('display', 'block');
        return;
    }

    var shown_sets = 0;
    jQuery('#body-sets').css('display', 'block');

    // Add each existing set
    sets.forEach(set => {
        shown_sets = addSet(set, shown_sets);
    });

    jQuery.getJSON('getSets.php', { "action": "create", "name": "unnamed", "variables": [] }, function(data) {
        console.log(data)
    
    });

   
    jQuery('.search-button').on('click', function() {

        var search = $(this).siblings().val();
        var results = variables.filter(entry => entry.match(RegExp(search)));
        var set_id = $(this).data('id');
        initSetTable(set_id, results);

    });

}



    // sets should be already loaded


    //jQuery.getJSON('getSets.php', { 'action': "delete", "id": id }, function(data) {
    //jQuery.getJSON('getSets.php', { "action": "get" }, function(data) {
    //jQuery.getJSON('getSets.php', { "action": "save", "name": value, "id": jQuery(this).parent().attr("id") }, function(data) {
    //jQuery.getJSON('getSets.php', { "action": "removeMeasure", "id": id, "variable": item }, function(data) {
    //jQuery.getJSON('getSets.php', { "action": "addMeasure", "id": activeCard, "variable": jQuery(this).attr('item') }, function(data) {
    //jQuery.getJSON('getSets.php', { "action": "create", "name": "unnamed", "variables": [] }



    //"name": "smri",
    //"variables": [],
    //"id": "ABCD5eb07431c916d"
