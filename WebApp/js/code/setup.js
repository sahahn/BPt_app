



function getFirstRowHTML(key, project) {

    var name_txt = "The name of this project. Project names are non-unique, but most user's will likely want them to have a unique name."
    var name_label = getPopLabel(key, "Project Name ", name_txt);

    var seed_txt = 'Random seeds are almost always a good idea in a scientific context.' +
    ' Essentially what this parameter controls is the seed to a fixed random number generator. ' +
    'This will ensure that almost every process which used randomness in BPt will be replicable if ' +
    're-run. For example, if generating a new random Test Split, if the random seed does not change and the ' +
    'loaded subjects also do not change, then the same random split will be generated every time.'
    var seed_label = getPopLabel(key, 'Random Seed ', seed_txt);

    var html = ''
    '<div class="form-row m-5">' +
        '<div class="form-group col-md-6">' +
        name_label +
        '<input autocomplete="off" type="text" class="form-control" id="'+key+'-name"' +
        'placeholder="" value="'+project['name']+'">' +
        '</div>' +

        '<div class="form-group col-md-2">' +
        seed_label +
        '<br>' +
        '<input class="form-control" type="number" id="'+key+'-random-seed" value=222 min="0">' + 
        '</div>' +

    '</div>';

    return html;
}

function getDefaultEventNameHTML() {

    var txt = "This allows you to define the default eventname used for loading variables.";
    var label = getPopLabel("event_default", "Default Eventname ", txt);

    var html = '' +
    '<div class="form-row m-5">' +
    '<div class="form-group col-md-6">' +
    label +
    '<select id="event_default" class="form-control" data-width="100%"></select>' +
    '</div>' +
    '</div>';

    return html;
}

function getSetupTogglesRowHTML(key) {

    var cache_span = '<span data-toggle="popover"' +
    'title="Input Caching" data-placement="top"' +
    'data-content="If selected, during data loading a global input cache' +
    ' will be checked everytime a new variable ' +
    'or set is selected, and Data Type + Outlier options will be inferred ' +
    'based on the most frequent choices with respect to that variable. ' +
    'This feature is optional. If used a single user context, then this will just ' +
    'reflect your prior choices, but if used in a multi-user context, this will take into account ' + 
    'other users choices as well."' +
    '>Input Caching <i class="fas fa-info-circle fa-sm"></i></span>';

    var public_dist_span = '<span data-toggle="popover"' +
    'title="See Public Dists" data-placement="top"' +
    'data-content="This parameter is only relevant for now in a multi-user context. ' +
    'What that means is, unless BPt is being hosted on a server where multiple users can ' +
    'use the application, then this parameter wont change anything. If in a multi-user context, ' + 
    'then this will optionally show you any public parameter distributions for specific pipeline objects ' +
    ' that other users have decided to share. In the future, BPt will hopefully support sharing these distributions ' + 
    'across different single user versions of BPt."' +
    '>See Public Dists <i class="fas fa-info-circle fa-sm"></i></span>';

    var html = '' +
    '<div class="form-row m-5">' +

        '<div class="form-group col-md-3">' +
        '<div class="custom-control custom-checkbox">' +
        '<input type="checkbox" class="custom-control-input" id="'+key+'-input-cache">' +
        '<label for="'+key+'-input-cache" class="custom-control-label"></label>' + cache_span +
        '</div>' +
        '</div>' +

        '<div class="form-group col-md-3">' +
        '<div class="custom-control custom-checkbox">' +
        '<input type="checkbox" class="custom-control-input" id="'+key+'-public-dist">' +
        '<label for="'+key+'-public-dist" class="custom-control-label"></label>' + public_dist_span +
        '</div>' +
        '</div>' +

    '</div>';

    return html;
}

function registerProjectName(key, project) {
    
    jQuery('#' + key + '-name').on('input', function () {

        // make sure no /'s or \s
        var input = $(this).val().replace(/[\/\\]/g, '');
        if ($(this).val() !== input) {
            $(this).val(input).trigger('input');
        }

        // Update side bar name
        var proj_name = jQuery('#' + project['key'] + '-project-name');
        proj_name.empty();
        proj_name.append($(this).val());

        // Update saved name in project
        project['name'] = $(this).val();

        // Update confirm delete name
        jQuery('#del-project-name').empty();
        jQuery('#del-project-name').append($(this).val());
    });
}

function registerRandomSeed(key, project) {
    jQuery('#' + key + '-random-seed').on('input', function () {
        project['data'][key]['-random-seed'] = $(this).val();
    });
    if (project['data'][key]['-random-seed'] !== undefined) {
        jQuery('#' + key + '-random-seed').val(parseInt(project['data'][key]['-random-seed']));
    }
    jQuery('#' + key + '-random-seed').trigger('input');
}

function registerEventDefault(key, project) {
    
    // Register choice of event default
    jQuery('#event_default').select2({
        data: arrayToChoices(events)
    });

    // On change event default, save to project + update val in settings
    jQuery('#event_default').on('change', function () {
        project['data'][key]['event_default'] = $(this).val();
        settings['event_default'] = $(this).val();
    });

    // If undefined, set to first event
    if (project['data'][key]['event_default'] == undefined) {
        project['data'][key]['event_default'] = events[0];
    }

    // Set with current value   
    jQuery('#event_default').val(project['data'][key]['event_default']).trigger('change');
}

function registerInputCacheState(key, project) {

    // Based on selection, either set v_cache to real cache or undefined
    jQuery('#' + key + '-input-cache').on('change', function () {
        project['data'][key]['-input-cache'] = $(this).prop('checked');

        if ($(this).prop('checked')) {
            v_cache = v_real_cache;
        }
        else {
            v_cache = undefined;
        }
    });

    // Init w/ default or saved
    var input_val = true;
    if (project['data'][key]['-input-cache'] !== undefined) {
        input_val = isBool(project['data'][key]['-input-cache']);
    }
    jQuery('#' + key + '-input-cache').prop('checked', input_val).trigger('change');
}

function registerPublicDistState(key, project) {
    
    // Toggle to see public param dists or not
    jQuery('#' + key + '-public-dist').on('change', function () {
        project['data'][key]['-public-dist'] = $(this).prop('checked');

        if ($(this).prop('checked')) {
            param_dists['public'] = public_param_dists;
        }
        else {
            param_dists['public'] = {};
        }
    });

    // Init w/ default or saved
    var pd_val = true;
    if (project['data'][key]['-public-dist'] !== undefined) {
        pd_val = isBool(project['data'][key]['-public-dist'])
    }
    jQuery('#'+key+'-public-dist').prop('checked', pd_val).trigger('change');
}


function displaySetup(project) {

    // Hide everything
    hideAllProjSteps()

    // If already loaded
    if (jQuery('#body-setup').html().length > 100) {
        jQuery('#body-setup').css('display', 'block');
        return;
    }

    var key = 'setup'
    if (project['data'][key] == undefined) {
        project['data'][key] = {};
    }
    
    // Get HTML
    var html = '' + 
    getFirstRowHTML(key, project) + 
    getDefaultEventNameHTML(key) +
    getSetupTogglesRowHTML(key);

    // Add + Display
    jQuery('#body-setup').append(html);
    jQuery('#body-setup').css('display', 'block');

    // Registers
    registerPopovers()
    registerProjectName(key, project);
    registerRandomSeed(key, project);
    registerInputCacheState(key, project);
    registerPublicDistState(key, project);
    registerEventDefault(key, project);        
}








