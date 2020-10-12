var set_variables;


function getBaseSetCardsHTML() {
    
    var html = '' +
    '<div id="card-cols" class="card-columns">' +

    '<div class="card" id="add-set-card" style="border:0px;">' +
    '<div class="card-body text-center">' +
    '<h5>Add New Set</h5>' + 

    '<button id="add-new-set" type="button" class="btn btn-success">' +
    '<i class="fa fa-plus-circle fa-7x" aria-hidden="true"></i>' +
    '</button>' +
    '</div>' +
    '</div>' +

    '</div>';

    return html;
}

function getBaseSetsHTML() {

    var html = '' +
    '<label for="set-dataset">Select a source dataset to view / edit sets for:\u00A0</label>' +
    '<select id="set-dataset" class="form-control" data-width="60%"></select>' +

    '<div id="card-sets" style="margin-top: 5%;">' +
    '</div>';

    return html;
}

function getSetTableHTML(set_id) {

    var html = '' +
    '<br>' +
    '<div id="spot-'+set_id+'">' +
    '</div>';

    return html;
}

function getAddSetHTML(set) {
    var reg_exp_text = "This functionality allows you to generate a set from a " +
        "regular expression search across all variables loaded in the database. " +
        "Please note that you must either press enter, or move your focus away from the " +
        "search input in order to start the search. Also note that searches yielding more than " +
        "1000 variables will not be shown, or saved as a set.";
    var reg_exp_label = getPopLabel(undefined, "Set from RegExp ", reg_exp_text);

    var html = '';

    html += '' +

        '<div class="card" id="card-' + set['id'] + '">' +
        '<div class="card-body">' +

        '<div class="row">' +
        '<div class="col col-md-10">' +
        '<h5 class="card-title"><input data-id="' + set['id'] + '" type="text" class="set-name form-control" placeholder="Set Name" value="' + set['name'] + '"></h5>' +
        '</div>' +
        '<div class="col col-md-2">' +
        '<button type="button" data-id="' + set['id'] + '" class="set-close close" aria-label="Close">' +
        '<span aria-hidden="true">&times;</span>' +
        '</button>' +
        '</div>' +
        '</div>' +

        '<hr>' +
        reg_exp_label +

        '<div class="row">' +
        '<div class="col">' +
        '<div>' +
        '<input data-id="' + set['id'] + '" type="text" class="form-control search-text">' +
        '</div>' +
        getSetTableHTML(set['id']) +
        '</div></div>' +

        '</div>' +
        '</div>';
    return html;
}

function registerSetTable(set_id, variables) {
    
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
        lengthMenu: [[5, 10, 25, 50, -1, 0], [5, 10, 25, 50, "All", 0]],
        "preDrawCallback": function (settings) {
            pageScrollPos = document.documentElement.scrollTop;
        },
        "drawCallback": function (settings) {
            scrollTo(0, pageScrollPos);
        }
    });


    table.on('draw.dt', function() {

        jQuery('.set-rm').off('click');
        jQuery('.set-rm').on('click', function() {
            var row_val = $(this).parent().siblings().html();

            jQuery.post('php/getSets.php',
                {"action": "removeMeasure",
                 "id": set_id,
                 "variable": row_val,
                 "dataset": $('#set-dataset').val()
                });

            dt.row($(this).parents('tr')).remove().draw();
        });

    });

    table.trigger('draw.dt');
}

function addSet(set) {

    var html = getAddSetHTML(set);

    $(html).insertBefore($('#add-set-card'));
    //jQuery('#card-cols').insertBefore();

    if (set['variables'].length > 0) {
        registerSetTable(set['id'], set['variables']);
    }

}

function registerAddNewSet() {
    jQuery('#add-new-set').on('click', function () {

        jQuery.getJSON('php/getSets.php', {
            "action": "create",
            "name": "unnamed",
            "variables": [],
            "dataset": $('#set-dataset').val()
        }, function (data) {
            addSet(data);
            refreshSetRegisters();
        });
    });
}

function refreshSetRegisters() {
    // This function is designed to be called at init + 
    // time a new set is added

    registerSetSearch();
    registerSetNameChange();
    registerRemoveSet();
    registerPopovers();
}

function registerRemoveSet() {

    jQuery('.set-close').off('click');
    jQuery('.set-close').on('click', function () {

        var set_id = $(this).data('id');

        jQuery.post('php/getSets.php',
         {'action': "delete",
          "id": set_id,
          "dataset": $('#set-dataset').val()
        });

        jQuery('#card-' + set_id).remove();
    });
}

function registerSetNameChange() {

    jQuery('.set-name').off('change');
    jQuery('.set-name').on('change', function () {

        jQuery.post('php/getSets.php',
            {"action": "save",
             "name": $(this).val(),
             "id": $(this).data()['id'],
             "dataset": $('#set-dataset').val()
            });
    });
}

function registerSetSearch() {

    jQuery('.search-text').off('change');
    jQuery('.search-text').on('change', function () {

        var search = $(this).val();
        var set_id = $(this).data('id');

        if (search.length !== 0) {
            var results = set_variables.filter(entry => entry.match(RegExp(search)));

            if (results.length < 10000) {

                registerSetTable(set_id, results);

                jQuery.post('php/getSets.php',
                    {"action": "save",
                    "variables": results,
                    "id": $(this).data()['id'],
                    "dataset": $('#set-dataset').val()
                    });
            }
            else {
                jQuery('#spot-'+set_id).empty().append('Over limit of 10000! (' + results.length + ' results found). Search again!');
            }
        }
        else {
            jQuery('#spot-' + set_id).empty();
        }
    });
}

function showSets() {

    // Clear everything
    clearAll();

    // Get base html and add + display
    var html = getBaseSetsHTML();
    jQuery('#body-sets').append(html);
    jQuery('#body-sets').css('display', 'block');
    jQuery('#top-text').empty().append('Sets');

    // Register choice of dataset
    jQuery('#set-dataset').select2({
        data: arrayToChoices(datasets)
    });

    // Register on change dataset, re-display sets
    jQuery('#set-dataset').on('change', function() {

        // Refresh the card sets body of current sets
        jQuery('#card-sets').empty().append(getBaseSetCardsHTML());

        // Load according to current dataset
        jQuery.getJSON('php/load_dataset.php',
                {'dataset': $('#set-dataset').val()},
            function (data) {
            
            // Unpack possible set_variables
            set_variables = JSON.parse(data['variables']);

            // Re-display with new dataset
            displaySets(); 
        });
    });

    // Set by default to first dataset
    jQuery('#set-dataset').val(datasets[0]).trigger('change');
}

function displaySets() {
    
    jQuery.getJSON('php/getSets.php', {"action": "get",
                                       "dataset": $('#set-dataset').val()},
                   function (data) {

        // Add each existing set
        data.forEach(set => {
            addSet(set);
        });

        // Register add new set button
        registerAddNewSet();

        // After existing added, call the registers
        refreshSetRegisters();
    });
}

