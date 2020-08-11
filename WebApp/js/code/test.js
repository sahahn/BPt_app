/////////////////////////
// Test Specific HTML //
////////////////////////

function getTestTypeRowHTML() {

    var test_label = '<label for="test-buttons"' +
                     '><span data-toggle="popover"' +
                     'title="Type of Test Split" data-placement="top"' +
                     'data-content="New allows you to define a new testing set,' +
                     ' and From File/Val allows you to define a test set from a file or variable value.">' +
                     'Type of Test Split <i class="fas fa-info-circle fa-sm"></i>' +
                     '</span></label>';

    var html = '' +

    '<div class="form-row m-5">' +
        '<div class="d-flex flex-column">' +

        test_label +
        '<div class="btn-group-toggle btn-group" data-toggle="buttons" ' +
        'data-toggle="buttons" id="test-buttons">' +

            '<label class="btn btn-secondary">' +
            '<input type="radio" name="test-type" value="new">New Split</input>' +
            '</label>' +

            '<label class="btn btn-secondary">' +
            '<input type="radio" name="test-type" value="existing">From File/Val</input>' +
            '</label>' +

        '</div>'+
        '</div>' +
    '</div>';

    return html;
}

function getTestSizeHTML(key) {

    var vt_label = "This determines the size of the testing set";
    var val_test_label = getPopLabel(key, "Testing Set Size ", vt_label);

    var html = '' +

    '<div class="form-group col-md-6">' +
    val_test_label + 

    '<div class="input-group">' +
        '<div class="input-group-prepend">' +
            '<button class="btn btn-outline-secondary dropdown-toggle"  id="size-label" type="button"' +
            'data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">Test Size <a id="test-size-append"></a></button>' +

            '<div class="dropdown-menu">' +
            '<a id="test-percent" class="dropdown-item" href="#">Percentage (%)</a>' +
            '<a id="test-abs" class="dropdown-item" href="#">Fixed Number (#)</a>' +
            '</div>' + 
        '</div>' + 

        '<input id="test-size" type="number" class="form-control" aria-describedby="size-label"' +
        'step="0.01" min="0" max="100" title="Test Size"></input>' + 
    '</div>' +
    '</div>';

    return html;
}

function getTestParamsRowHTML(key) {

    var vs_label = "Select a validation strategy to use for this split";
    var val_strat_label = getPopLabel(key, "Validation Strategy ", vs_label);

    var html = '' +

    '<div id="if-new" class="m-5" style="display: none;">' +
    '<div class="form-row">' +

    getTestSizeHTML(key) +

    '<div class="form-group col-md-6">' +
    getValStratHTML(key, val_strat_label) +
    '</div>' +

    '</div>' +
    '</div>';

    return html;

}

function getTestHTML(key) {

    var i_label = "This option allows you to upload a file containing " +
                "a pre-defined set of test subjects. " + 
                "Specifically, valid files should be text files containing " +
                "one subject per line, and no header information.";

    var fs_label = "This option allows you to select the set of test subjects " +
                "based on the value of a loaded Non-Input variable." +
                "<br><b>Note:</b> Show must have been called on the Non-Input Variable " +
                "in order for the values to appear.";

    var file_input_label = getPopLabel(key, "Test subjects from File ", i_label);
    var from_strat_label = getPopLabel(key, "Test subjects by Non-Input Value ", fs_label);

    var html = '' +
    getTestTypeRowHTML() +

    getTestParamsRowHTML(key) +

    '<div id="if-existing" class="form-row m-5" style="display: none;">' +
    addSubjectsInputRowHTML(key, file_input_label, from_strat_label, 'test') +
    '</div>' +

    '<div class="m-5">' +
    resultsAltHTML(key, 'Show Test Split') +
    '</div>' + 
    '<div id="'+key+'-extra-dist-space"></div>';

    return html;

}

////////////////////////////////////////////
// Code for loading + display test dists //
//////////////////////////////////////////

function setDistImage(key, loc) {

    if (loc.includes('.png')) {

        jQuery.get('php/get_image.php', {'loc': loc}, function(output){
            jQuery('#'+key+'-dist').append('<div>' + 
            '<img draggable="false" id="'+key+'-img" style="max-width:700px;" class="img-fluid" src="data:image/png;base64,' +
            output + 
            '">' + '</div>');
        });
    }
    else {

        jQuery.get('php/get_video.php', {'loc': loc}, function(output){

            var vid_html = '<div draggable="false"><video autoplay controls loop class="embed-responsive-item" style="max-width:700px;">' +
            '<source type="video/mp4" src="data:video/mp4;base64,' +
            output + '">' +
            '</video></div>';

            jQuery('#'+key+'-dist').append(vid_html);
        });
    }
}

function setShowTestResults(output, key, project) {

    jQuery('#'+key+'-loading').css('display', 'none');

    // Add table html to table
    jQuery('#'+key+'-table').append(output['html_table']);
    jQuery("#default-table-id").prop('id', key+'-real-table');

    var original_height = jQuery('#' + key + '-table').height();

    var scroll_y_val = '';
    if (original_height > 600) {
        scroll_y_val = 600;
    }

    $('#'+key+'-real-table').DataTable({
        "scrollY": scroll_y_val,
        "searching": false,
        "paging": false,
        "info": false,
    });

    setDistImage(key, output['img_loc']);
}

function setTestResults(output, key, project) {

    // Set fixed header + start table
    var table_html = '' +
    '<table id="'+key+'-real-table" class="table table-striped">' +
    '<thead><tr>' + 
    '<th scope="col">Name</th>' +
    '<th scope="col">Source</th>' + 
    '<th scope="col"></th>' +
    '</tr></thead>' +
    '<tbody>';

    function add_options(choices, source) {

        choices.forEach(choice => {
            table_html = table_html +
            '<tr>' +
            '<th scope="row">' + choice.text + '</th>' +
            '<td>' + source + '</td>' +
            '<td><button data-name="' + choice.text + '" data-source="' +
            source + '" data-key="' + choice.id + '" ' +
            'class="btn btn-sm btn-primary test-view">Show</button></td>' +
            '</tr>';
        });
    }

    var sep = getAllInputChoices(project);
    //add_options(sep['by_type_choices'], 'Data Category');
    add_options(sep['set_var_choices'], 'Set Variable');
    add_options(sep['set_choices'], 'Set');
    add_options(sep['data_var_choices'], 'Data Variable');
    add_options(sep['strat_var_choices'], 'Non-Input Variable');
    add_options(sep['target_choices'], 'Target');
    
    table_html = table_html + '</tbody></table>';
    jQuery('#'+key+'-table').append(table_html);

    console.log(jQuery('#' + key + '-table').width()); 

    var to_scroll_X = false;
    if (jQuery('#' + key + '-table').width() > 600) {
        to_scroll_X = true;
    }
    
    $('#'+key+'-real-table').DataTable({
        "scrollX": to_scroll_X,
        "searching": true,
        "paging": true,
        "info": true,
        "columnDefs": [
            { "orderable": false, "targets": -1}
        ]
    });

    // Add some extra padding since no img dist
    jQuery('#'+key+'-table').css('padding-left', '50px');

    // Re-register everytime page changes
    $('#'+key+'-real-table').on('draw.dt', function() {
        jQuery('.test-view').off('click');

        // On view dist registers
        onShowTest(key, project);
    });

    // Trigger the draw one @ start
    $('#'+key+'-real-table').trigger('draw.dt');
}

function onShowTest(key, project) {

    // Register the show buttons
    jQuery('.test-view').on('click', function () {

        var data = $(this).data();
        var n_key = data['key'] + '-view';

        if (jQuery('#'+n_key+'-space').html() == undefined) {

            var card_body = '' +
                '<p id="' + n_key + '-loading">Loading...</p>' +
                '<div class="form-row">' +
                '<div class="col-sm-auto" id="' + n_key + '-table"></div>' +
                '<div class="col-sm-auto" id="' + n_key + '-dist"></div>' +
                '</div>';

            var card_name = '<b>' + data['source'] + '</b>: <i>' + data['name'] + '</i>';
            var card_html = cardWrapHTML(card_name, n_key, card_body, false);
            jQuery('#' + key + '-extra-dist-space').prepend(card_html);
            
            // Make un-draggable
            jQuery('#' + n_key + '-space').prop('draggable', false);

            // Load and show the dist of interest            
            var params = {};
            params['loading_params'] = getAllLoadedDataParams(project);
            params['test_params'] = getTestParams(key, project);
            params['show_params'] = data;
            params['script'] = 'show_test_split.py';

            // Change show params if set
            if (data['source'] == 'Set') {
                var set_var_names = [];
                var set_vars = getSetVarsFromId(project['data'][data['key']]['-data-sets']);
                set_vars.forEach(v => {
                    set_var_names.push(getReprName(v, project['data'][data['key']]['-eventname']));
                });

                params['show_params']['name'] = set_var_names;
            }

            // Run func
            runQuickPy(params, n_key, setShowTestResults, project);

            // Register remove
            jQuery('#' + n_key + '-remove').on('click', function () {
                jQuery('#' + n_key + '-space').remove();
            });

            jQuery('#' + n_key + '-collapse').collapse("show");
        }
    });
}

function getTestParams(key, project) {

    var params = {}

    if (project['data'][key]['test-type'] == 'new') {

        // Save random state
        params['random_state'] = project['data']['setup']['-random-seed'];

        // Get val params as either fixed random, or as a selected strategy
        var v_strat_key = project['data'][key]['val-strategy-key']
        params['val_params'] = getValParams(v_strat_key, project);

        // Save test size info
        params['test-size'] = project['data'][key]['test-size'];
        params['test-size-type'] = project['data'][key]['test-size-type'];
    }
    
    // If not new then from existing
    else {

        // Get test subjs from file
        if (project['data'][key]['file'].length > 0) {
            params['test_subjs_file'] = project['files']['test'];
        }

        // Get by val
        params['test_only_by_val'] = checkByValEntry('', key, project);
    }

    return params;
}

function loadTest(project, key) {

    var params = {}

    // Add the loading params
    params['loading_params'] = getAllLoadedDataParams(project);

    // Get the test params
    params['test_params'] = getTestParams(key, project);
    
    // Add target script
    params['script'] = 'load_test_split.py';

    // Run job + display output
    runQuickPy(params, key, setTestResults, project);

}

///////////////////////////////////
// Code for base test registers //
//////////////////////////////////

function changeTestFile(key, project, file) {

    var fileName = file.split("\\").pop();
    changeFileText(key, fileName);

    // If non-empty clear any selected from strat val
    if (fileName.length > 0) {
        jQuery('#'+key+'-var-input').val(null).trigger('change');
    }

    // Refresh just the test files
    refreshFiles(['test'], 'test-space', project);
}

function refreshTestRegisters(project) {

    // Refresh validation choice select
    getAllKeys(project).forEach(key => {
        if (key.includes('test-space')) {
            registerBaseValidationSelect(project, key)
        }
    });

    // Refresh by val choices
    refreshByValueChoices('test-space', project);
}

function registerTestSize(project, key) {

    // Save to project
    jQuery('#test-size').on('input', function () {
        project['data'][key]['test-size'] = $(this).val();
    });

    // Set existing test size / default
    var test_size = '20';
    if (project['data'][key]['test-size'] !== undefined) {
        test_size = project['data'][key]['test-size'];
    }
    jQuery('#test-size').val(test_size).trigger('input');
}

function registerTestType(project, key) {
    
    // Register change on test buttons
    jQuery('input[name=test-type]').change(function () {

        if ($(this).val() == 'new') {
            jQuery('#if-new').css('display', 'block');
            jQuery('#if-existing').css('display', 'none');
        }
        else if ($(this).val() == 'existing') {
            jQuery('#if-new').css('display', 'none');
            jQuery('#if-existing').css('display', 'block');
        }

        project['data'][key]['test-type'] = $(this).val();
    });

    // Set existing test type / default
    var test_type = 'new';
    if (project['data'][key]['test-type'] !== undefined) {
        test_type = project['data'][key]['test-type'];
    }
    jQuery('input[name=test-type][value="' + test_type + '"]').trigger('click').trigger('blur');
}

function registerTestSizeType(project, key) {
    
    //Register right click actions
    jQuery('#test-percent').on('click', function () {
        project['data'][key]['test-size-type'] = 'percent';
        jQuery('#test-size-append').empty();
        jQuery('#test-size-append').append(' (%)');

        var test_sz = jQuery('#test-size');
        test_sz.attr('step', "0.01");
        test_sz.attr('min', "0");
        test_sz.attr('max', "100");
    });

    jQuery('#test-abs').on('click', function () {
        project['data'][key]['test-size-type'] = 'abs';
        jQuery('#test-size-append').empty();
        jQuery('#test-size-append').append(' (#)');

        var test_sz = jQuery('#test-size');
        test_sz.attr('step', "1");
        test_sz.attr('min', "");
        test_sz.attr('max', "");
    });

    // Default choice is percent
    var test_size_type = 'percent';
    if (project['data'][key]['test-size-type'] !== undefined) {
        test_size_type = project['data'][key]['test-size-type'];
    };

    // Set saved / default
    jQuery('#test-'+test_size_type).click();
}

function registerTest(project, key) {

    // Register test size type
    registerTestSizeType(project, key);

    // Register test type
    registerTestType(project, key);

    // Register test size
    registerTestSize(project, key);

    // Register by value, file and add new strat
    registerSubjectsInput(key, project, 'test-space', changeTestFile);

    // On add new val
    registerAddNewVal();

    // Set val options
    registerBaseValidationSelect(project, key);

    // Register show val info
    jQuery('#' + key + '-show').on('click', function () {

        // Empty existing
        jQuery('#' + key + '-extra-dist-space').empty();

        // Load
        loadTest(project, key);
    });

    // Register hide
    jQuery('#' + key + '-hide').on('click', function () {
        hideOutput(key);
    });

    // Popovers
    registerPopovers();
}

//////////////
// Display //
////////////

function displayTestSplit(project) {

    // Hide everything
    hideAllProjSteps()

    // If already loaded
    if (jQuery('#body-test-split').html().length > 100) {
        jQuery('#body-test-split').css('display', 'block');

        // Refresh changable
        refreshTestRegisters(project);
        return;
    }

    // Default space
    var key = 'test-space';

    // If not init'ed yet, init
    if (project['data'][key] == undefined) {
        project['data'][key] = {};
    }

    // Add test as data type
    project['data'][key]['data_type'] = 'test';

    // Add + display html
    var html = getTestHTML(key)
    jQuery('#body-test-split').append(html);
    jQuery('#body-test-split').css('display', 'block');

    // Register all test behavior
    registerTest(project, key);
}

