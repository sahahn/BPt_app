// Global vars
var ML_options;
var flex_pipe_pieces = ['imputers', 'scalers', 'transformers', 'feature_selectors'];
var static_pipe_pieces = ['model', 'parameter_search', 'feature_importances'];

////////////
// Utils //
//////////

function getMLOptions() {
    
    jQuery.getJSON('php/get_json_in_cache.php', {'loc': 'ML_options.json'}, function(data) {
        ML_options = data;
    });
}

function getDocsLink(doc_str) {

    if (doc_str.includes('sklearn')) {
        return 'https://scikit-learn.org/stable/modules/generated/' + doc_str + '.html';
    }

    if (doc_str.includes('xgboost')) {
        return 'https://xgboost.readthedocs.io/en/latest/python/python_api.html#' + doc_str;
    }

    if (doc_str.includes('lightgbm')) {
        return 'https://lightgbm.readthedocs.io/en/latest/pythonapi/' + doc_str + '.html';
    }

    if (doc_str.includes('deslib')) {
        var base = 'https://deslib.readthedocs.io/en/latest/modules/';
        var end = '#' + doc_str;

        var split = doc_str.split('.');
        var middle = '';

        for (var i = 1; i < split.length - 2; i++) {
            middle = middle + split[i] + '/';
        }
        middle = middle + split[split.length-2] + '.html';
        return base + middle + end;
    }

    // Special cases
    if (doc_str == 'BPt.extensions.MLP.MLPClassifier_Wrapper') {
        return 'https://scikit-learn.org/stable/modules/generated/sklearn.neural_network.MLPClassifier.html';
    }

    if (doc_str == 'BPt.extensions.MLP.MLPRegressor_Wrapper') {
        return 'https://scikit-learn.org/stable/modules/generated/sklearn.neural_network.MLPRegressor.html';
    }

    console.log(doc_str);

    // If nothing else found, just link to the BPt docs, better than nothing
    return 'https://bpt.readthedocs.io/en/latest/options.html'

}

function updatePieceCardName(key, project) {

    // Get current selected obj name
    var obj_name = jQuery('#'+key+'-obj-input').find('option:selected').html();

    // Two behaviors here, one for if the object has select toggeled, and the other if it doesn't
    if (isBool(project['data'][key]['select'])) {

        // If obj selected, set tab-name to just obj
        if ((obj_name !== undefined) && (obj_name.length > 0)) {
            jQuery('#'+key+'-select-tab').html('<i>' + obj_name + '</i>' + getRemoveTabCloseHTML(key));
            registerRemoveTab(key, project);
        }
    }

    else {

        // Clear existing
        jQuery('#'+key+'-header-text').empty();

        // If obj selected, add to card name + params names
        if ((obj_name !== undefined) && (obj_name.length > 0)) {
            jQuery('#'+key+'-header-text').append(':  <i>' + obj_name + '</i>');
            jQuery('#'+key+'-header-text').append('&nbsp;&nbsp;&nbsp;<b>Dist</b>: <i>' + jQuery('#'+key+'-param-dist').val() + '</i>');
        }
    }
}

function registerUpdatePieceCardName(key, project) {

    // Set card name on change
    jQuery('#'+key+'-obj-input').on('change', function() {
        updatePieceCardName(key, project);
    });

    // Init once at start
    updatePieceCardName(key, project);
}

function getSelectSubKeys(key, project) {

    var selectSubs = [];

    getAllKeys(project).forEach(k => {

        if ((k.startsWith(key)) && (k.split('-').length == key.split('-').length)) {
            var k_split = k.split('_');
            if (k_split.length > 1) {
                var select_split = k_split[1].split('-');
                if (select_split.length == 1) {
                    selectSubs.push(select_split[0]);
                }
            }
        }
    });

    return selectSubs;
}

function getFreeSubKey(key, project) {

    var existing = getSelectSubKeys(key, project);
    var cnt = 0

    while (existing.includes(cnt.toString())){
        cnt += 1
    }

    return cnt.toString();
}

function getSpaceName(key, piece) {

    var space_name = key+'-'+piece+'-space';
    return space_name;
}

function getDisplayFlexPieceName(p) {

    // Special cases
    if (p == 'model') {
        return 'Model'
    }
    
    // Make first letter uppercase
    var name = p[0].toUpperCase();
        
    // Add rest, but w/o last plural s
    name = name + p.slice(1, p.length-1);

    // If any _'s, replace w/ space and capitilize next letter
    var ind = name.indexOf('_');
    if (ind !== -1) {
        name = name.slice(0, ind) + ' ' + name[ind+1].toUpperCase() + name.slice(ind+2);
    }

    return name;
}

////////////////////////////
// Obj Choices / By Type //
//////////////////////////

function getTypeFromScope(key, project) {

    //TODO, if possible should add extra checks for custom combos
    //of variables - but for now just do regression for any custom

    var scope = project['data'][key]['-scope-input'];
    if (JSON.stringify(scope) == JSON.stringify(['cat'])) {
        return 'categorical';
    }

    //if ((scope.includes('all')) || (scope.includes('float'))) {
    //    return 'regression';
    //}

    return 'regression';
}

function getType(project, key) {

    // Get type of base pipeline
    var base_key = key.split('-').splice(0, 3).join('-');
    var type = project['data'][base_key]['-type'];

    // If type is undefined, use proj default based on target
    if (type == undefined) {
        type = getDefaultType(project) 
    }

    // If imputer, set type by scope instead
    if (key.includes('imputers-space')) {
            type = getTypeFromScope(key, project);
    }

    return type;
}

function getByTypeOptions(project, obj, key) {

    var type = getType(project, key);
    return ML_options[obj][type];

}

function getByTypeChoices(project, obj, firstEmpty=true, key=undefined) {

    var obj_options = getByTypeOptions(project, obj, key);
    return getObjChoices(obj_options, firstEmpty);
}

function getObjChoices(obj_options, firstEmpty=true, duplicates=undefined) {

    var options = Array();

    if (firstEmpty) {
        options.push({"id": '', "text": ''});
    }

    Object.keys(obj_options).forEach(name => {

        var text = obj_options[name]['docs_name'].split('.');
        text = text[text.length-1];
        text = text.replace('_Wrapper', '');

        if (duplicates !== undefined) {
            if (duplicates.includes(text)) {
                text = text + ' (' + name + ')';
            }
        }

        options.push({
            "id": name,
            "text": text
        });
    });

    // If any duplicate names, add the extra unique identifier to those names
    if (duplicates == undefined) {
        var just_names = options.map(x => x['text']);
        var duplicates = findDuplicates(just_names);
        
        if (duplicates.length > 0) {
            return getObjChoices(obj_options, firstEmpty=firstEmpty, duplicates=duplicates);
        }
    }

    return options;
}

//////////////////////
// Scope functions //
////////////////////

function mirrorParentScope(model_key, key) {
    var model_scope = jQuery('#' + model_key + '-scope-input');
    model_scope.prop('disabled', true);

    jQuery('#' + key + '-scope-input').on('change', function () {
        model_scope.val($(this).val()).trigger('change');
    });
}

//////////////////////
// On Select Funcs //
////////////////////

function onSelectEnsemble(key, options, project) {
    
    // Base on select behavior
    onSelectObj(key, options, project);
    
    // Show add model + model space
    jQuery('#'+key+'-show-ensemble').css('display', 'block');
    jQuery('#'+key+'-ensemble-space').css('display', 'block');


    if (options['docs_name'].includes('deslib')) {
        project['data'][key]['is_des'] = true;
    }
    else {
        project['data'][key]['is_des'] = false;
    }

    // TODO - should determine if single_estimator or not
    // want to develop the backend Ensemble object a bit more
    // first though, as i.e., might need different options for
    // final estimator vs estimators

    //'base_estimator'
    //'estimators'
    //'final_estimator'
    //'pool_classifiers'

    if (options['param_names'].includes('base_estimator')) {
        project['data'][key]['single_estimator'] = true;
    }
    else {
        project['data'][key]['single_estimator'] = false;
    }

    
}

function onSelectImputer(key, options, project) {

    showModelCheck(key, 'iterative');
    onSelectObj(key, options, project);

}

function onSelectFeatureSelector(key, options, project) {
    showModelCheck(key, 'rfe')
    onSelectObj(key, options, project);
}

function onSelectObj(key, options, project) {

    // Show docs link + edit params
    jQuery('#'+key+'-if-obj').css('display', 'block');

    var docs_link = getDocsLink(options['docs_name']);
    jQuery('#'+key+'-open-docs').attr('href', docs_link);

    // Only show scikit-learn logo if scikit learn based
    if (docs_link.includes('scikit-learn')) {
        jQuery('#'+key+'-sklearn-logo').css('display', 'inline-block');
    }
    else {
        jQuery('#'+key+'-sklearn-logo').css('display', 'none');
    }

    // Update
    updateParamsModal(key, options, project);

    // Re-register register Params Model
    jQuery('#'+key+'-edit-params').off('click');
    jQuery('#'+key+'-edit-params').on('click', function() {
        registerParamsModal(key, options, project);
    });
}

////////////
// Model //
//////////

function showModelCheck(key, key_word) {

    var model_space = key + '-model-space';

    // Check for iterative imputer
    if (jQuery('#' + key + '-obj-input').val() == key_word) {
        jQuery('#' + model_space).css('display', 'block');
    }
    else {
        jQuery('#' + model_space).css('display', 'none');
    }

}

function registerModelChoices(key, project) {

    // Get model + ensemble choices
    var model_options = [
        {"id": '',
         "text": ''
        },
        {'text': 'Models',
        'children': getByTypeChoices(project, 'model', firstEmpty=false, key=key)
        },
        {'text': 'Ensembles',
        'children': getByTypeChoices(project, 'ensembles', firstEmpty=false, key=key)
        }
    ];
    
    // Set model choices in select2
    jQuery('#'+key+'-obj-input').empty().select2({
        placeholder: "Model",
        data:  model_options
    });

}

function registerModel(key, project) {

    // Register is call at init, and also when type may have changed
    // so check first if already loaded + type didnt change, and return if so
    var obj_type = getType(project, key=key);
    var prev_type = jQuery('#'+key+'-space').data('prev_type');
    if (obj_type == prev_type) {return;}
    else {jQuery('#'+key+'-space').data('prev_type', obj_type);}

    // Remove any previous registers
    jQuery('#'+key+'-obj-input').off('change select2:select');
    
    // Register the select2 model obj choices
    registerModelChoices(key, project);

    // Based on selection of model, make necc. changes
    jQuery('#'+key+'-obj-input').on('change', function() {

        var model = $(this).val();
        var model_options = getByTypeOptions(project, 'model', key=key);
        var ensembles_options = getByTypeOptions(project, 'ensembles', key=key);

        // If select model
        if (Object.keys(model_options).includes(model)) {
            var options = model_options[model];
            onSelectObj(key, options, project);

            jQuery('#'+key+'-show-ensemble').css('display', 'none');
            jQuery('#'+key+'-ensemble-space').css('display', 'none');
            project['data'][key]['ensemble'] = false;
        }
        else if (Object.keys(ensembles_options).includes(model)) {
            var options = ensembles_options[model];
            onSelectEnsemble(key, options, project);
            project['data'][key]['ensemble'] = true;
        }
        else {
            jQuery('#'+key+'-obj-input').val('');
            jQuery('#'+key+'-show-ensemble').css('display', 'none');
            jQuery('#'+key+'-ensemble-space').css('display', 'none');
            project['data'][key]['ensemble'] = false;
        }
    });

    // Register add ensemble base model
    jQuery('#add-'+key+'-ensemble').off('click');
    jQuery('#add-'+key+'-ensemble').on('click', function() {
        var k = addEnsembleModel(project, key+'-ensemble-space');
        addScrollTo(k, 'add-'+key+'-ensemble');
    });

    // Base register for select obj input
    registerBaseObjInput(key, project);
}

///////////////////
// Param Search //
/////////////////

function registerNumField(key, project, id, def_val) {

    // Register n_iter
    jQuery('#'+key+id).on('change', function() {
        project['data'][key][id] = $(this).val();
    });

    // set default / saved
    if (project['data'][key][id] !== undefined) {
        def_val = project['data'][key][id];
    }
    jQuery('#'+key+id).val(def_val).trigger('change');
}

function registerSearchType(key, project) {

    var search_type = jQuery('#'+key+'-search-type');

    // Register select choices
    search_type.select2({
        'placeholder': 'Select a search type',
        'data': getSearchTypeChoices()
    });

    // Trigger show rest of search params
    search_type.on('change', function() {
        if ($(this).val() !== 'None') {
            jQuery('.'+key+'-show-splits').css('display', 'block');
        }
        else {
            jQuery('.'+key+'-show-splits').css('display', 'none');
        }
    });

    // Set card title
    search_type.on('change', function() {
        jQuery('#'+key+'-header-text').empty().append(':  <i>' + $(this).val() + '</i>');
    });

    // Save to project
    search_type.on('change', function() {
        project['data'][key]['-search-type'] = $(this).val();
    });

    // Set default / saved val
    var val = 'None';
    if (project['data'][key]['-search-type'] !== undefined) {
        val = project['data'][key]['-search-type']
    }
    search_type.val(val).trigger('change');
}

function getSearchTypeChoices() {

    var choices = Array();
    choices.push({"id": '', "text": ''});
    choices.push({"id": 'None', "text": 'None'});

    ML_options['parameter_search'].forEach(search_type => {
        if ((search_type !== undefined) && (search_type !== null)) {
            choices.push({
                "id": search_type,
                "text": search_type
            });
        }
    });

    return choices;
}

function getDefaultMetric(pipe_type) {
    
    var default_vals = {
        'binary': 'roc_auc',
        'regression': 'r2',
        'categorical': 'matthews'
    };

    return default_vals[pipe_type];
}

function registerMetric(key, project) {

    var pipe_type = getType(project, key);
    var metric = jQuery('#'+key+'-metric');

    // Remove any previous
    metric.off('change');

    // Set choices
    metric.empty().select2({
        'placeholder': 'Select Metrics',
        'data': getMetricChoices(pipe_type)
    });

    // Save to project
    registerProjectVal(key, project, '-metric', '');

    // Set default based on type
    if ((metric.val() == undefined) || (metric.val().length == 0)) {
        metric.val(getDefaultMetric(pipe_type)).trigger('change');
    }
}

//////////////////////////
// Piece registrations //
////////////////////////

function registerTypeObjInput(key, piece_name, onSelect, project) {

    var obj_type = getType(project, key=key);
    var prev_type = jQuery('#'+key+'-space').data('prev_type');
    if (obj_type == prev_type) {return;}
    else {jQuery('#'+key+'-space').data('prev_type', obj_type);}

    // Remove any previous registers
    jQuery('#'+key+'-obj-input').off('change select2:select');

    // Register obj choices
    jQuery('#'+key+'-obj-input').empty().select2({
        placeholder: getDisplayFlexPieceName(piece_name),
        data: getByTypeChoices(project, piece_name, firstEmpty=true, key=key)
    });

    // Based on selection of obj
    jQuery('#'+key+'-obj-input').on('change', function () {

        // Set on select
        var choice = $(this).val();
        var options = getByTypeOptions(project, piece_name, key=key)[choice];
        onSelect(key, options, project);
    });

    // Base register for select obj input
    registerBaseObjInput(key, project);
}

function registerNoTypeObjInput(key, piece_name, onSelect, project) {

    // Remove any previous registers
    jQuery('#'+key+'-obj-input').off('change select2:select');
    
    // Register obj choices
    jQuery('#'+key+'-obj-input').empty().select2({
        placeholder: getDisplayFlexPieceName(piece_name),
        data: getObjChoices(ML_options[piece_name])
    });

    // Based on selection of obj
    jQuery('#'+key+'-obj-input').on('change', function () {

        // Set on select
        var choice = $(this).val();
        var options = ML_options[piece_name][choice];
        onSelect(key, options, project);
    });

    // Base register for select obj input
    registerBaseObjInput(key, project);
}

function registerBaseObjInput(key, project) {

    // Register updates to card name
    registerUpdatePieceCardName(key, project);

    // Set to save previous selection
    jQuery('#'+key+'-obj-input').on('select2:select', function() {
        $(this).data('val', $(this).val());
    });

    // Saves values on change
    jQuery('#'+key+'-obj-input').on('change', function () {
        project['data'][key]['-obj-input'] = $(this).val();
    });

    // Set saved
    if (project['data'][key]['-obj-input'] !== undefined) {
        jQuery('#'+key+'-obj-input').val(project['data'][key]['-obj-input']).trigger('change').trigger('select2:select');
    }

    // Register track index changes
    registerCard(key, project['data'][key]);
}

function registerFlexPieceClose(space, key, n, project) {
    var cnt_id = space + '-count';
    var cnt_field = 'n';
    registerCloseButton(space, key, n, cnt_field, cnt_id, project);
    updateCnt(project, space, cnt_field, cnt_id);
}

///////////////////////////
// Select Functionality //
/////////////////////////

function registerShowTab(key) {

    $('#'+key+'-select-tab').on('click', function(e) {
        e.stopPropagation();
        $(this).tab('show');

        // Toggle card if not toggled
        // var card_header = $(this).parent().parent().parent().parent();
        // $(card_header.data("target")).collapse("show");

    });

    $('#'+key+'-select-tab').click();
}

function registerRemoveTab(key, project) {

    // Register remove tab
    jQuery('#'+key+'-remove-tab').on('click', function(e) {
        e.stopPropagation();
        removeSpace(key, project);
        jQuery('#'+key+'-select-tab').parent().prev().children().click();
        jQuery('#'+key+'-select-tab').parent().remove();
    });
}

function registerTab(key, project) {

    registerShowTab(key);
    registerRemoveTab(key, project);
}

function addToggleSelectOnBtn(key) {
    jQuery('#'+key+'-header-text-extra').append('&nbsp;&nbsp;&nbsp;<button type="button" ' +
           'class="btn btn-outline-success btn-sm" id="' + key + '-select-toggle">Toggle Select</button>');
}

function initSelectTabs(key) {
    
    var new_header_html = '' +
    '<ul class="nav nav-tabs card-header-tabs" role="tablist" id="' + key + '-select-tabs">' +

        '<li class="nav-item">' +
        '<span style="padding-left: 10px; padding-right: 10px;" class="nav-link text-success"><b>Select </b>' + jQuery('#' + key + '-card-start-text').html() + '</span></li>' +

        getTabHTML(key) +

        '<li class="nav-item">' +
        '<span class="nav-link fake-link" id="' + key + '-new-select" role="tab"><i class="fa fa-plus-circle" aria-hidden="true"></i></span>' +
        '</li>' +

        '<li class="nav-item">' +
        '<button type="button" class="btn btn-outline-success btn-sm nav-link" id="'+key+'-select-toggle">Toggle Select</button></li>' + 
    '</ul>';

    // If close button, create new spot to move close button
    if (jQuery('#'+key+'-remove').html() !== undefined) {

        // Wrap html
        new_header_html = 
        '<div class="row">' +
        '<div class="col-md-11">' +
        new_header_html +
        '</div>' +
        '<div class="col-md-1"><div id="'+key+'-new-remove-spot"></div></div>';
    }

    jQuery('#'+key+'-card-start-text').css('display', 'none');
    jQuery('#'+key+'-header-text-extra').empty();
    jQuery('#'+key+'-header-text').empty().append(new_header_html);

    // If close button, detach close button and move to new spot
    if (jQuery('#'+key+'-remove').html() !== undefined) {
        var remove_btn = jQuery('#'+key+'-remove').detach();
        remove_btn.appendTo($('#'+key+'-new-remove-spot'));
    }
}

function addSelect(key, project, getHTML, initNew, add_html_spot, add_tab_spot) {

    // Get new key + html
    var new_html = getHTML(key);
    add_html_spot.append(new_html);

    // Add as a new tab
    var new_tab = $(getTabHTML(key));
    new_tab.insertBefore(add_tab_spot);

    // Init new registers, etc...
    initNew(key, project);
    project['data'][key]['select'] = true;

    // Register showing the tab
    registerTab(key, project);
}

function switchOffSelect(key, project, getHTML, initNew) {

    // Detatch the remove button if any - before delete
    var remove_btn = jQuery('#'+key+'-remove').detach();

    // Remove the HTML (+ registers) for all previous opened selects
    getSelectSubKeys(key, project).forEach(i => {
        var new_key = key+'_'+i;
        jQuery('#'+new_key+'-tab').remove();
        jQuery('#'+new_key+'-select-tab').parent().remove();
    });

    // Set select flag in project
    project['data'][key]['select'] = false;

    // Show start text
    jQuery('#'+key+'-header-text').empty();
    jQuery('#'+key+'-card-start-text').css('display', 'inline-block');

    // Add select toggle button
    jQuery('#'+key+'-header-text-extra').empty();
    addToggleSelectOnBtn(key);

    // Update card name
    updatePieceCardName(key, project);

    // Try to re-add remove button
    remove_btn.appendTo($('#'+key+'-remove-spot'));

    // Register switch to select button (select on toggle)
    jQuery('#'+key+'-select-toggle').on('click', function (e) {
        e.stopPropagation();
        switchOnSelect(key, project, getHTML, initNew);
    });
}

function switchOnSelect(key, project, getHTML, initNew) {

    // Set select flag in project
    project['data'][key]['select'] = true;

    // Set up the select tabs on the card
    initSelectTabs(key);

    // Register show tab, and trigger update card name
    // for first obj
    registerShowTab(key);
    updatePieceCardName(key, project);

    // Get spots to add new tabs / select
    var add_html_spot = $('#'+key+'-tabs');
    var add_tab_spot = $('#'+key+'-new-select').parent();

    // Register add new select button
    $('#'+key+'-new-select').on('click', function (e) {
        e.stopPropagation();
        var new_key = key+'_'+getFreeSubKey(key, project);
        addSelect(new_key, project, getHTML, initNew, add_html_spot, add_tab_spot);
    });

    var existing_choices = getSelectSubKeys(key, project);

    // Check for any existing selects and add them,
    existing_choices.forEach(i => {
        addSelect(key+'_'+i, project, getHTML, initNew, add_html_spot, add_tab_spot);
    });

    // If no other 2nd choices yet, add one
    if (existing_choices.length == 0) {
        $('#'+key+'-new-select').click();
    }

    // Set first additional select choice (2nd actual choice) to
    // also be unremovable, s.t., you must have atleast 2 objs to
    // select between
    // var second_choice_key = key+'_'+getSelectSubKeys(key, project)[0];
    // $('#'+second_choice_key+'-remove-tab').css('display', 'none');

    // Set to first choice
    $('#'+key+'-select-tab').click();

    // Register switch to select off button (select off toggle)
    jQuery('#'+key+'-select-toggle').on('click', function (e) {
        e.stopPropagation();
        $('#'+key+'-select-tab').click();
        switchOffSelect(key, project, getHTML, initNew);
    });
}

function registerOnOffSelect(project, key, getHTML, initNew) {
    
    // If select on
    if (isBool(project['data'][key]['select'])) {
        switchOnSelect(key, project, getHTML, initNew);
    }
    // If select off
    else {
        switchOffSelect(key, project, getHTML, initNew);
    }
}

//////////////////////
// Add Piece Funcs //
////////////////////

function initProjectObj(project, key) {
    
    // If obj undefined
    if (project['data'][key] == undefined) {
        project['data'][key] = {};
    }

    // Init select
    if (project['data'][key]['select'] == undefined) {
        project['data'][key]['select'] = false;
    }
}

function initProjectNewModel(key, project) {

    // Init key + select in data
    initProjectObj(project, key);

    // Init sub ensemble loading space
    project['loading_spaces'][key+'-ensemble-space'] = {
            'data_fields': Array(),
            'n': 0
    }
}

function procEnsembleModels(key, project) {

    // Add any existing sub ensemble pieces
    var ensemble_space = key + '-ensemble-space';
    getAllKeys(project).forEach(k => {
        if (k.startsWith(ensemble_space)) {
            var end_k = k.replace(ensemble_space, '');

            if (!end_k.includes('_')) {
                addEnsembleModel(project, ensemble_space, k);
            }
        }
    });

    // If no previous base ensemble models, add new one
    if (project['loading_spaces'][key + '-ensemble-space']['n'] == 0) {
        addEnsembleModel(project, ensemble_space);
    }

    // Make the first ensemble base model un-removable
    var base_model = key + '-ensemble-space-0';
    jQuery('#' + base_model + '-remove').css('display', 'none');

    // Un-roll if only one 
    if (project['loading_spaces'][key + '-ensemble-space']['n'] == 1) {
        jQuery('#' + base_model + '-collapse').collapse("show");
    }
}

/////////////////////
// Init New Funcs //
///////////////////

function initNewFlexPiece(key, project, typeDep, piece_name, onSelect, default_scope) {
    
    // Init if not already defined
    initProjectObj(project, key);

    // Add param model
    jQuery('#params-modals').append(getEditParamsHTML(key));

    // Register obj choices
    if (isBool(typeDep)) {
        registerTypeObjInput(key, piece_name, onSelect, project);
    }
    else {
        registerNoTypeObjInput(key, piece_name, onSelect, project);
    }

    // Register scope
    registerScope(key, project, default_scope);

    // Popovers
    registerPopovers();
}

function initNewEnsembleModel(key, project) {
   
    // Main init
    initNewFlexPiece(key=key, project=project,
                     typeDep=true,
                     piece_name='model',
                     onSelect=onSelectObj,
                     default_scope=['all']);
}

function initNewFeatureSelector(key, project) {
    
    // Main init
    initNewFlexPiece(key=key, project=project,
                     typeDep=true,
                     piece_name='feature_selectors',
                     onSelect=onSelectFeatureSelector,
                     default_scope=['all']);

    // Add base model
    var model_key = addModel(project, key+'-model-space', prepend='RFE ');

    // Set scope to be disabled + mirror parent imputer
    mirrorParentScope(model_key, key);

    // Show if iterative
    showModelCheck(key, 'rfe');
}

function initNewImputer(key, project) {

    // Main init
    initNewFlexPiece(key=key, project=project,
                     typeDep=false, piece_name='imputers',
                     onSelect=onSelectImputer,
                     default_scope=['all']);

    // Add base model
    var model_key = addModel(project, key+'-model-space', prepend='Iterative Imputer ');

    // Set scope to be disabled + mirror parent imputer
    mirrorParentScope(model_key, key);

    // Also re-register the base imputer model on each scope change
    jQuery('#'+key+'-scope-input').on('change', function() {
        registerModel(model_key, project);
    });

    // Show if iterative
    showModelCheck(key, 'iterative');
}

function initNewScaler(key, project) {

    // Main init
    initNewFlexPiece(key=key, project=project,
                     typeDep=false, piece_name='scalers',
                     onSelect=onSelectObj,
                     default_scope=['float']);
}

function initNewTransformer(key, project) {

    // Main init
    initNewFlexPiece(key=key, project=project,
                     typeDep=false, piece_name='transformers',
                     onSelect=onSelectObj,
                     default_scope=['all']);
}

function initNewModel(key, project) {

    // Init project + ensemble space
    initProjectNewModel(key, project);

    // Process any sub-ensembles
    procEnsembleModels(key, project);

    // Add param model
    jQuery('#params-modals').append(getEditParamsHTML(key));
    
    // Register scope
    registerScope(key, project, ['all']);

    // Register model;
    registerModel(key, project);

    // Register popovers
    registerPopovers();
}

/////////////////
// Add Pieces //
///////////////

function addFlexPiece(project, space, piece_name, getPieceHTML,
                      initNew, key=undefined) {

    // Add new or existing space
    if (key !== undefined) {
        var n = addExistingSpace(space, project, key, 1);
    }
    else {
        var initInfo = initNewSpace(space, project);
        var key = initInfo[0];
        var n = initInfo[1];
    }

    // Add HTML
    var card_html = getObjHTML(key, getPieceHTML, getDisplayFlexPieceName(piece_name));
    jQuery('#'+space).append(card_html);

    // Init project setting + params, + scope, etc...
    initNew(key, project);

    // Register close button
    registerFlexPieceClose(space, key, n, project);

    // Register select functionality on + off
    registerOnOffSelect(project=project, key=key,
                        getHTML=getPieceHTML, initNew=initNew);

    return key;
}

function addEnsembleModel(project, space, key=undefined) {
    
    return addFlexPiece(project=project, space=space,
                        piece_name='model',
                        getPieceHTML=getBaseEnsembleModelHTML,
                        initNew=initNewEnsembleModel,
                        key=key);

}

function addFeatureSelector(project, space, key=undefined) {

    return addFlexPiece(project=project, space=space,
                        piece_name='feature_selectors',
                        getPieceHTML=getBaseFeatSelectorHTML,
                        initNew=initNewFeatureSelector,
                        key=key)
}

function addImputer(project, space, key=undefined) {

    return addFlexPiece(project=project, space=space,
                        piece_name='imputers',
                        getPieceHTML=getBaseImputerHTML,
                        initNew=initNewImputer,
                        key=key)
}

function addScaler(project, space, key=undefined) {

    return addFlexPiece(project=project, space=space,
                        piece_name='scalers',
                        getPieceHTML=getBaseScalerHTML,
                        initNew=initNewScaler,
                        key=key);
}

function addTransformer(project, space, key=undefined) {

    return addFlexPiece(project=project, space=space,
                        piece_name='transformers',
                        getPieceHTML=getBaseTransformerHTML,
                        initNew=initNewTransformer,
                        key=key);
}

function addModel(project, space, prepend='') {

    // Just one model, and forced, so no delete option
    // or add more option, fixed key
    var key = space + '-model';

    // Get and set model html
    var card_html = getModelHTML(key, prepend);
    jQuery('#'+space).append(card_html);

    // Init project +
    // Add any existing sub ensemble pieces +
    // Register scope, model + popovers    
    initNewModel(key, project);

    // Register select functionality on + off
    registerOnOffSelect(project, key, getBaseModelHTML, initNewModel);

    return key;
}

function addParameterSearch(project, space) {

    var key = space + '-parameter_search';

    if (project['data'][key] == undefined) {
        project['data'][key] = {}
    }

    var obj_descr = 'Selection of which hyper-parameter search type to use. By default this is None. ' +
    'By keeping this as None, no hyper-parameter search will be used with this ML Pipeline. That said, ' +
    'if there are any hyper-parameter distributions defined, then their NEEDs to be a non-None value set here. ' +
    'Note the setting any pieces to Select is type of a hyper-parameter and therefore requires a search type ' +
    'to be set here.<br><br>' +
    'Hyper-parameters are optimized through facebooks nevergrad library (see: ' +
    'https://github.com/facebookresearch/nevergrad ). ' +
    'There are a lot of options here, but a good first choice may be using RandomSearch. ' +
    'This object explores the hyper-parameter distribution space just through random sampling.';
    var obj_label = getPopLabel(key, 'Search Type ', obj_descr, '-search-type');

    var n_iter_descr = 'This parameter controls the number of combinations of different hyper-parameters ' +
    'which are explored (evaluated via the rest of the settings within this section) at training time. ' +
    'For example, if set to 60, then 60 different combinations of hyper-parameters will be tested, and the ' +
    'combination which maximizes the selected metric according to Splits param and Validation Strategy param will ' +
    'be used. Further, this best selected set of parameter will be used to re-train the ML Pipeline on the whole set of training data ' +
    '(as defined by whatever the training data is at the time).<br><br>' +
    'The number of hyper-parameters to try / budget of the underlying search algorithm. ' +
    'How well a hyper-parameter search works and how long it takes will be very dependent on this parameter ' +
    'and the defined internal CV strategy (via Splits and Repeats). ' +
    'In general, if too few choices are provided the algorithm will likely not select high performing hyper-paramers, ' +
    'and alternatively if too high a value/budget is set, then you may find overfit/non-generalize hyper-parameter choices. ' +
    'Other factors which will influence the right number are things like the search type ' +
    '(depending on the underlying search type, it may take a bigger or smaller budget on average to find a good set of hyper-parameters), ' +
    'the dimensionality of the underlying search space (e.g., If you are only optimizing a few, say 2, underlying parameter distributions, ' +
    'this will require a far smaller budget then say a really high dimensional search space), The CV strategy (' +
    'The CV strategy defined via splits and repeats may make it easier or harder to overfit when searching for hyper-parameters, ' +
    'thus conceptually a good choice of CV strategy can serve to increase ' +
    'the budget you can use before overfitting, or conversely a bad choice may limit it.), and the number of data points / subjects.';
    var n_iter_label = getPopLabel(key, 'Search Budget ', n_iter_descr, '-n-iter');

    var splits_descr = 'Splits in this context defines how each set of sampled hyper-parameters ' +
    'will be evaluated internally. Splits is in other words the type of nested cross validation (CV) strategy to use. ' +
    'There are a few different selectable CV strategies selectable from the tab below:<br>' +
    getEachSplitInfoText();
    var splits_label = getPopLabel(key, 'Splits ', splits_descr, '-splits');

    var metric_content = 'Select a single metric here to use within the hyper-parameter search when comparing the ' +
    'Pipelines trained with different parameters. I.e., at each iteration of the parameter search the Pipeline is evaluated ' +
    'with a different combination of parameters. This metric is used to provide a score to that evaluation. ' +
    'The choice of avaliable metrics is dependent on the type of the Model Pipeline. This type can be toggeled next to the pipeline ' +
    'name by clicking on it (this will toggle through the different options). Be warned though, when changing Pipeline type, as pipeline ' +
    'piece or parameter (like this one), might changed if it or its equivilent is not avaliable for the new Pipeline type.';
    var metric_label = getPopLabel(key, 'Metric ', metric_content);

    var val_strat_label = getPopLabel(key, "Validation Strategy ", getValidationStratText());

    var html = '' + 
    '<div class="form-row">' +

    '<div class="form-group col-md-6">' +
    obj_label +
    '<select id="'+key+'-search-type" class="form-control" data-width="100%"></select>' +
    '</div>' +

    '<div class="form-group col-md-6 '+key+'-show-splits" style="display: none;">' +
    n_iter_label + 
    '<input class="form-control" type="number" id="'+key+'-n-iter">' +
    '</div>' +
    '</div>' +
    
    '<div class="'+key+'-show-splits" style="display: none;">'+
    '<div class="form-row">' +
    
    '<div class="form-group col-md-6">' +
    getSplitsHTML(key, splits_label) + 
    '</div>' +

    '<div class="form-group col-md-6">' +
    metric_label +
    '<select id="'+key+'-metric" class="form-control" data-width="100%"></select>' +
    '<div id="'+key+'-metric-val" class="invalid-feedback">' +
    'You must select a metric!' +
    '</div>' +
    '</div>' +

    '</div>' +

    '<div class="form-row">' +
    '<div class="form-group col-md-6">' +
    getValStratHTML(key, val_strat_label) +
    '</div>' +
    '</div>' +
    
    '</div>';

    var card_html = cardWrapHTML('<b>Parameter Search</b>', key, html, true);
    jQuery('#'+space).append(card_html);
    jQuery('#'+space).css('padding-top', '10px');

    // Set search type choices
    registerSearchType(key, project);

    // Register n iter
    registerNumField(key, project, '-n-iter', '10');

    // Register full splits row, type, vals, validation
    registerSplitsRow(key, project);

    // Register metric
    registerMetric(key, project)

    // Register card
    registerCard(key, project['data'][key])

    return key;
}

function addFeatureImportance(project, space) {

    var key = space + '-feature_importances';
    
    return key;
}

///////////////
// Pipeline //
/////////////

function getDefaultType(project) {

    // Grab the type of the first target
    // This one is unremovable !
    var def_type = getTargetType('target-space-0', project);

    if ((def_type == undefined) || (def_type == null)) {
        return 'float';
    }
    return def_type
}

function checkDefaultPipeType(key, project) {

    // This is only applicable when no type is already set
    if (project['data'][key]['-type'] !== undefined) {
        return;
    }

    // In case where this is first time opening
    // ML Pipeline, want to set to be first target datatype

    // Make sure only one pipeline
    var first = true;
   
    // If any model obj defined, then not first
    if (project['data'][key+'-model-space-model']['-obj-input'] !== undefined) {
        first = false;
    }

    // If any flex pieces added, then not first
    flex_pipe_pieces.forEach(piece => {
        var space_name = getSpaceName(key, piece);

        if (project['loading_spaces'][space_name]['n'] !== 0) {
            first = false;
        }
    });

    // If first, set ML pipeline type - and actually save
    // The idea is, once ML pipeline has been visited, then
    // the type should not seemingly randomly change
    if (first) {
        jQuery('#'+key+'-type').html(getDefaultType(project));
        project['data'][key]['-type'] = getDefaultType(project);
    }
}

function registerMLPipeType(key, project) {

    // Stop trigger card un-wrap
    jQuery('#'+key+'-type').on('click', function(e) {
        e.stopPropagation();
    });
    
    // Register on click actions
    jQuery('#'+key+'-type').on('click', function () {

        // Set to next type
        var p_types = ['regression', 'binary', 'categorical'];
        var current_ind = p_types.indexOf($(this).html());
        var new_ind = (current_ind + 1) % p_types.length;
        var new_val = p_types[new_ind];
        $(this).html(new_val);

        // Save to project
        project['data'][key]['-type'] = new_val;

        // Re-register type dep pieces
        reRegisterTypeDep(project);
    });

    // If undefined, set to target type
    if (project['data'][key]['-type'] == undefined) {
        jQuery('#'+key+'-type').html(getDefaultType(project));
    }

    // Otherwise set to saved
    else {
        jQuery('#'+key+'-type').html(project['data'][key]['-type']);
    }
}

function addMLPipe(project, key=undefined) {

    var space = 'pipe-space'

    if (key !== undefined) {
        var n = addExistingSpace(space, project, key, 1);
    }
    else {
        var initInfo = initNewSpace(space, project);
        var key = initInfo[0];
        var n = initInfo[1];
    }

    // Init if not already defined
    if (project['data'][key] == undefined) {
        project['data'][key] = {};
    }

    // Adds a unique id if there isn't one defined already
    addUniqueID(key, project);

    // Generate MLPipe html
    var html = getMLPipeHTML(key);

    // Add special input within card name
    var card_name = getCardNameHTML(key, "ML Pipeline name") +
    '<div class="col col-md-2" style="padding-left: 0px;">' +
    '<button class="btn btn-outline-dark btn-block"' +
    ' style="padding: 6 0px;" id="'+key+'-type"></button></div>';
    var card_html = cardWrapHTML(card_name, key, html, false, row_wrap=true);

    // Add to space
    jQuery('#'+space).append(card_html);

    // Register model pipeline type
    registerMLPipeType(key, project);

    // Add the static pipeline pieces
    addModel(project, getSpaceName(key, 'model'));
    addParameterSearch(project, getSpaceName(key, 'parameter_search'));

    var add_mapping = {
        'imputers': addImputer, 
        'scalers': addScaler,
        'transformers': addTransformer,
        'feature_selectors': addFeatureSelector
    }

    // Go through all the flex/optional pipelines pieces, and make sure loading_spaces
    // are init'ed and then fill in any already defined project pieces
    flex_pipe_pieces.forEach(piece => {
        var space_name = getSpaceName(key, piece);

        // Loading space init
        project['loading_spaces'][space_name] = {
            'data_fields': Array(),
            'n': 0
        }

        // Register click add, add for each flex piece
        jQuery('#add-'+space_name).on('click', function() {
            var k = add_mapping[piece](project, space_name);
            addScrollTo(k, 'add-'+space_name);
        });
    });

    // Add any existing from project
    getAllKeys(project).forEach(k => {
        flex_pipe_pieces.forEach(piece => {

            var space_name = getSpaceName(key, piece);

            console.log(space_name, piece, k);

            if ((k.includes(space_name)) && (!k.includes('model-space')) && (!k.includes('_'))) {
                add_mapping[piece](project, space_name, k);
            }
        });
    });

    // Register changable card name assoc. functions
    registerName(key, project);

    // Register card
    registerCard(key, project['data'][key]);

    // Register close button
    var cnt_id = 'pipe-count';
    var cnt_field = 'n_pipe';
    registerCloseButton(space, key, n, cnt_field, cnt_id, project);
    updateCnt(project, space, cnt_field, cnt_id);

    return key;
}

///////////
// Page //
/////////

function reRegisterTypeDep(project) {
    
    // If no change to type, they will just return empty
    getAllKeys(project).forEach(key => {

        var split_key = key.split('-');
        var indicator = split_key[split_key.length - 3];

        if (key.endsWith('model-space-model')) {
            registerModel(key, project);

            // Re-register any sub select models
            getSelectSubKeys(key, project).forEach(i => {
                registerModel(key+'_'+i, project);
            });
        }

        else if (indicator == 'feature_selectors') {
            registerTypeObjInput(key, 'feature_selectors',
                onSelectFeatureSelector, project);
        }
        else if (indicator == 'ensemble') {
            registerTypeObjInput(key, 'model', onSelectObj, project);
        }
        // If parameter search refresh changable val strats + loaded strat vals
        else if (indicator == 'parameter_search') {
            registerBaseValidationSelect(project, key);
            registerMetric(key, project);
            registerVals(project, key, '-group');
            jQuery('#' + key + '-' + project['data'][key]['split-type']).click();
        }

        // Refresh scope choices - if piece has scope
        if (project['data'][key]['-scope-input'] !== undefined) {
            refreshScopeChoices(key, project);
        }
    });
}

function displayMLPipe(project) {

    // Hide everything
    hideAllProjSteps()

    // If already loaded
    if (jQuery('#body-ml-pipe').html().length > 100) {

        // Display
        jQuery('#body-ml-pipe').css('display', 'block');

        // Check for initial default type change - i.e., if only one pipe
        if (project['loading_spaces']['pipe-space']['n_pipe'] == 1) {
            var n = project['loading_spaces']['pipe-space']['data_fields'][0];
            var key = 'pipe-space-' + n;
            checkDefaultPipeType(key, project);
        }
        
        // Re-register any type dep pieces
        reRegisterTypeDep(project);
        return;
    }

    // Reset loading pipe space
    project['loading_spaces']['pipe-space'] = {
        'data_fields': Array(),
        'n_pipe': 0
    }

    var html = '' +
    '<br>' +
    '<div id="pipe-space"></div>' +
    '<br>' +
    '<div class="form-row">' +
    '<div class="col-md-12">' +
        '<label style="padding-left: 5px">Add New:&nbsp</label>' +
        '<button class="btn btn-outline-secondary" id="add-pipe">ML Pipeline <span id="pipe-count" class="badge badge-light">0</span></button>' +
    '</div>' +
    '</div>';

    // Add + Display
    jQuery('#body-ml-pipe').append(html);
    jQuery('#body-ml-pipe').css('display', 'block');

    // Add any existing
    getAllKeys(project).forEach(key => {
        if (key.includes('pipe-space')) {
            var split_key = key.split('-');
            if (split_key.length == 3) {
                addMLPipe(project, key);
            }
        }
    });

    // If no previous
    if (project['loading_spaces']['pipe-space']['n_pipe'] == 0) {
        var key = addMLPipe(project);
        jQuery('#'+key+'-collapse').collapse("show");
        jQuery('#'+key+'-name').focus();
        
        // Make sure initially un-draggable
        jQuery('#'+key+'-space').prop('draggable', false);
    }

    // If just 1 ML pipeline, unroll it by default
    if (project['loading_spaces']['pipe-space']['n_pipe'] == 1) {
        var n = project['loading_spaces']['pipe-space']['data_fields'][0];
        var key = 'pipe-space-' + n;
        jQuery('#'+key+'-collapse').collapse("show");

        // Make sure initially un-draggable
        jQuery('#'+key+'-space').prop('draggable', false);
    }

    // Add new pipe
    jQuery('#add-pipe').on('click', function() {
        var key = addMLPipe(project);
        addScrollTo(key, 'add-pipe');
        jQuery('#'+key+'-name').focus();
    });    

}

// On document load
jQuery(document).ready(function() {

    // Load the ML options
    getMLOptions();

});


