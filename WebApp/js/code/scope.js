function getScopeLabelHTML(key) {

    var scope_descr = 'Scope refers to an optional subset of features that this object (if within model building) ' +
    'or evaluation should be limited to. Note that selecting multiple scopes indicates that the union or combination of all selected scopes be used. ' +
    'Their are a few special scope options listed under By Type, these are All, for indiciating that all avaliable features should be used, ' +
    'Continuous to indicate that all Cont. / float type variables should be used, and Categorical to indicate that all binary + categorical ' +
    'variables should be selected.';

    var scope_label = getPopLabel(key, "Scope ", scope_descr, '-scope-input');

    return scope_label;
}

function getScopeHTML(key) {

    var scope_label = getScopeLabelHTML(key);

    var html = '' +
    '<div class="form-group col-md-6">' +
    scope_label + 
    '<select id="'+key+'-scope-input" class="form-control" data-width="100%" multiple="multiple"></select>' +

    '<div id="'+key+'-scope-input-val" class="invalid-feedback">' +
    'Scope may not be empty!' +
    '</div>' +

    '</div>';

    return html;
}

//////////////////////
// Scope functions //
////////////////////

function getScopeChoices(project) {

    var choices = Array();
    choices.push({"id": '', "text": ''});

    // Grab all choices seperately
    var sep = getAllInputChoices(project);

    // Add to choices as sub-options
    choices.push({'text': 'By Type', 'children': sep['by_type_choices']});

    if (sep['set_choices'].length > 0) {
        choices.push({'text': 'Sets', 'children': sep['set_choices']});
    }
    if (sep['data_var_choices'].length > 0) {
        choices.push({'text': 'Data Variables', 'children': sep['data_var_choices']});
    }
    if (sep['set_var_choices'].length > 0) {
        choices.push({'text': 'Set Variables', 'children': sep['set_var_choices']});
    }
    
    return choices;
}

function refreshScopeChoices(key, project) {

    // Set choices
    jQuery('#'+key+'-scope-input').empty().select2({
        placeholder: 'Select Scope(s)',
        data: getScopeChoices(project)
    });

    // Set existing val
    var exist_input = project['data'][key]['-scope-input'];
    if (exist_input !== undefined) {
        jQuery('#'+key+'-scope-input').val(exist_input).trigger('change');
    }
}

function registerScope(key, project, default_val) {

    var scope = jQuery('#'+key+'-scope-input');

    // Add scope options
    refreshScopeChoices(key, project);

    // Add when deleting a choice doesn't re-open the selections
    // selectDontOpen(key+'-scope-input');

    // Save to project on change
    scope.on('change', function() {
        project['data'][key]['-scope-input'] = $(this).val();
    });

    // If no existing val, set default
    var exist_input = project['data'][key]['-scope-input'];
    if (exist_input == undefined) {
        scope.val(default_val).trigger('change');
    }

    // Register updating input validation on new select
    scope.on('select2:select', function() {
        validateGenericInput(key, project['data'][key], '-scope-input');
    });
}