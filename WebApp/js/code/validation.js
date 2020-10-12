///////////////////////////////
// Validation Specific HTML //
/////////////////////////////


function addIfSelRowHTML(key) {

    var strat_text = 'Select a variable (or combination) to stratify by. This choice represents the variable(s) value ' + 
    'in which to preserve the percentage of samples for each class. If multiple variables are selected, then ' +
    'the combination of the variables will be used, where the combinarion refers explicitly to the crosstab of unique values. ' +
    'For example, if sex and race are selected, then a new combination internal variable will be created with unique values for ' +
    'sex 1 race 1, sex 1 race 2, etc... and then stratifying behavior set on that combination.';

    var group_text = 'Select a variable (or combination) to preserve groups by. Note that if multiple variables are selected, ' +
    'the the unique overlap will first be computed, and then groups preserved by that value instead. Preserving groups ensures that ' +
    'samples with the same class value are always in the same validation fold as other samples with the same value.';
    
    var html = '' +
    
    '<div class="form-row">' +
    
    '<div id="'+key+'-if-stratify" class="form-group col-md-4" style="display:none">' +
    '<label for="'+key+'-stratify-by">' +
    '<span data-toggle="popover"' +
    'title="Stratify By" data-placement="top"' +
    'data-content="' + strat_text + '">' +
    'Stratify By <i class="fas fa-info-circle fa-sm"></i>' +
    '</span></label>' + 
    '<select id="'+key+'-stratify-by" class="form-control" data-width="100%" multiple="multiple"></select>' +
    '</div>' +

    '<div id="'+key+'-if-group" class="form-group col-md-4" style="display:none">' +
    '<label for="'+key+'-group-by">' +
    '<span data-toggle="popover"' +
    'title="Preserve Groups By" data-placement="top"' +
    'data-content="' + group_text + '">' +
    'Preserve Groups By <i class="fas fa-info-circle fa-sm"></i>' +
    '</span></label>' + 
    '<select id="'+key+'-group-by" class="form-control" data-width="100%" multiple="multiple"></select>' +
    '</div>' +
    
    '</div>';

    return html;
}


function addValidationHTML(key) {

    var val_type_label = '<label for="'+key+'-val-buttons"' +
    '><span data-toggle="popover"' +
    'title="Validation Split Behavior" data-placement="top"' +
    'data-content="This defines the behavior of this validation strategy. ' +
    'A validation strategy can be passed when defining a single split, such as a ' +
    'train test split, or in the context of repeated or K-fold splits used internally during ' +
    'a hyper-parameter search.' +
    'There are three distinct options, these are:<br><br>' +
    '<b>Random</b><br>' +
    'Random splits dictates that splits are made psuedo-randomly (according to the projects random seed)' +
    '<br><b>Stratify</b><br>' +
    'Stratifying splits dictates that splits preserve the relative class frequency of the selected Straify By variable(s). ' +
    'For example, if Sex was selected, and then used for a train test split, then the training set would have the same ratio of Males vs. Females ' +
    'as in the testing set.' +
    '<br><b>Group Preserving</b><br>' +
    'Group preserving behavior dictates that subjects with the same value according to the passed Preserve Groups By variable(s) ' +
    'should be preserved within the same fold. For example, if preserving group by site, then all subjects from a given site will always ' +
    'be in the same training or test fold with other subjects from that same site. This is useful when you dont want leakage from the training ' +
    'set to the validation/test set on some value, like site, as a way of more explicitly testing generalization. E.g., if group preserving on Sex ' +
    'then you would essentially be testing if a model trained on only Males could generalize to Females, and vice versa.' +
    '">' +
    'Validation Split Behavior <i class="fas fa-info-circle fa-sm"></i>' +
    '</span></label>';

    var i_label = "This option allows you to upload a file containing " +
                  "train only subjects. " + 
                  "Specifically, valid files should be text files containing " +
                  "one subject per line, and no header information.";

    var fs_label = "This option allows you to select train only subjects " +
                   "based on the value of a loaded Non-Input variable." +
                   "<br><b>Note:</b> Show must have been called on the Non-Input Variable " +
                   "in order for the values to appear. Also consider that when loading Non-Input " +
                   "Variables, they will not take into account any inclusions or exclusions";

    var file_input_label = getPopLabel(key, "Train-only Subjects from File ", i_label);
    var from_strat_label = getPopLabel(key, "Train-only Subjects by Non-Input Value ", fs_label);

    var html = '' +
    '<div class="form-row d-flex justify-content-between">' +
    '<div class="d-flex flex-column">' +

    val_type_label +
    '<div class="btn-group-toggle btn-group" data-toggle="buttons" ' +
    'data-toggle="buttons" id="'+key+'-val-buttons">' +

        '<label class="btn btn-secondary">' +
        '<input type="radio" name="'+key+'-val-type" value="random">Random</input>' +
        '</label>' +

        '<label class="btn btn-secondary">' +
        '<input type="radio" name="'+key+'-val-type" value="stratify">Stratify</input>' +
        '</label>' +

        '<label class="btn btn-secondary">' +
        '<input type="radio" name="'+key+'-val-type" value="group">Group Preserving</input>' +
        '</label>' +
    '</div>'+

    '</div>' +

    '<div class="d-flex flex-column form-group col-md-8">' +
    addSubjectsInputRowHTML(key, file_input_label, from_strat_label, 'tr_onlys') +
    '</div>' + 
    '</div>' +

    addIfSelRowHTML(key) +
    resultsHTML(key, 'Show Info');

    return html;
}

////////////////////////////////////
// Code for loading + validation //
//////////////////////////////////

function setValidationResults(output, key, project) {
    
    var html_table = output['html_table'];

    if (html_table.length > 0) {
        jQuery('#' + key + '-table').append(html_table);
        jQuery("#default-table-id").prop('id', key + '-real-table');

        $('#' + key + '-real-table').DataTable({
            "scrollY": 500,
            "searching": false,
            "paging": false,
            "info": false,
            "ordering": true,
            "preDrawCallback": function (settings) {
                pageScrollPos = document.documentElement.scrollTop;
            },
            "drawCallback": function (settings) {
                scrollTo(0, pageScrollPos);
            }
        });

        // Add some extra padding since no img dist
        jQuery('#'+key+'-table').css('padding-left', '50px');
    }
}

function getValParams(key, project) {

    if (key == 'Random') {
        return 'random';
    }

    var val_params = getBaseParams(key, project);

    // If a file
    var file_nm = val_params['file']
    if ((file_nm !== undefined) && (file_nm.length > 0)) {
        val_params['tr_onlys'] = {file_nm: project['files']['tr_onlys'][val_params['file']]}
    }

    // Get by value
    val_params['tr_only_by_val'] = checkByValEntry('', key, project);

    return val_params;
}

function registerChangeValType(key, project) {

    jQuery('input[name='+key+'-val-type]').change(function(){
       
        var options = ['random', 'stratify', 'group'];

        options.forEach(val => {
            var display = 'none';
            if ($(this).val() == val) {display = 'block'};
            jQuery('#'+key+'-if-'+val).css('display', display);
        });

        project['data'][key]['-val-type'] = $(this).val();
   });

    // Set existing project vals / default
    var val_type = 'random';
    if (project['data'][key]['-val-type'] !== undefined) {
        var val_type = project['data'][key]['-val-type'];
    }
    jQuery('input[name='+ key+'-val-type][value="'+val_type+'"]').trigger('click').trigger('blur');
   
}

function loadValidation(project, key) {

    var params = {}

    // Add the loading params
    params['loading_params'] = getAllLoadedDataParams(project);

    // All the val params
    params['val_params'] = getValParams(key, project);

    // Add target script
    params['script'] = 'load_validation.py';

    // Run job + display output
    runQuickPy(params, key, setValidationResults, project);
}

//////////////////////////////////////
// Code for registering validation //
////////////////////////////////////

function changeTrOnlyFile(key, project, file) {

    var fileName = file.split("\\").pop();
    changeFileText(key, fileName);

    // If non-empty clear any selected from strat val
    if (fileName.length > 0) {
        jQuery('#'+key+'-var-input').val(null).trigger('change');
    }

    // Refresh the train only files
    refreshTrainOnlyFiles(project)
}

function refreshValidationRegisters(project) {

    // Re-register vals for all val-spaces strat-stratify
    getAllKeys(project).forEach(key => {
        if (key.includes('val-space')) {
            registerVals(project, key, '-stratify');
            registerVals(project, key, '-group');
        }
    });

    // Refresh by val choices
    refreshByValueChoices('val-space', project);
}

function registerValidation(key, project, space, n) {

    // Register changable card name assoc. functions
    registerName(key, project);

    // Popovers
    registerPopovers();

    // Register changes to selected val type
    registerChangeValType(key, project);

    // Register by value, file and add new strat
    registerSubjectsInput(key, project, 'val-space', changeTrOnlyFile);

    // Register close button + update count
    var cnt_id = 'val-count';
    var cnt_field = 'n_val';
    registerCloseButton(space, key, n, cnt_field, cnt_id, project);
    updateCnt(project, space, cnt_field, cnt_id);

    // Register and set prev saved vals for strat + group
    registerVals(project, key, '-stratify');
    registerVals(project, key, '-group');

    // Register track index changes
    registerCard(key, project['data'][key]);

    // Register show val info
    jQuery('#' + key + '-show').on('click', function () {
        loadValidation(project, key);
    });

    // Register hide
    jQuery('#' + key + '-hide').on('click', function () {
        hideOutput(key);
    });
}

////////////////////
// Display + Add //
//////////////////

function addValidation(project, key=undefined) {

    var space = 'val-space'

    if (key !== undefined) {
        var n = addExistingSpace(space, project, key, 1);
    }
    else {
        var initInfo = initNewSpace(space, project);
        var key = initInfo[0];
        var n = initInfo[1];
    }

    // Adds a unique id if there isn't one defined already
    addUniqueID(key, project);

    // Add the validation HTML
    var html = addValidationHTML(key);

    // Add special input within card name
    var val_name = getCardNameHTML(key, "Custom validation strategy name");
    var card_html = cardWrapHTML(val_name, key, html, false, row_wrap=true);

    jQuery('#'+space).append(card_html);

    // Add tr onlys as data type
    project['data'][key]['data_type'] = 'tr_onlys';

    // Register all validation behavior
    registerValidation(key, project, space, n);

    return key;
}

function displayValidation(project) {

    // Hide everything
    hideAllProjSteps()

    // If already loaded
    if (jQuery('#body-val').html().length > 100) {
        jQuery('#body-val').css('display', 'block');

        // Also need to refresh changable vals from data loading
        refreshValidationRegisters(project);
        return;
    }

    // Reset loading val-space
    project['loading_spaces']['val-space'] = {
        'data_fields': Array(),
        'n_val': 0
    }

    // Base val HTML
    var html = '' +
    '<br>' +
    '<div id="val-space"></div>' +
    '<br>' +
    '<div class="form-row">' +
    '<div class="col-md-12">' +
        '<label style="padding-left: 5px">Add New:&nbsp</label>' +
        '<button class="btn btn-outline-secondary" id="add-val">Validation Strategy <span id="val-count" class="badge badge-light">0</span></button>' +
    '</div>' +
    '</div>';

    // Add + Display
    jQuery('#body-val').append(html);
    jQuery('#body-val').css('display', 'block');

    // Add any existing
    getAllKeys(project).forEach(key => {
        if (key.includes('val-space')) {
            var key = addValidation(project, key);

            // If no name, expand the card + set focus
            if (jQuery('#'+key+'-name').val().length == 0) {
                jQuery('#'+key+'-collapse').collapse("show");
                jQuery('#'+key+'-name').focus();
            }
        }
    });

    // If no previous
    if (project['loading_spaces']['val-space']['n_val'] == 0) {
        var key = addValidation(project);
        jQuery('#'+key+'-collapse').collapse("show");
        jQuery('#'+key+'-name').focus();
    }

    // Add new val
    jQuery('#add-val').on('click', function() {
        var key = addValidation(project);
        addScrollTo(key, 'add-val');
        jQuery('#'+key+'-name').focus();
    });
}


