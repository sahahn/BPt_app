function displaySetup(project) {

    // Hide everything
    hideAllProjSteps()

    // If already loaded
    if (jQuery('#body-setup').html().length > 100) {
        jQuery('#body-setup').css('display', 'block');
        return;
    }

    var project_key = project['key'];

    var key = 'setup'

    if (project['data'][key] == undefined) {
        project['data'][key] = {};
    }

    var name_label = getPopLabel(key, "Project Name ", "The name of this project");
    var seed_label = getPopLabel(key, 'Random Seed ', "Random Seed ");
    
    var cache_span = '<span data-toggle="popover"' +
    'title="Input Caching" data-placement="top"' +
    'data-content="If selected, during data loading a global input cache' +
    ' will be checked everytime a new variable ' +
    'or set is selected, and Data Type + Outlier options will be inferred ' +
    'based on the most frequent choices with respect to that variable. ' +
    'This feature is optional."' +
    '>Input Caching <i class="fas fa-info-circle fa-sm"></i></span>';

    var public_dist_span = '<span data-toggle="popover"' +
    'title="See Public Dists" data-placement="top"' +
    'data-content="Placeholder"' +
    '>See Public Dists <i class="fas fa-info-circle fa-sm"></i></span>';

    var html = '' + 
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

    '</div>' +
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
        '<label class="custom-control-label"</label>' + public_dist_span +
        '</div>' +
        '</div>' +

    '</div>';

    // Add + Display
    jQuery('#body-setup').append(html);
    jQuery('#body-setup').css('display', 'block');

    // Popovers
    registerPopovers()

    jQuery('#'+key+'-name').on('input', function() {

        // make sure no /'s or \s
        var input = $(this).val().replace(/[\/\\]/g, '');
        if ($(this).val() !== input) {
            $(this).val(input).trigger('input');
        }

        // Update side bar name
        var proj_name = jQuery('#'+project_key+'-project-name')
        proj_name.empty();
        proj_name.append($(this).val());

        // Update saved name in project
        project['name'] = $(this).val();

        // Update confirm delete name
        jQuery('#del-project-name').empty();
        jQuery('#del-project-name').append($(this).val());
    });

    // Update changes to random seed to project
    jQuery('#'+key+'-random-seed').on('input', function() {
        project['data'][key]['-random-seed'] = $(this).val();
    });
    if (project['data'][key]['-random-seed'] !== undefined) {
        jQuery('#'+key+'-random-seed').val(parseInt(project['data'][key]['-random-seed']));
    }
    jQuery('#'+key+'-random-seed').trigger('input');

    // Based on selection, either set v_cache to real cache or undefined
    jQuery('#'+key+'-input-cache').on('change', function() {
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
        input_val = isBool(project['data'][key]['-input-cache'])
    }
    jQuery('#'+key+'-input-cache').prop('checked', input_val).trigger('change');

    // Toggle to see public param dists or not
    jQuery('#'+key+'-public-dist').on('change', function() {
        project['data'][key]['-public-dist'] = $(this).prop('checked');

        if ($(this).prop('checked')) {
            param_dists['public'] = public_param_dists;
        }
        else {
            param_dists['public'] = {}
        }
    });

    // Init w/ default or saved
    var pd_val = true;
    if (project['data'][key]['-public-dist'] !== undefined) {
        pd_val = isBool(project['data'][key]['-public-dist'])
    }
    jQuery('#'+key+'-public-dist').prop('checked', pd_val).trigger('change');
}