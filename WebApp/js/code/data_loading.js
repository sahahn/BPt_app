// Global vars

var sets = [];
var v_cache;
var v_real_cache;
var slider_keys = ["percent", "std", "cat", "percent-cat", "std-cat"];

////////////////////
// Set functions //
//////////////////

function getAllSets(project) {
    jQuery.getJSON('php/getSets.php', { "action": "get",
                                        "dataset": project['dataset']}, function(data) {
	    sets = data;
    });
}

function getSetVarsFromId(set_id) {

    var variables = [];
	for (se_idx in sets) {
	    var set = sets[se_idx];
	    if (set['id'] == set_id) {
		variables = set['variables'];
	    }
    }

    return variables;
}

function getAllSetVars(key) {

    var set_id = jQuery("#"+key+"-data-sets").find('option:selected').attr('item');
    return getSetVarsFromId(set_id);
}

////////////////////////
// Input cache funcs //
//////////////////////

function getInputCache() {
    
    jQuery.getJSON('php/get_json_in_cache.php', {'loc': 'input_cache.json'}, function(data) {
        v_real_cache = data;
    });
}

function checkInputInCache(v_type, in_name) {

    // Only works if v_cache done loading
    if (v_cache !== undefined) {
        if(typeof(v_cache[v_type]) !== "undefined") {
            var name = v_cache[v_type][in_name];
            if (typeof(name) !== "undefined") {
                return name;
            }
        }
    }

    return undefined;
}

function checkInputCache(v_type, name) {
    var cache = checkInputInCache(v_type, name);

    if (cache !== undefined) {
        top_vals = {}
        Object.keys(cache).forEach(k => {
            var val = Object.keys(cache[k]).reduce(function(a, b){
                return cache[k][a] > cache[k][b] ? a : b });
            top_vals[k] = val;
        });
        return top_vals;
    }
    return undefined;
}

function registerVariableCache(key, v_type) {
    
    jQuery("#"+key+"-input").on('change', function()  {
        var col_name = $(this).val();

        // If non empty input passed
        if ((col_name !== undefined) && (col_name !== null)) {
            if (col_name.length > 0) {

                // Check the variable cache for top used associated keys, and if any replace w/ those values for default
                var top_keys = checkInputCache(v_type, col_name);
                if (top_keys !== undefined) {
                    updateInputField(key, top_keys);
                    $(this).focus();
                }
            }
        }
    });
}

function registerSetCache(key, v_type) {
    
    jQuery("#"+key+"-data-sets").on('change', function () {
        var set_name = $(this).find('option:selected').val();

        // If non empty input passed
        if (set_name.length > 0) {

            // Check the input cache for top used associated keys with this set name
            // and if any replace w/ those values for default
            var top_keys = checkInputCache(v_type, set_name);
            if (top_keys !== undefined) {
                updateInputField(key, top_keys)
                $(this).focus();
            }
        }
    });
}

/////////////////////////////
// Loading + display dist //
///////////////////////////

function getSetParams(key, project) {

    // Grab essentially a copy of whats stored in project data
    var params = getBaseParams(key, project);

    // Get contents of set and add to params as data-sets,
    // such that -data-sets is the set id and data-sets is the array
    // of variable names
    params['data-sets'] = getSetVarsFromId(params['-data-sets'])
    
    // Check if any sub-spaces and add those names
    params['set-vars'] = [];
    if (project['loading_spaces'][key+'-var-space'] !== undefined) {
        
        getSubSpaceKeys(key+'-var-space', project).forEach(k => {
            params['set-vars'].push(getBaseParams(k+'-var', project));
        });
    }

    return params;
}

function loadVariable(key, script, project) {

    // Grab all needed params to pass to BPt
    var params = getBaseParams(key, project);

    // Add extra params
    params = addOtherLoadedParams(key, params, project);
    
    // add script to params
    params['script'] = script

    // Send the job + proc results
    runQuickPy(params, key, setVariableResults, project);
}

function loadSet(key, script, project) {

    // Get the base set params
    var params = getSetParams(key, project);

    // Add base param vals
    params = addOtherLoadedParams(key, params, project);

    // add script to params
    params['script'] = script

    // Send the job + proc results
    runQuickPy(params, key, setSetResults, project);
}

function setVariableResults(output, key, project) {

    // Set table
    jQuery('#'+key+'-table').append(output['html_table']);
    jQuery("#default-table-id").prop('id', key+'-real-table');

    // Get the dist image
    jQuery.get('php/get_image.php', {
               'loc': output['img_loc']},
        function(output){
            jQuery('#'+key+'-dist').append('<div>' + 
                   '<img draggable="false" id="'+key+'-img" style="max-width:600px;" class="img-fluid" src="data:image/png;base64,' +
                    output + '">' + '</div>');

            jQuery('#'+key+'-img').on('load', function () {
                var img_height = jQuery('#' + key + '-img').height();
                
                var original_height = jQuery('#' + key + '-table').height();
                var scroll_y_val = img_height-60;
                if ((original_height - 60) < img_height) {
                    scroll_y_val = '';
                }

                var orderable = true;
                if (jQuery('input[name='+key+'-type]:checked').val() == 'float') {
                    orderable = false;
                }

                var table = $('#'+key+'-real-table').DataTable({
                    "scrollY": scroll_y_val,
                    "searching": false,
                    "paging": false,
                    "info": false,
                    "ordering": orderable
                });

                // Add index vals only if strat
                if (key.includes('strat-space')) {
                    var index_col = table.columns(0).data().eq(0).unique();

                    var var_name = jQuery('#'+key+'-input').val();
                    var eventname = jQuery('#'+key+'-eventname').val();
                    var repr_name = getReprName(var_name, eventname);
                    project['strat_choices'][repr_name] = Array.from(index_col).map(String);

                    print('3' + project['strat_choices']);

                    // Add new option
                    refreshByValueChoices('filter-space', project);
                }
            });
        });

    jQuery('#'+key+'-show').blur();
}

function setSetResults(output, key, project) {

    // Set table
    jQuery('#'+key+'-table').append(output['html_table']);
    jQuery("#default-table-id").prop('id', key + '-real-table');

    var original_height = jQuery('#' + key + '-table').height();
    var scroll_y_val = 500;
    if (original_height < 440) {
        scroll_y_val = '';
    }

    $('#'+key+'-real-table').DataTable({
        "scrollY": scroll_y_val,
        "scrollX": true,
        "searching": true,
        "paging": true,
        "info": true,
        "columnDefs": [
            { "orderable": false, "targets": -1}]
    });

    // Set register every time table drawn
    jQuery('#'+key+'-real-table').on('draw.dt', function() {

        // Remove any previous
        jQuery('.edit-set-button').off('click');

        // Add edit sub-space
        jQuery('.edit-set-button').on('click', function() {

            var data = $(this).data();

            // Replace name w/ base name
            var base_name = getBaseName(data['name']);

            // Check if show already open for this variable
            var already_open = [];
            project['loading_spaces'][key+'-var-space']['data_fields'].forEach(n => {
                already_open.push(jQuery('#'+key+'-var-space-'+n+'-var-input').val());
            });

            if (!already_open.includes(base_name)) {

                // Add new variable
                var new_key = addDataVariable(project, key+'-var-space');

                // Grab current set params
                var set_base_params = {'-input': base_name};
                set_base_params = addBaseParams(key, set_base_params);

                // Update the new variable field with the current params
                updateInputField(new_key, set_base_params);

                // Unwrap and scroll to
                addScrollTo(new_key, key+'-body-card');

                // Disable input and eventname, as these are not allowed to change
                disableSetVar(new_key);
            }
        });
    });

    // Trigger init once
    jQuery('#'+key+'-real-table').trigger('draw.dt');
    jQuery('#'+key+'-show').blur();
}

/////////////////////////////
// Data Loading utilities //
///////////////////////////


function updateMultiChoicesField(key, stem, existing) {
    
    ['', 'L', 'U'].forEach(k => {
        if (existing[stem+k] !== undefined){
            if (existing[stem+k].length > 0) {
                jQuery('#'+key+stem+k).val(existing[stem+k]).trigger('input');
            }
        }
    });
}

function updateInputField(key, existing) {

    // Input for set
    if (existing['-data-sets'] !== undefined) {
        setSet(jQuery('#'+key+'-data-sets'), existing['-data-sets']);
    }

    // In the case that a set is saved, don't set input, as this is just the set name
    // If not a set though, try to set the input if undefined
    else if (existing['-input'] !== undefined) {
        var selectInput = jQuery('#'+key+'-input');
        var option = new Option(existing['-input'], existing['-input'], true, true);
        selectInput.append(option).trigger('change');
    }
    
    // Eventname
    if (existing['-eventname'] !== undefined) {
        jQuery('#'+key+'-eventname').val(existing['-eventname']).trigger('change');
    }
    else {
        jQuery('#'+key+'-eventname').trigger('change');
    }

    // Data type
    if (existing['-type'] !== undefined) {
        jQuery('input[name=' + key + '-type][value="' + existing['-type'] + '"]').trigger('click');
    }
    
    // Outliers w/ sliders
    slider_keys.forEach(k => {

        if (existing['-outlier-' + k] !== undefined) {
            
            // Be careful with return str bool
            var bool_val = ((existing['-outlier-' + k] === "true") || (existing['-outlier-' + k] === true));
            jQuery('#' + key + '-outlier-' + k).prop("checked", bool_val).trigger('change');
        }

        // Update outliers
        updateMultiChoicesField(key, '-range-'+k, existing);
    });

    // Drop NaN button
    if (existing['-drop-choice'] !== undefined) {
        jQuery('input[name=' + key + '-drop-choice][value="' + existing['-drop-choice'] + '"]').trigger('click');
    }

    // Binary choices
    if (existing['-binary-choice'] !== undefined) {
        jQuery('input[name=' + key + '-binary-choice][value="' + existing['-binary-choice'] + '"]').trigger('click');
    }
    
    // Binary input vals
    updateMultiChoicesField(key, '-binary-threshold', existing);

    // Cat choices
    if (existing['-cat-choice'] !== undefined) {
        jQuery('input[name=' + key + '-cat-choice][value="' + existing['-cat-choice'] + '"]').trigger('click');
    }
    if (existing['-cat-bins'] !== undefined) {
        jQuery('#'+key+'-cat-bins').val(existing['-cat-bins']).trigger('change');
    }
    if (existing['-cat-bin-strat'] !== undefined) {
        jQuery('#'+key+'-cat-bin-strat').val(existing['-cat-bin-strat']).trigger('change');
    }

}

function disableSetVar(k) {
    jQuery('#'+k+'-input').attr("disabled", true);
    jQuery('#'+k+'-eventname').attr("disabled", true);
    jQuery('#'+k+'-drop-buttons').removeAttr('data-toggle');
    jQuery("#"+k+'-drop-choice-true').addClass("disabled")
    jQuery("#"+k+'-drop-choice-false').addClass("disabled")    
}

function undisableSetVar(k) {
    jQuery('#'+k+'-input').attr("disabled", false);
    jQuery('#'+k+'-eventname').attr("disabled", false);
    jQuery('#'+k+'-drop-buttons').attr("data-toggle", "buttons")
    jQuery("#"+k+'-drop-choice-true').removeClass("disabled")
    jQuery("#"+k+'-drop-choice-false').removeClass("disabled")    
}

function updateVariableCardName(key) {

    var col_name = jQuery("#"+key+"-input").val();
    jQuery('#'+key+'-header-text').empty();

    if ((col_name !== undefined) && (col_name !== null)) {
        if (col_name.length > 0) {
            var eventname = jQuery('#'+key+'-eventname').val();
            var repr_name = getReprName(col_name, eventname);
            jQuery('#'+key+'-header-text').append(':  <i>' + repr_name + '</i>');
        }
    }
}

function updateSetCardName(key) {
    
    var set_name = jQuery("#"+key+"-data-sets").find('option:selected').val();
    jQuery('#' + key + '-header-text').empty();
    
    if (set_name.length > 0) {
        var eventname = jQuery('#'+key+'-eventname').val()
        var repr_name = getReprName(set_name, eventname, true);
        jQuery('#' + key + '-header-text').append(':  <i>' + repr_name + '</i>');
    }
}

function getSetName(set){
    return set['name'] + ' (' + set['variables'].length + ')'
}

function setSet(data_sets, set_id) {
    
    // Check and see if the set_id exists
    for (se_idx in sets) {

        // If any are a match set
        if (sets[se_idx]['id'] == set_id) {
            data_sets.val(getSetName(sets[se_idx])).trigger('change');
        }
    }
}

function refreshAllSets(project) {
    jQuery.getJSON('php/getSets.php', { "action": "get", "dataset": project['dataset']}, function(data) {
        
        sets = data;
        getSubSpaceKeys('data-space', project).forEach(key => {

            if (project['data'][key + '-set'] !== undefined) {
                var key = key + '-set';

                // First record current set choice if any
                var data_sets = jQuery("#"+key+"-data-sets")
                var set_id = data_sets.find('option:selected').attr('item');

                // Refresh and register changed data-sets
                jQuery("#"+key+"-data-sets").empty();
                registerSetChoices(key);

                // Check and see if the previously selected set ID still exists
                setSet(data_sets, set_id);
            }
        });
    });
}

function changeExIncFile(key, project, file) {

    var fileName = file.split("\\").pop();
    changeFileText(key, fileName);

    // If non-empty
    if (fileName.length > 0) {
        
        // Clear any selected from strat val
        jQuery('#'+key+'-var-input').val(null).trigger('change');

        jQuery('#'+key+'-header-text').empty();
        jQuery('#'+key+'-header-text').append(':  <i>' + fileName + '</i>');
        
    } 
    else {
        jQuery('#'+key+'-header-text').empty();
    } 

    // Refresh inclusions / exclusions on new
    refreshAllFilterInfo(project);
}

//////////////////////////
// Input registrations //
////////////////////////

function registerExIncChangeFile(key, project) {
    
    jQuery('#'+key+'-file-input').on("change", function() {
        
        // Update change to file
        var file = $(this).val();
        changeExIncFile(key, project, file);
    });
}

function registerCat(key, data) {

     // Register cat choices appear / disappear
     jQuery('input[name='+key+'-cat-choice]').change(function(){
        var choice = $(this).val();
        data['-cat-choice'] = choice;

        if (choice == 'bins') {
            jQuery('.'+key+'-if-bins').css('display', 'block');
        }
        else {
            jQuery('.'+key+'-if-bins').css('display', 'none');
        }
    });

    // Save Input
    jQuery('#'+key+'-cat-bins').on('change', function() {
        data['-cat-bins'] = $(this).val();
    });

    // Save Input
    jQuery('#'+key+'-cat-bin-strat').select2({
        minimumResultsForSearch: -1
    });
    jQuery('#'+key+'-cat-bin-strat').on('change', function() {
        data['-cat-bin-strat'] = $(this).val();
    });
}

function registerBinary(key, data) {
    
    // Register binary chocie appear / disappear
    jQuery('input[name='+key+'-binary-choice]').change(function(){
        var choice = $(this).val();
        data['-binary-choice'] = choice;

        if (choice == 'threshold') {
            jQuery('#'+key+'-if-threshold').css('display', 'block');
        }
        else {
            jQuery('#'+key+'-if-threshold').css('display', 'none');
        }
    });

    // Input validation for binary
    optionsInputValidation(key, '-binary-threshold', data);
}

function optionsInputValidation(key, stem, data) {

    var s_key = key+stem;
    
    jQuery('#'+s_key).on('input', function() {
        jQuery('#'+s_key+'U').val('');
        jQuery('#'+s_key+'L').val('');

        data[stem] = $(this).val();
        data[stem+'U'] = '';
        data[stem+'L'] = '';
    });

    jQuery('#'+s_key+'U').on('input', function() {
        jQuery('#'+s_key).val('');
    
        data[stem] = ''
        data[stem+'U'] = $(this).val();
    });

    jQuery('#'+s_key+'L').on('input', function() {
        jQuery('#'+s_key).val('');

        data[stem] = ''
        data[stem+'L'] = $(this).val();
    });
}

function registerPropagate(key, project) {

    // Only if a set - just in case
    if (project['loading_spaces'][key+'-var-space'] !== undefined) {

        // Change drop_na
        jQuery('input[name='+key+'-drop-choice]').on('change', function() {
            var drop_choice = $(this).val();

            getSubSpaceKeys(key+'-var-space', project).forEach(k => {
                jQuery('input[name='+k+'-var-drop-choice]').val(drop_choice);

                if (drop_choice == "true") {
                    jQuery('#'+k+'-var-drop-choice-true').addClass('active');
                    jQuery('#'+k+'-var-drop-choice-false').removeClass('active');
                    project['data'][k+'-var']['-drop-choice'] = 'true';
                    
                }
                else {
                    jQuery('#'+k+'-var-drop-choice-false').addClass('active');
                    jQuery('#'+k+'-var-drop-choice-true').removeClass('active');
                    project['data'][k+'-var']['-drop-choice'] = 'false';
                }
            });
        });

        // Change eventname
        jQuery('#'+key+'-eventname').on('change', function() {
            undisableSetVar();
            var eventname = $(this).val();

            getSubSpaceKeys(key+'-var-space', project).forEach(k => {
                jQuery('#'+k+'-var-eventname').val(eventname).change();
                jQuery('#'+k+'-var-input').trigger('input');
            });

            disableSetVar();
        });
    }
}

function registerInputChoices(key, data) {

    jQuery('input[name='+key+'-drop-choice]').on('change', function() {
        data['-drop-choice'] = $(this).val();
    });
}

function registerChangeType(key, options, data) {

    // Proc changes for target type
    jQuery('input[name='+key+'-type]').change(function(){
       var dataType = $(this).val();

       options.forEach(val => {
           var display = 'none';
           if (dataType == val) {display = 'block'};
           jQuery('#'+key+'-if-'+val).css('display', display);
       });

       data['-type'] = $(this).val();
   });
}

function registerChangeOutlier(key, data) {

   slider_keys.forEach(val => {
       jQuery('#'+key+'-outlier-'+val).change(function(){
           if($(this).prop("checked") == true){
               jQuery('#'+key+'-'+val).css('display', 'block');

               // Register changes to project data
               data['-outlier-' + val] = true;
           }
           else {
               jQuery('#'+key+'-'+val).css('display', 'none');

               // Register changes to project data
               data['-outlier-' + val] = false;
           }
       });

       // Register input
       optionsInputValidation(key, '-range-'+val, data);
   });
}

function registerSaveInput(key, data) {

    jQuery("#"+key+"-input").on('change', function() {
        data['-input'] = $(this).val();
    });

    jQuery("#"+key+"-eventname").on('change', function() {
        data['-eventname'] = $(this).val();
    });
}

function registerOffValInput(key, data) {
    jQuery("#"+key+"-input").on('change', function() {
        validateVariableInput(key, data);
    });
}

function registerOffSetInput(key, data) {
    jQuery("#"+key+"-data-sets").on('change', function() {
        validateSetInput(key, data);
    });
}

function registerOffDataType(key, data) {
    jQuery('input[name='+key+'-type]').change(function() {
        validateDataType(key, data);
    });
}

function registerDestroySetVars(key, project) {

    // If the set changes, remove any set vars that dont exist any more
    jQuery("#"+key+"-data-sets").on('change', function() {
        var all_vars = getAllSetVars(key);

        getSubSpaceKeys(key+'-var-space', project).forEach(k => {
            var var_name = jQuery('#'+k+'-var-input').val();

            if (!all_vars.includes(var_name)) {
                jQuery('#'+k+'-var-remove').click();
            }
        });
    });
}

function registerVariableCardName(key) {

    jQuery("#"+key+"-input").on('change', function() {
        updateVariableCardName(key);
    });

    jQuery("#"+key+"-eventname").on('change', function() {
        updateVariableCardName(key);
    });

    // Trigger input once at init
    jQuery("#"+key+"-input").trigger('change');
}

function registerSetCardName(key) {

    jQuery("#"+key+"-data-sets").on('change', function() {
        updateSetCardName(key);
    });

    jQuery("#"+key+"-eventname").on('change', function() {
        updateSetCardName(key);
    });
}

function registerSetVariable(key) {

    if (key.includes('var-space')) {

        // Determine the parent set
        var split = key.split('-');
        var p_key = split.splice(0, split.length-4).join('-');
        var p_type = jQuery('input[name='+p_key+'-type]:checked').val();


        jQuery('input[name='+key+'-type]').on('change', function() {
            var type = $(this).val();

            if (type !== p_type) {
                jQuery("#"+key+"-type-warning").css('display', 'block');
            }
            else {
                jQuery("#"+key+"-type-warning").css('display', 'none');
            }
        });
    }
}

function registerSetChoices(key) {

    jQuery("#"+key+"-data-sets").append('<option item=""></option>');
	for (var i = 0; i < sets.length; i++) {
        jQuery("#"+key+"-data-sets").append('<option item="' +
        sets[i]['id'] + '">' + getSetName(sets[i]) + '</option>');
	}
	jQuery("#"+key+"-data-sets").select2({
        placeholder: "Select a set",
    });
}

function registerSaveProjectSet(key, project) {

    jQuery("#"+key+"-data-sets").on('change', function () {
        project['data'][key]['-data-sets'] = $(this).find('option:selected').attr('item');
        project['data'][key]['-input'] = jQuery("#"+key+"-data-sets").find('option:selected').val();
    });
}

function registerSetRefresh(key, project) {
    jQuery('#' + key + '-refresh-set').on('click', function () {
        refreshAllSets(project);
        jQuery('#' + key + '-refresh-set').blur();
    });
}

function registerInputField(key, data_types, data) {

    // Register change types
    registerChangeType(key, data_types, data);

    // Register turn off validation on data type
    registerOffDataType(key, data);

    // Register Binary
    if (data_types.indexOf('binary') !== -1) {
        registerBinary(key, data);
    }

    // Register cat
    registerCat(key, data);

    // Register input choices
    registerInputChoices(key, data);

    // Register changes for the outlier bars
    registerChangeOutlier(key, data);

    // Popovers
    registerPopovers()

    // Make eventname select2
    jQuery('#'+key+"-eventname").select2();

    // Register hide
    jQuery('#'+key+'-hide').on('click', function() {
        hideOutput(key);
    });

    // Register track index changes
    registerCard(key, data);
}

function registerLoadVariableEvents(key, data_types, data) {

    // Still dont have the code 100% digested, but it works for now
    registerInputVar(key);

    // Register base input fields
    registerInputField(key, data_types, data);
    
    // Update card name w/ change
    registerVariableCardName(key);

    // Register save to project for input + event name
    registerSaveInput(key, data);
    
    // Register input validation
    registerOffValInput(key, data);

    // Register set variable specific
    registerSetVariable(key);
    
    // Set w/ any existing from saved project data
    updateInputField(key, data);

}

function registerInputVar(key) {
    
    var pageSize = 30;
    jQuery.fn.select2.amd.require(["select2/data/array", "select2/utils"],

        function (ArrayData, Utils) {
            function CustomData($element, options) {
                CustomData.__super__.constructor.call(this, $element, options);
            }
            Utils.Extend(CustomData, ArrayData);

            CustomData.prototype.query = function (params, callback) {

                var results = [];
                if (params.term && params.term !== '') {
                    results = _.filter(variable_choices, function (e) {
                        return e.text.toUpperCase().indexOf(params.term.toUpperCase()) >= 0;
                    });
                }
                else {
                    results = variable_choices;
                }

                if (!("page" in params)) {
                    params.page = 1;
                }
                var data = {};
                data.results = results.slice((params.page - 1) * pageSize, params.page * pageSize);
                data.pagination = {};
                data.pagination.more = params.page * pageSize < results.length;
                callback(data);
            };

            jQuery('#'+key+'-input').select2({
                ajax: {},
                dataAdapter: CustomData
            });
        });
}

function registerLoadVariable(key, data_types, script, v_type, project) {

    // Register most load variables event handlers
    registerLoadVariableEvents(key, data_types, project['data'][key]);

    // On click show target/data
    jQuery('#'+key+'-show').on('click', function() {

        if (validateVariable(key, project['data'][key])) {
            loadVariable(key, script, project)
        }
    });

    // Register check variable cache - after set w/ any existing
    registerVariableCache(key, v_type);
}

function registerLoadSet(key, data_types, script, v_type, project) {

    // Register base input fields
    registerInputField(key, data_types, project['data'][key]);

    // Register update project on eventname change
    jQuery("#"+key+"-eventname").on('change', function() {
        project['data'][key]['-eventname'] = $(this).val();
    });

    // Register Set choices
    registerSetChoices(key);

    // Register updates to card name
    registerSetCardName(key);

    // Register refresh sets
    registerSetRefresh(key, project);

    // Register save project set
    registerSaveProjectSet(key, project);

    // If changes, change any set variables
    registerPropagate(key, project);

    // If the set changes, remove any set vars not in the new set
    registerDestroySetVars(key, project);

    // Register validation
    registerOffSetInput(key, project['data'][key]);

    // On click show show
    jQuery('#'+key+'-show').on('click', function() {

        if (validateSet(key, project['data'][key])) {
            loadSet(key, script, project);
        }
    });

    // Set w/ any existing from saved project data
    updateInputField(key, project['data'][key]);

    // Register check set cache
    registerSetCache(key, v_type)
}

function registerExInc(key, project) {

    // Popovers
    registerPopovers();

    // Also register change to card name
    registerByValueCardName(key);

    // Register base by val behavior
    registerBaseByValue(key, project, 'filter-space');

    // Register add new strat var
    jQuery('#'+key+'-add-strat-var').on('click', function() {
        jQuery('#add-strat').click();
    });

}

////////////////////
// Add Functions //
//////////////////

function addStratVariable(project, key=undefined) {

    var space = 'strat-space';

    if (key !== undefined) {
        var n = addExistingSpace(space, project, key, 1);
    }
    else {
        var initInfo = initNewSpace(space, project);
        var key = initInfo[0];
        var n = initInfo[1];
    }

    var data_types = ["binary", "cat"];

    var input_label = '<label for="'+key+'-input" data-toggle="popover"' +
    'title="Non-Input Variable" data-placement="top"' +
    'data-content="' +
    'Non-Input variables are special in that they are not used to directly predict the target variable. ' +
    'Instead, loading Non-Input variables here lets you employ them in other contexts. Notably, Non-Input variables ' +
    'must be categorical. They can be used across the application, typically in defining a validation strategy, or in selecting ' +
    'a subset of subjects based on the value(s) of a loaded non-input variable. For example, if you want to perform group preserving ' +
    'validation behavior on site, then site should be loaded as a Non-Input variable.' +
    '"' +
    '>Non-Input Variable <i class="fas fa-info-circle fa-sm"></i></label>';

    // Data type label
    var data_type_label = '<label for="'+key+'-buttons"' +
    '><span data-toggle="popover"' +
    'title="Non-Input Data Type" data-placement="top"' +
    'data-content="' +
    'Non-Input variables must ultimately be categorical, which means you must select either ' +
    'binary or categorical as a data type.' +
    '<br><b>Binary</b> data type refers to encoding the variable with just two classes (0 and 1). ' +
    'This data type offers both a default setting, and an option to encode an originally cont. variable as ' +
    'binary.<br>' +
    '<b>Categorical</b> data type refers to ordinally encoding a variable. There is both a default option ' +
    'where the variable is just encoded based on what categories are already present, and an option to perform ' +
    'kbins encoding on an originally cont. variable.' + 
    '">' +
    'Data Type <i class="fas fa-info-circle fa-sm"></i>' +
    '</span></label>';

    // Generate the HTML for data variable
    var html = '' +
    inputVariableHTML(key, input_label) +
    inputDataTypeHTML(key, data_type_label, true, data_types) +
    resultsHTML(key, 'Load/Show');

    // Wrap in card, and add to space
    var wrap_name = '<span class="text-secondary"><b>Non-Input Variable</b></span>';
    var card_html = cardWrapHTML(wrap_name, key, html, false);
    jQuery('#'+space).append(card_html);

    // Register all events
    registerLoadVariable(key, data_types, 'load_strat.py', 'strat', project);

    // Register close button
    cnt_id = 'strat-count';
    registerCloseButton(space, key, n, 'n_vars', cnt_id, project);

    // Increment
    project['loading_spaces'][space]['n_vars'] = project['loading_spaces'][space]['n_vars'] + 1;
    jQuery('#'+cnt_id).text(project['loading_spaces'][space]['n_vars']);

    // Remove any focus
    jQuery('#'+key+'-input').focus().blur();

    return key;
}


function addDataVariable(project, space='data-space', key=undefined) {

    if (key !== undefined) {
        var n = addExistingSpace(space, project, key, 2);
    }
    else {
        var initInfo = initNewSpace(space, project, key_ext='-var');
        var key = initInfo[0];
        var n = initInfo[1];
    }

    var data_types = ['binary', 'float', 'cat'];
    var input_label = getVarInputLabelHTML(key, space);

  
    // Data type label
    var data_type_label = '<label for="'+key+'-buttons"' +
    '><span data-toggle="popover"' +
    'title="Variable Data Type" data-placement="top"' +
    'data-content="Data Variables can be loaded with a few different data types. ' + 
    getDataTypeBaseLabelHTML() +
    '">' +    
    'Data Type <i class="fas fa-info-circle fa-sm"></i>' +
    '</span></label>';

    // Generate the HTML for data variable
    var html = '' +
    inputVariableHTML(key, input_label) +
    inputDataTypeHTML(key, data_type_label, false, data_types) +
    resultsHTML(key, 'Show Data');

    // Add set to name if within set
    var wrap_name = 'Variable';
    if (space !== 'data-space') {
        wrap_name = 'Set ' + wrap_name;
    }

    var card_name = '<span class="text-info"><b>'+wrap_name+'</b></span>';

    // Wrap in card, and add to space
    var card_html = cardWrapHTML(card_name, key, html, false);
    jQuery('#'+space).append(card_html);

    // Register all events
    registerLoadVariable(key, data_types, 'load_variable.py', 'variable', project);

    // Register close button
    cnt_id = 'var-count';
    if (space !== 'data-space') {
        cnt_id = 'undefined';
    }
    registerCloseButton(space, key, n, 'n_vars', cnt_id, project);

    // Only update the var count into, if this is the main data-space
    if (space == 'data-space') {
        project['loading_spaces'][space]['n_vars'] = project['loading_spaces'][space]['n_vars'] + 1;
        jQuery('#var-count').text(project['loading_spaces'][space]['n_vars']);
    }

    // Remove any focus
    jQuery('#'+key+'-input').focus().blur();

    return key;
}

function addDataSet(project, space='data-space', key=undefined) {


    if (key !== undefined) {
        var n = addExistingSpace(space, project, key, 2);
    }
    else {
        var initInfo = initNewSpace(space, project, key_ext='-set');
        var key = initInfo[0];
        var n = initInfo[1];
    }
    
    var data_types = ['binary', 'float', 'cat'];

    var data_type_label = '<label for="'+key+'-buttons"' +
    '><span data-toggle="popover"' +
    'title="Variable Data Type" data-placement="top"' +
    'data-content="Sets are generally restricted to loading all variables within the set to the same data type, ' +
    'but by clicking show on the table produced by Show Data, you can override specific variables. ' +
    getDataTypeBaseLabelHTML() + '">' +
    'Data Type <i class="fas fa-info-circle fa-sm"></i>' +
    '</span></label>';

    // Generate the HTML for data set
    html = '' +
    '<div class="form-row">' +
    inputSetFormHTML(key) + 
    inputEventnameHTML(key) +
    '</div>' +
    inputDataTypeHTML(key, data_type_label, false, data_types) +
    resultsHTML(key, 'Show Data') +
    '<div id="'+key+'-var-space"><hr></div>';


    var card_name = '<span class="text-info"><b>Set</b></span>';
    var card_html = cardWrapHTML(card_name, key, html, false);
    jQuery('#data-space').append(card_html);

    // Init var space data
    project['loading_spaces'][key+'-var-space'] = {'data_fields': Array()};

    // Register events
    registerLoadSet(key, data_types, 'load_set.py', 'set', project);

    // Register add set button
    jQuery('#'+key+'-add-sets-but').on('click', showSets);

    // Register close button
    registerCloseButton(space, key, n, 'n_sets', 'set-count', project);

    // Set new count
    project['loading_spaces'][space]['n_sets'] = project['loading_spaces'][space]['n_sets'] + 1;
    jQuery('#set-count').text(project['loading_spaces'][space]['n_sets']);

    // Remove any focus
    jQuery("#"+key+"-eventname").focus().blur();

    return key;
}

function addTarget(project, key=undefined) {

    var data_types = ['binary', 'float', 'cat'];
    var space = 'target-space';

    if (key !== undefined) {
        var n = addExistingSpace(space, project, key, 1);
    }
    else {
        var initInfo = initNewSpace(space, project);
        var key = initInfo[0];
        var n = initInfo[1];
    }

    if (project['data'][key] == undefined) {
        project['data'][key] = {};
    }

    // name input label
    var input_label = '<label for="'+key+'-input">' +
    '<span data-toggle="popover"' +
    'title="Target Variable" data-placement="top"' +
    'data-content="The target variable within a machine learning context is ' +
    'the variable you are trying to predict. Keep in mind, the choice of data-type for this variable will ' +
    'also restrict the types of ML Pipelines compatible with predicting this variable later on. ' +
    'You may load multiple target variables, but during Evaluate / Test, you may only predict one at a time."' +
    '>Target Variable <i class="fas fa-info-circle fa-sm"></i></span></label>';

    // data type label
    var data_type_label = '<label for="'+key+'-buttons"' +
    '><span data-toggle="popover"' +
    'title="Target Data Type" data-placement="top"' +
    'data-content="This option determines which data type this target variable should be loaded as. Note: ' +
    'the data type for a target variable also determines the type of ' +
    'machine learning to perform later on, i.e., the type of Model Pipeline must match. ' +
    getDataTypeBaseLabelHTML() + '">' +
    'Data Type <i class="fas fa-info-circle fa-sm"></i>' +
    '</span></label>';

    // Generate the HTML for target
    var html = '' +
    inputVariableHTML(key, input_label) +
    inputDataTypeHTML(key, data_type_label, true, data_types) +
    resultsHTML(key, 'Show Target');

    // Wrap in card
    var card_name = '<span class="text-primary"><b>Target</b></span>';

    // Make sure first target un-removable
    var unremovable = false;
    if (n == 0) {
        unremovable = true;        
    }

    var card_html = cardWrapHTML(card_name, key, html, unremovable);
    jQuery('#'+space).append(card_html);

    // Register all events
    registerLoadVariable(key, data_types, 'load_target.py', 'target', project);

    // If no type, set to undefined
    if (project['data'][key]['-type'] == undefined) {
        project['data'][key]['-type'] = 'float';
    }
    if (project['data'][key]['-input'] == undefined) {
        project['data'][key]['-input'] = ' ';
    }

    // Register close button
    cnt_id = 'target-count';
    registerCloseButton(space, key, n, 'n', cnt_id, project);

    // Increment
    project['loading_spaces'][space]['n'] = project['loading_spaces'][space]['n'] + 1;
    jQuery('#'+cnt_id).text(project['loading_spaces'][space]['n']);

    return key;
}

function addExclusion(project, key=undefined) {

    var i_label = "This option allows you to upload a file containing " +
                  "subjects in which to ignore from all analyses. " + 
                  "Specifically, valid files should be text files containing " +
                  "one subject per line, and no header information.";

    var fs_label = "This option allows you to select subjects to exclude " +
                   "based on the value of a loaded Non-Input variable." +
                   "<br><b>Note:</b> Show must have been called on the Non-Input Variable " +
                   "in order for the values to appear. Also consider that when loading Non-Input " +
                   "Variables, they will take into account any exclusions or inclusions.";

    var card_name = '<span class="text-danger"><b>Exclusions</b></span>';
    var n_field = 'n_exclusions';
    var n_label = 'exclusion-count';

    return addExInc(i_label, card_name, n_field, n_label, fs_label, 'exclusions', project, key);
}

function addInclusion(project, key=undefined) {
    
    var i_label = "This option allows you to upload a file containing " +
                  "subjects in which to limit analysis to only those subjects. " + 
                  "Specifically, valid files should be text files containing " +
                  "one subject per line, and no header information.";

    var fs_label = "This option allows you to select subjects to include " +
                   "based on the value of a loaded Non-Input variable." +
                   "<br><b>Note:</b> Show must have been called on the Non-Input Variable " +
                   "in order for the values to appear. Also consider that when loading Non-Input " +
                   "Variables, they will take into account any exclusions or inclusions.";

    var card_name = '<span class="text-success"><b>Inclusions</b></span>';
    var n_field = 'n_inclusions';
    var n_label = 'inclusion-count';

    return addExInc(i_label, card_name, n_field, n_label, fs_label, 'inclusions', project, key);
}

function addExInc(i_label, card_name, n_field, n_label, fs_label, data_type, project, key) {

    var space = 'filter-space'

    if (key !== undefined) {
        var n = addExistingSpace(space, project, key, 1);
    }
    else {
        var initInfo = initNewSpace(space, project);
        var key = initInfo[0];
        var n = initInfo[1];
    }

    project['data'][key]['data_type'] = data_type;

    var file_input_label = getPopLabel(key, "From File ", i_label);
    var from_strat_label = getPopLabel(key, "By Non-Input Value ", fs_label);

    var html = addSubjectsInputRowHTML(key, file_input_label, from_strat_label, data_type);

    // Wrap in card, and add to space
    var card_html = cardWrapHTML(card_name, key, html, false);
    jQuery('#filter-space').append(card_html);

    // On selected File
    registerExIncChangeFile(key, project);
    registerAddChangeFileProject(key, project);

    // Most registrations
    registerExInc(key, project)

    // Register close button
    registerCloseButton(space, key, n, n_field, n_label, project);

    // Register track index changes
    registerCard(key, project['data'][key]);
    
    // Set new count
    project['loading_spaces'][space][n_field] = project['loading_spaces'][space][n_field] + 1;
    jQuery('#'+n_label).text(project['loading_spaces'][space][n_field]);

    return key;
}

///////////
// Page //
/////////

function displayDataLoading(project) {

    // Hide everything
    hideAllProjSteps()

    // If already loaded
    if (jQuery('#body-data-loading').html().length > 100) {
        jQuery('#body-data-loading').css('display', 'block');

        // refresh Sets on re-load
        refreshAllSets(project);
        return;
    }

    // Reset spaces
    project['loading_spaces']['target-space'] = {
        'data_fields': Array(),
        'n': 0
    }
    project['loading_spaces']['filter-space'] = {
        'data_fields': Array(),
        'n_exclusions': 0,
        'n_inclusions': 0
    }
    project['loading_spaces']['data-space'] = {
        'data_fields': Array(),
        'n_sets': 0,
        'n_vars': 0
    }
    project['loading_spaces']['strat-space'] = {
        'data_fields': Array(),
        'n_vars': 0
    }
        
    // Add + Display
    jQuery('#body-data-loading').append(dataLoadingStructureHTML());
    jQuery('#body-data-loading').css('display', 'block');

    // Add all existing data saved w/ this project
    getAllKeys(project).forEach(key => {

        // If a target
        if ((key.includes('target-space'))) {
            addTarget(project, key);
        }

        // If data variable
        if ((key.endsWith('-var')) && (!key.includes('var-space'))) {
            addDataVariable(project, 'data-space', key);
        }

        // If set
        else if (key.endsWith('-set')) {
            addDataSet(project, 'data-space', key);
        }

        // If strat variable
        else if (key.includes('strat-space')) {
            addStratVariable(project, key);
        }
    });

    // Add Exclusions / Inclusions + set variables only after rest
    getAllKeys(project).forEach(key => {
        
        // If Exc or Inc
        if (key.includes('filter-space')) {
            if (project['data'][key]['data_type'] == 'exclusions') {
                addExclusion(project, key);
            }
            else {
                addInclusion(project, key);
            }
        }

        // If set variable
        else if (key.includes('var-space')) {

            // Determine which sets var-space to add it to
            var split = key.split('-');
            var space = split.splice(0, split.length-2).join('-');
            var k = addDataVariable(project, space=space, key=key);
            disableSetVar(k);
        }

    });

    // Make sure there is atleast one target
    if (project['loading_spaces']['target-space']['n'] == 0) {
        var key = addTarget(project);
        addScrollTo(key, 'add-target');
        jQuery('#'+key+'-input').focus();
    }

    // On click add target, add target
    jQuery('#add-target').on('click', function() {
        var key = addTarget(project);
        addScrollTo(key, 'add-target');
        jQuery('#'+key+'-input').focus();
    });

    // On click add var, call func
    jQuery('#add-var').on('click', function() {
        var key = addDataVariable(project);
        addScrollTo(key, 'add-var');
        jQuery('#'+key+'-input').focus();
    });

    // On click add set, call func
    jQuery('#add-set').on('click', function() {
        var key = addDataSet(project);
        addScrollTo(key, 'add-set');
        jQuery("#"+key+"-data-sets").focus();
    });

    // Exclusion
    jQuery('#add-exclusion').on('click', function() {
        var key = addExclusion(project);
        addScrollTo(key, 'add-exclusion');
        $(this).blur()

    });

    // Inclusion
    jQuery('#add-inclusion').on('click', function() {
        var key = addInclusion(project);
        addScrollTo(key, 'add-inclusion');
        $(this).blur()

    });

    // Strat / non-input
    jQuery('#add-strat').on('click', function() {
        var key = addStratVariable(project);
        addScrollTo(key, 'add-strat');
        jQuery('#'+key+'-input').focus();
    });
}


// On document load
jQuery(document).ready(function() {

    // Load the input variable cache
    getInputCache();
});