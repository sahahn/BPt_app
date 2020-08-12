/////////////////////////////////////
// Card / space related registers //
///////////////////////////////////

function removeSpace(key, project) {
    // This function is for removing the associated spaces + stored 'data'
    // Takes care of sub-spaces too

    // Remove html
    jQuery('#'+key+'-space').remove();

    // Also try to remove space html
    jQuery('#'+key+'-tab').remove();

    // Remove loading spaces
    Object.keys(project['loading_spaces']).forEach(space => {
        if (space.startsWith(key)) {
            delete project['loading_spaces'][space];
        }
    });

    // Remove stored data
    getAllKeys(project).forEach(k => {
        if (k.startsWith(key)) {
            delete project['data'][k];

            // Try to remove edit params modal
            // It is not stored w/ space, so need seperate check + remove
            jQuery('#'+key+'-edit-popup').remove();
        }
    });


}

function refreshAllFilterInfo(project) {
    refreshFiles(['exclusions', 'inclusions'], 'filter-space', project);
}

function refreshTrainOnlyFiles(project) {

    refreshFiles(['tr_onlys'], 'val-space', project);
}

function registerCloseButton(space, key, n, cnt_field, cnt_id, project) {

    // Register close button
    jQuery('#'+key+'-remove').on('click', function() {

        // Delete space from project + html
        removeSpace(key, project)

        // Remove any open popovers
        jQuery('.popover').remove()

        // Update data space info (parent on whats being deleted)
        var data = project['loading_spaces'][space];
        data['data_fields'].splice(data['data_fields'].indexOf(n), 1);
        
        if (cnt_id !== undefined) {
            data[cnt_field] = data[cnt_field] - 1
            jQuery('#'+cnt_id).text(data[cnt_field]);
        }

        // Refresh incluson / exclusions if needed
        if (space == 'filter-space') {
            refreshAllFilterInfo(project);
        }

        if (space == 'val-space') {
            refreshTrainOnlyFiles(project);
        }

        // Refresh all by-val choices if strat closes
        if (space == 'strat-space') {
            console.log('close strat')
            refreshByValueChoices('filter-space', project);
        }

        // Make sure changes to data update in the project
        project['loading_spaces'][space] = data;
    });
}

function initNewSpace(space, project, key_ext='') {

    // Determine the name of the data variable
    var n = getFreeDataInd(project['loading_spaces'][space]['data_fields']);
    var key = space + '-' + n.toString() + key_ext;
    
    // Update data fields
    project['loading_spaces'][space]['data_fields'].push(n);

    // If this key doesn't exist in data yet
    if (project['data'][key] == undefined) {
        project['data'][key] = {};
    }

    return [key, n];
}

function addExistingSpace(space, project, key, back) {

    // Get n from passed key
    var split = key.split('-');
    var n = split[split.length-back]

    // Update data fields
    project['loading_spaces'][space]['data_fields'].push(n);

    return n;
}

function updateCnt(project, space, cnt_field, cnt_id) {
    project['loading_spaces'][space][cnt_field] = project['loading_spaces'][space][cnt_field] + 1;
    jQuery('#' + cnt_id).text(project['loading_spaces'][space][cnt_field]);
}

//////////////////////////////////
// Common getting params funcs //
////////////////////////////////

function getBaseParams(key, project) {
    
    var params = Object.assign({}, project['data'][key]);
    params['key'] = key;
    return params
}

function addBaseParams(key, params) {

    // Get input fields
    params['-eventname'] = jQuery('#'+key+'-eventname').val();
    params['-type'] = jQuery('input[name='+key+'-type]:checked').val();
    params['-drop-choice'] = jQuery('input[name='+key+'-drop-choice]:checked').val();
    params['-cat-encode-choice'] = jQuery('input[name='+key+'-cat-encode-choice]:checked').val();

    // Grab vals for each outlier option
    slider_keys.forEach(k => {
        params['-outlier-' + k] = jQuery('#'+key+'-outlier-' + k).prop("checked");
        params['-range-' + k] = jQuery('#'+key+'-range-' + k).val();
    });

    // Grab binary options
    params['-binary-choice'] = jQuery('input[name='+key+'-binary-choice]:checked').val();
    ['', 'L', 'U'].forEach(k => {
        params['-binary-threshold'+k] = jQuery('#'+key+'-binary-threshold'+k).val();
    });

    // Add key
    params['key'] = key;

    return params
}

function getAllLoadedDataParams(project) {

    var params = {}
    return addOtherLoadedParams('data-space', params, project);
}

function addOtherLoadedParams(key, params, project) {

    // Add settings, as this should be included with all data loading
    params['settings'] = settings;

    // Grab filter info -- only if not strat!
    if (!key.includes('strat-space')) {

        // Any non-strat should have the excl + incl
        params['exclusions'] = project['files']['exclusions'];
        params['inclusions'] =  project['files']['inclusions'];
        params['ex_inc_by_val'] = checkByVals(key, project, 'filter-space');

        // Any non-strat should also be passed all data variables, and sets
        // within set data variables are ignored here as they are passed within
        // their relevant set
        params['data_params'] = {};
        params['strat_params'] = {};
        params['target_params'] = {};

        getAllKeys(project).forEach(k => {

            // Make sure isn't current key
            if (k !== key) {
            
                // If not the current key, and has to be in data-space, but not include var-space
                if ((k.includes('data-space')) && (!k.includes('var-space'))) {

                    // If a variable
                    if (k.endsWith('-var')) {
                        if (validateVariable(k, project['data'][k])) {
                            params['data_params'][k] = getBaseParams(k, project);
                        }
                    }

                    // If a set
                    else if (k.endsWith('-set')) {
                        if (validateSet(k, project['data'][k])) {
                            params['data_params'][k] = getSetParams(k, project);
                        }
                    }
                }

                // If a strat var
                else if (k.includes('strat-space')) {
                    if (validateVariable(k, project['data'][k])) {
                        params['strat_params'][k] = getBaseParams(k, project);
                    }
                }

                // If a target variable
                else if (k.includes('target-space')) {
                    if (validateVariable(k, project['data'][k])) {
                        params['target_params'][k] = getBaseParams(k, project);
                    }
                }
            }
        });
    
    }

    return params;
}

/////////////////////////////////
// By Value related registers //
///////////////////////////////

function registerByValueCardName(key) {

    jQuery('#'+key+'-var-input').on('change', function() {

        if($(this).val().length > 0) {
            jQuery('#'+key+'-file-input').val('').trigger('change');
            jQuery('#'+key+'-header-text').append(':  <i>' + $(this).val() + ' = </i>');
        }
        else if (jQuery('#'+key+'-file-input').val().length == 0){
            jQuery('#'+key+'-header-text').empty();
        }
    });

    jQuery('#'+key+'-var-val').on('change', function() {
        jQuery('#'+key+'-header-text').empty();

        if($(this).val().length > 0) {
            jQuery('#'+key+'-header-text').append(':  <i>' + jQuery('#'+key+'-var-input').val() + ' = ' + $(this).val() + '</i>');
        }
        else {
            jQuery('#'+key+'-header-text').append(':  <i>' + jQuery('#'+key+'-var-input').val() + ' = </i>');
        }        
    });
}

function refreshByValueChoices(include_key, project) {

    getAllKeys(project).forEach(key => {
        if (key.includes(include_key)) {

            // First save the existing already selected options if any
            var choice_name = jQuery('#'+key+'-var-input').find('option:selected').val();
            var choice_val = jQuery("#"+key+"-var-val").find('option:selected').val();

            // Reset the options w/ new vals
            registerByValueChoices(key, project);

            // Check if the original options are still valid
            // and change the value back to that if so
            var choices = project['strat_choices']

            if (choice_name in choices) {
                jQuery('#'+key+'-var-input').val(choice_name).trigger('change');
    
                // Further, make sure the choice_val is still valid
                if (choices[choice_name].includes(choice_val)) {
                    jQuery('#'+key+'-var-val').val(choice_val).trigger('change');
                }
            }
            else {
                jQuery('#'+key+'-var-input').val(null).trigger('change');
            }
        }
    });
}

function refreshStratChoices(project) {

    // Strat choices are added when show is called on strat variables
    // this check is essentially just for checking which ones to remove
    // based on either if they got deleted, or maybe the name/eventname changed
    var valid = [];
    getSubSpaceKeys('strat-space', project).forEach(strat_key => {
        var var_name = jQuery('#'+strat_key+'-input').val();

        if (var_name.length > 0) {

            // Get repr name not base name
            var eventname = jQuery('#'+strat_key+'-eventname').val();
            var repr_name = getReprName(var_name, eventname);
            valid.push(repr_name);
        }
    });

    var existing = Object.keys(project['strat_choices'])
    existing.forEach(r_name => {
        if (!valid.includes(r_name)) {
            delete project['strat_choices'][r_name];
        }
    });
}

function registerByValueChoices(key, project) {

    refreshStratChoices(project);
    var choices = project['strat_choices']

    // Set the options for Non-Input vars
    jQuery("#"+key+"-var-input").empty();
    jQuery("#"+key+"-var-input").append('<option item=""></option>');
    Object.keys(choices).forEach(k => {
        jQuery("#"+key+"-var-input").append('<option item="' +
        k + '">' + k + '</option>');
    });

    // Init select2
	jQuery("#"+key+"-var-input").select2({
        placeholder: "Non-Input Variable",
        allowClear: true
    });

    // Init choice of value with disabled + nothing
    var val = jQuery("#"+key+"-var-val");
    val.empty();

    val.select2({
        placeholder: "Value",
        allowClear: true
    });

    val.prop("disabled", true);
}

function registerValueOnChoice(key, project) {

    // Register on associated var input change
    jQuery("#" + key + "-var-input").on('change', function () {
        
        // Get choices
        var choices = project['strat_choices']

        var val = jQuery("#"+key+"-var-val");
        val.empty();
        val.append('<option item=""></option>');
        var choice_name = $(this).find('option:selected').val();
        if ((choice_name !== undefined) && (choice_name.length > 0)) {
            var c = choices[choice_name];
            for (var i = 0; i < c.length; i++) {
                val.append('<option item="' +
                    c[i].toString() + '">' + c[i].toString() + '</option>');
            }
            val.prop("disabled", false);
        }
        else {
            val.prop("disabled", true);
        }
        // Re-init select2 options
        val.select2({
            placeholder: "Variable Value",
            allowClear: true
        });
    });
}

function checkByVals(input_key, project, space) {
    
    // Check if any exclusions / inclusions have any selected
    // non-input variables
    var by_vals = [];
    
    getSubSpaceKeys(space, project).forEach(key => {

        var entry = checkByValEntry(input_key, key, project);
        if (entry !== undefined) {
            by_vals.push(entry);
        }

    });

    return by_vals;
}

function getStratReprToKey(project) {

    var repr_to_key = {};

    getSubSpaceKeys('strat-space', project).forEach(key => {
        var name = jQuery('#'+key+'-input').val()
        var eventname = jQuery('#'+key+'-eventname').val()
        var repr_name = getReprName(name, eventname);

        repr_to_key[repr_name] = key;
    });

    return repr_to_key;
}

function checkByValEntry(input_key, key, project) {

    var repr_to_key = getStratReprToKey(project);

    // Get selected strat var + val
    var choice_name = jQuery('#'+key+'-var-input').find('option:selected').val();
    var choice_val = jQuery("#"+key+"-var-val").find('option:selected').val();

    // Only add if both a var and a value are selected
    if (choice_name.length > 0 && choice_val.length > 0) {

        // Get type from data saved w/ file input
        var filter_type = jQuery('#'+key+'-file-input').attr('data-type');

        // Get the selected var's associated key
        var strat_key = repr_to_key[choice_name];

        // Make sure this var isn't the input key
        if (strat_key !== input_key) {

            // Create by vals array entry
            var entry = {};
            entry['params'] = getBaseParams(strat_key, project);
            entry['value'] = choice_val
            entry['filter_type'] = filter_type

            return entry;
        }
    }

    return undefined;
}

function setProjectByVals(project, key, space) {
    
    // Set existing by vals ifg any
    if (project['data'][key]['-var-input'] !== undefined) {
        if (project['data'][key]['-var-input'].length > 0) {
            
            jQuery('#'+key+'-var-input').val(project['data'][key]['-var-input']).trigger('change');

            if (project['data'][key]['-var-val'] !== undefined) {
                jQuery('#'+key+'-var-val').val(project['data'][key]['-var-val']).trigger('change');
            }
            refreshByValueChoices(space, project);
        }
    }
}

function saveByValueToProject(key, project) {

    jQuery('#'+key+'-var-input').on('change', function() {
        project['data'][key]['-var-input'] = $(this).val();
    });

    jQuery('#'+key+'-var-val').on('change', function() {

        if ($(this).val() == undefined) {
            project['data'][key]['-var-val'] = undefined
        }
        else {
            project['data'][key]['-var-val'] = $(this).val().toString();
        }
    });
}

function registerBaseByValue(key, project, space) {

    // Register / init by value choices and change of choices
    // on selection of first choice
    registerByValueChoices(key, project);
    registerValueOnChoice(key, project);

    // Changes made should be saved to project data
    saveByValueToProject(key, project);

    // Set any existing
    setProjectByVals(project, key, space);
}

function registerSubjectsInput(key, project, space, changeFileFunc) {

    // Register the base by val behavior
    registerBaseByValue(key, project, space);

    // Register base file funcs
    registerBaseFile(key, project, changeFileFunc);

    // Register add new strat var
    registerAddNewStratVar(key, project);
}

/////////////////////////////
// Proc File related code //
////////////////////////////


function registerAddChangeFileProject(key, project) {
    
    jQuery('#'+key+'-file-input').on("change", function() {
        
        // Save file to project
        var file = $(this).val();
        project['data'][key]['file'] = file;
    
    });
}

function changeFileText(key, fileName) {

    var file_txt = fileName
    if (fileName.length == 0) {
        file_txt = '<i>Choose a file</i>'
    }

    jQuery('#'+key+'-file-input').siblings(".custom-file-label").addClass("selected").html(file_txt);
}

function removeInvalidFiles(fields, valid, project) {

    fields.forEach(f_type => {

        // Get the array of already loaded files
        var loaded = Object.keys(project['files'][f_type]);
    
        loaded.forEach(f => {
            if (!valid[f_type].includes(f)) {
                delete project['files'][f_type][f]
            }
        });
    });
}

function loadFile(key, project) {

    var file = jQuery('#'+key+'-file-input');

    // If file is undefined, or file val, skip
    if (file == undefined) {
        return undefined;
    }
    else if (file.val() == undefined) {
        return undefined;
    }

    var filter_type = file.attr('data-type');

    // If already loaded/ stored, don't re-load
    if (Object.keys(project['files'][filter_type]).includes(file.val())) {
        return undefined;
    }

    // If non-empty file, load + save to correct spot in project
    if (file.val().length > 0) {

        var fr = new FileReader();
        fr.readAsText(file[0].files[0]);

        $(fr).on('load', function() {
            project['files'][filter_type][file.val()] = fr.result;
        });
    }
}

function refreshFiles(types, include_key, project) {
    
    // Init empty valid
    var valid = {}
    types.forEach(t => {
        valid[t] = Array();
    });

    // Go through all the data keys, filter by include key
    getAllKeys(project).forEach(key => {
        if (key.includes(include_key)) {

            // Try to load the file
            loadFile(key, project);

            var file_val = undefined;
            var filter_type = undefined;
            var file = jQuery('#'+key+'-file-input');

            // Get the file val
            if ((project['data'][key]['file'] !== undefined) && (project['data'][key]['file'].length > 0)) {
                file_val = project['data'][key]['file']
                filter_type = project['data'][key]['data_type'];
            }
            else if ((file !== undefined) && file.val() !== undefined) {

                // If non-empty file, 
                if (file.val().length > 0) {
                    filter_type = file.attr('data-type');
                    file_val = file.val();
                }
            }

            if (file_val !== undefined) {
                valid[filter_type].push(file_val);
            }
        }
    });

    // Remove any invalid files
    removeInvalidFiles(types, valid, project);
}

function registerBaseFile(key, project, changeFileFunc) {

    // Register clear file on by val non-zero input
    jQuery('#'+key+'-var-input').on('change', function() {
        if($(this).val().length > 0) {
            jQuery('#'+key+'-file-input').val('').trigger('change');
        }
    });

    // Register save changes to file to project
    registerAddChangeFileProject(key, project);

    // Register changes file
    jQuery('#'+key+'-file-input').on("change", function() {
        var file = $(this).val();
        changeFileFunc(key, project, file);
    });

    // Set existing file if any
    if (project['data'][key]['file'] !== undefined) {
        changeFileFunc(key, project, project['data'][key]['file']);
    }
}

/////////////////////////////////
// Changeable card name code ///
////////////////////////////////

function getCardNameHTML(key, placeholder) {

    var html = '<div class="col col-md-4"><input autocomplete="off" type="text" ' +
                'class="form-control input-sm" size="40" id="'+key+'-name"' +
                'placeholder="'+placeholder+'" value="" ' +
                'style="background-color:rgba(0,0,0,.05); border:none"></div>';
    return html;
}

function registerName(key, project) {

    // If click on input within card, don't trigger card toggle
    jQuery('#'+key+'-name').on('click', function(e) {
        e.stopPropagation();
    });

    // Save name to project
    jQuery('#'+key+'-name').on('change', function() {
        project['data'][key]['-name'] = $(this).val();
    });

    // If val name saved, set
    if (project['data'][key]['-name'] !== undefined) {
        jQuery('#'+key+'-name').val(project['data'][key]['-name']);
    }
}

/////////////////////////////////////////
// Register Vals for CV options code ///
///////////////////////////////////////

function getValidCatVars(k_iden, project, duplicates=Array()) {

    var valid = Array();

    // Init first option as empty
    valid.push({"id": '',"text": ''});

    // Seperate by type of var, and must be valid and categorical / binary
    getAllKeys(project).forEach(k => {


        // If variable type
        if (((k.includes('target-space')) && (k_iden !== '-group')) || (k.includes('strat-space'))) {
            if (validateVariable(k, project['data'][k])) {
                if (project['data'][k]['-type'] !== 'float') {
                    var reprName = getVarReprName(k, project);

                    // In the case of multiple loaded variables, add extra identifier
                    if (duplicates.includes(reprName)) {

                        var v_type = 'non-input';
                        if (k.includes('target-space')) {
                            v_type = 'target';
                        }

                        reprName  = reprName + ' (' + v_type + ')';
                    }

                    valid.push({
                        "id": k,
                        "text": reprName
                    });
                }
            }
        }
    
    });

    return valid;
}

function getValidCatVarsOptions(k_iden, project) {

    // Wrap getting all valid vars in a check
    // for duplicate names, if any duplicates
    // add extra identifiers for just those duplicates
    var valid = getValidCatVars(k_iden, project);
    var just_names = valid.map(x => x['text']);
    var duplicates = findDuplicates(just_names);

    if (duplicates.length > 0) {
        return getValidCatVars(k_iden, project, duplicates);
    }

    return valid;
}

function registerVals(project, key, k) {

    // Remove previous
    jQuery('#'+key+k+'-by').off('change');

    // Setup select2 for variable choice
    jQuery('#'+key+k+'-by').empty().select2({
        placeholder: "Variable",
        data : getValidCatVarsOptions(k, project)
    });

    // Register by choice save to project
    jQuery('#'+key+k+'-by').on('change', function() {

        var data = jQuery('#'+key+k+'-by').select2('data');
        project['data'][key][k+'-by'] = data.map(d => d['id']);
        project['data'][key][k+'-text'] = data.map(d => d['text']);
    });

    // Set any existing saved project vals
    setProjectVals(project, key, k);
}

function setProjectVals(project, key, k) {
    
    if (project['data'][key][k+'-by'] !== undefined) {
        
        var ids = project['data'][key][k+'-by'];
        var text = project['data'][key][k+'-text'];
        
        // Try to trigger select
        var choices = jQuery('#'+key+k+'-by');
        choices.val(ids).trigger('change');
        
        // As this is based on key, check to make sure the actual variable
        // is the same, in the case that the old selection was deleted and/or changed
        // and then the key filled in with a new one.
        var new_data = jQuery('#'+key+k+'-by').select2('data');
        var new_text = new_data.map(d => d['text']);
    
        if ((new_text !== undefined) && (text !== undefined)) {

            var to_replace = [' (target)', ' (non-input)'];
            
            var match_text = []
            text.forEach(txt => {
                to_replace.forEach(r => {
                    txt = txt.replace(r, '');
                });
                match_text.push(txt);
            });

            // For each new choice make sure it is valid
            var valid_ids = [];
            new_data.forEach(d => {
                var n = d['text'];

                to_replace.forEach(r => {
                    n = n.replace(r, '');
                });

                if (match_text.includes(n)) {
                    valid_ids.push(d['id']);
                }
            });

            // Update choices with only valid ids
            choices.val(valid_ids).trigger('change');
        }
    }
}

//////////////////////////////////////////
// Choice of validation strategy code ///
////////////////////////////////////////

function getValStratOptions(project) {

    var valid = Array();

    // Init first option as empty, second as fixed Random option
    valid.push({"id": '',"text": '', "key": ''});
    valid.push({"id": 'Random', "text": 'Random Splits', "key": 'Random'});

    // Get validation strats
    getAllKeys(project).forEach(k => {

        // Must be a a valid option
        if (k.includes('val-space')) {
            if (validateValidation(k, project['data'][k])) {

                valid.push({
                    "id": project['data'][k]['id'],
                    "key": k,
                    "text": project['data'][k]['-name']
                });

            }
        }
    });

    return valid;
}

function registerBaseValidationSelect(project, key) {

    var val_strat = jQuery('#'+key+'-val-strategy');

    // Clear previous
    val_strat.off('change');

    // Register the select2 choices
    val_strat.empty().select2({
        placeholder: "Validation Split Strategy",
        data: getValStratOptions(project)
    });

    // Saves values on change
    val_strat.on('change', function () {
        var s_data = $(this).find('option:selected').data()['data'];
        project['data'][key]['val-strategy-id'] = s_data['id'];
        project['data'][key]['val-strategy-key'] = s_data['key'];
    });

    // Set saved val - make sure previously selected id still exists though
    if (project['data'][key]['val-strategy-id'] !== undefined) {
        var val_strats = getValStratOptions(project);

        // If found updates the key too, if changed
        val_strats.forEach(strat => {
            if (strat['id'] == project['data'][key]['val-strategy-id']) {
                val_strat.val(strat['id']).trigger('change');
            }
        });
    }

    // Otherwise init with random splits
    else {
        val_strat.val('Random').trigger('change');
    }
}

//////////////////////////////////////////////
// Full splits row registrations combined ///
////////////////////////////////////////////

function registerSplitType(key, project) {

    // Register shows
    jQuery('#' + key + '-kfold').on('click', function () {
        project['data'][key]['split-type'] = 'kfold';
        jQuery('#' + key + '-split-type-name').empty().append('K-Fold');
        jQuery('#' + key + '-if-kfold').css('display', 'block');
        jQuery('#' + key + '-if-single').css('display', 'none');
        jQuery('#' + key + '-group-by').next().hide();
        jQuery('#' + key + '-show-val-strat').css('display', 'block');
        jQuery('.' + key + '-show-repeats').css('display', 'block');
    });

    jQuery('#' + key + '-single').on('click', function () {
        project['data'][key]['split-type'] = 'single';
        jQuery('#' + key + '-split-type-name').empty().append('Single Split');
        jQuery('#' + key + '-if-kfold').css('display', 'none');
        jQuery('#' + key + '-if-single').css('display', 'block');
        jQuery('#' + key + '-group-by').next().hide();
        jQuery('#' + key + '-show-val-strat').css('display', 'block');
        jQuery('.' + key + '-show-repeats').css('display', 'block');
    });

    jQuery('#' + key + '-group').on('click', function () {
        project['data'][key]['split-type'] = 'group';
        jQuery('#' + key + '-split-type-name').empty().append('Leave-Out Group');
        jQuery('#' + key + '-if-kfold').css('display', 'none');
        jQuery('#' + key + '-if-single').css('display', 'none');
        jQuery('#' + key + '-group-by').next().show();
        jQuery('#' + key + '-show-val-strat').css('display', 'none');
        jQuery('.' + key + '-show-repeats').css('display', 'none');
    });

    // Set k-fold as default splits
    if (project['data'][key]['split-type'] == undefined) {
        project['data'][key]['split-type'] = 'kfold';
    }

    // Set default / project saved
    jQuery('#'+key+'-'+project['data'][key]['split-type']).click();
}

function registerSplitsRow(key, project) {

    // Register leave-out-group option
    registerVals(project, key, '-group');

    // On add new val
    registerAddNewVal(key, project);

    // Set val options
    registerBaseValidationSelect(project, key);

    // Register split num fields
    registerNumField(key, project, '-if-kfold', '5');
    registerNumField(key, project, '-if-single', '.2');
    registerNumField(key, project, '-repeats', '1');

    // Register show + default split type
    registerSplitType(key, project);
}

///////////////
// Helpers ///
/////////////

function getAllInputChoices(project) {

    // Init as empty arrays
    var sep = {
        'by_type_choices': [],
        'set_choices': [],
        'set_var_choices': [],
        'data_var_choices': [],
        'strat_var_choices': [],
        'target_choices': []
    };

    // By type
    sep['by_type_choices'].push({"id": 'all', "text": 'All'});
    sep['by_type_choices'].push({"id": 'float', "text": 'Continuous'});
    sep['by_type_choices'].push({"id": 'cat', "text": 'Categorical'});

    getAllKeys(project).forEach(k => {
        
        // If set
        if (k.endsWith('-set')) {
            if (validateSet(k, project['data'][k])) {
                sep['set_choices'].push({
                    'id': k,
                    'text': project['data'][k]['-input'],
                });

                // Also get all set variables
                var set_vars = getSetVarsFromId(project['data'][k]['-data-sets']);
                set_vars.forEach(v => {
                    
                    sep['set_var_choices'].push({
                        'id': 'set-var-'+set_vars.indexOf(v).toString(),
                        'text': getReprName(v, project['data'][k]['-eventname'])
                    });

                });
            }
        }

        // If data variable
        else if ((!k.includes('-var-space')) && (k.endsWith('-var'))) {
            if (validateVariable(k, project['data'][k])) {

                sep['data_var_choices'].push({
                    'id': k,
                    'text': getVarReprName(k, project)
                });
            }
        }

        // If strat variables
        else if (k.includes('strat-space')) {
            if (validateVariable(k, project['data'][k])) {

                sep['strat_var_choices'].push({
                    'id': k,
                    'text': getVarReprName(k, project)
                });
            }
        }

        // If a target variable
        else if (k.includes('target-space')) {
            if (validateVariable(k, project['data'][k])) {

                sep['target_choices'].push({
                    'id': k,
                    'text': getVarReprName(k, project)
                });
            }
        }

    });

    return sep;

}


/////////////
// Misc. ///
///////////

function getMetricChoices(target_type) {
    
    var metrics = ML_options['metrics'];
    var choices = [''];

    Object.keys(metrics[target_type]).forEach(metric => {

        choices.push({
            'id': metric,
            'text': metric
        });
    });

    return choices;
}