function getSetTableHTML(set_id) {

    var html = '' +
    '<br>' +
    '<div id="spot-'+set_id+'">' +
    '</div>';

    return html;
}

function initSetTable(set_id, variables) {
    
    var table_spot = jQuery('#spot-'+set_id);
    table_spot.empty().append('<table id="table-'+set_id+'" data-id="'+set_id+'" class="table table-striped" style="width:100%"></table>');
    
    // Make data table with passed variables
    var table = jQuery('#table-'+set_id);
    var rm_btn = '<button class="btn btn-sm btn-danger set-rm">Remove</button>';
    var dt = table.DataTable({
        dom: '<"top"li>rt<"bottom"pf>',
        data: variables.map(v => [v, rm_btn]),
        columns: [{title: "Variable"},  {title: "", orderable: false, className: "text-center"}],
        scrollX: true,
        autoWidth: true,
        searching: true,
        lengthChange: true,
        lengthMenu: [[5, 10, 25, 50, -1], [5, 10, 25, 50, "All"]],
    });


    table.on('draw.dt', function() {

        jQuery('.set-rm').off('click');
        jQuery('.set-rm').on('click', function() {
            var row_val = $(this).parent().siblings().html();

            jQuery.getJSON('php/getSets.php', { "action": "removeMeasure", "id": set_id, "variable": row_val }, function(data) {
            });

            dt.row($(this).parents('tr')).remove().draw();
        });

    });

    table.trigger('draw.dt');
}

function addSet(set) {


    var html = '';

    html += '' +

    '<div class="card" id="card-'+set['id']+'">' +
    '<div class="card-body">' +

        '<div class="row">' +
        '<div class="col col-md-10">' +
        '<h5 class="card-title"><input data-id="'+set['id']+'" type="text" class="set-name form-control" placeholder="Set Name" value="'+set['name']+'"></h5>' +
        '</div>' +
        '<div class="col col-md-2">' +
        '<button type="button" data-id="'+set['id']+'" class="set-close close" aria-label="Close">' +
        '<span aria-hidden="true">&times;</span>' +
        '</button>' +
        '</div>' +
        '</div>' +

        '<hr>' +
         getPopLabel(undefined, "Set from RegExp ", "Blah Blah Blah") +

        '<div class="row">' +
        '<div class="col">' +
        '<div>' +
        '<input data-id="'+set['id']+'" type="text" class="form-control search-text">' +
        '</div>' +
        getSetTableHTML(set['id']) +
        '</div></div>' +
    
    '</div>' +
    '</div>';

    jQuery('#card-cols').prepend(html);

    if (set['variables'].length > 0) {
        initSetTable(set['id'], set['variables']);
    }

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
    

    var html = '' +
    '<div id="card-cols" class="card-columns">' +

    '<div class="card" id="add-set-card">' +
    '<div class="card-body">' +

    '<button id="add-new-set" type="button" class="btn btn-success mx-auto">' +
    '<i class="fa fa-plus-circle fa-7x" aria-hidden="true"></i>' +
    '</button>' +
    '</div>' +
    '</div>' +

    '</div>';

    jQuery('#body-sets').append(html);
    jQuery('#body-sets').css('display', 'block');

    // Add each existing set
    sets.forEach(set => {
        shown_sets = addSet(set, shown_sets);
    });

        //jQuery.getJSON('php/getSets.php', { "action": "create", "name": "unnamed", "variables": [] }, function(data) {
         //     console.log(data)

         //  });

    jQuery('.search-text').off('change');
    jQuery('.search-text').on('change', function() {

        var search = $(this).val();
        var set_id = $(this).data('id');

        if ((search.length !== 0) && (search.length < 1000)) {
            var results = variables.filter(entry => entry.match(RegExp(search)));
            initSetTable(set_id, results);

            jQuery.getJSON('php/getSets.php',
            { "action": "save",
            "variables": results,
            "id":$(this).data()['id']}, function(data) {
                console.log(data);
            });
        }

        else {
            jQuery('#spot-'+set_id).empty();
        }
    });

    jQuery('.set-name').off('change');
    jQuery('.set-name').on('change', function() {

        jQuery.getJSON('php/getSets.php',
         { "action": "save",
           "name": $(this).val(),
           "id":$(this).data()['id']}, function(data) {
               console.log(data);
        });

    });

    jQuery('.set-close').off('click');
    jQuery('.set-close').on('click', function() {
        
        var set_id = $(this).data('id');

        jQuery.getJSON('php/getSets.php', { 'action': "delete", "id": set_id }, function(data) {
            console.log(data);
        });

        jQuery('#card-'+set_id).remove();
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
