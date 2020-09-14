var param_dists = {};
var public_param_dists;

var ignore_params = ['presort', 'min_impurity_split', 'random_state',
                     'cache_size', 'verbose', 'warm_start', 'n_jobs', 'oob_score',
                     'DSEL_perc', 'base_estimator', 'pool_classifiers', 'add_indicator',
                     'copy', 'missing_values', 'estimator', 'cols', 'return_df', 'handle_missing',
                     'handle_unknown', 'V_init', 'U_init', 'normalize_components', 'dict_init',
                     'silent', 'use_cat_names', 'copy_X'];
var param_types = ['-', 'str', 'bool', 'float', 'int', 'tuple'];
var dist_types = ['normal', 'log', 'choice', 'transition', 'code'];


function getParamDists() {

    // Get defaults
    jQuery.getJSON('php/get_json_in_cache.php', {'loc': 'default_param_dists.json'}, function(data) {
        param_dists['default'] = data;
    });

    // Get user param dists
    jQuery.getJSON('php/get_user_param_dists.php', function(data) {
        if ((data == undefined) || (data.length == 0)) {
            param_dists['user'] = {};
        }
        else {
            param_dists['user'] = data;
        }
    });

    // Init public dists as empty here
    param_dists['public'] = {};

    // And load seperate under public_param_dists global var
    getPublicParamDists();
}

function saveParamDists() {

    // Just save default + user
    var to_save_param_dists = {'user': param_dists['user']}
    jQuery.post('php/save_user_param_dists.php', to_save_param_dists);
}

function getPublicParamDists() {
    jQuery.getJSON('php/get_json_in_cache.php', {'loc': 'public_params.json'}, function(data) {
        public_param_dists = data;
        
    }).fail(function () {
        console.log('Note: no public dists found.');
        public_param_dists = {};
    });
}

function uploadPublicDists() {
    jQuery.post('php/upload_public_dists.php', param_dists['user']);
}

function getEditParamsHTML(key) {

    var p_descr = 'Parameters represent changable values for this object. Each parameter can either have a fixed ' + 
    'single value, or can alternatively be set with a distribution of values (to be searched over within the context of a hyper-parameter search). ' +
    'To toggle a parameter as a hyper-parameter you can press the button to the right of the parameter name ' +
    'which will trigger a new menu: <button class=\'btn btn-sm btn-outline-dark\'>' +
    '<i class=\'fa fa-industry\'></i></button>' +
    '<br><br>Note: in order to change the value of a hyper-parameter, you must first be on a user defined param dist. A user generated copy can be made ' +
    'from any of the existing default or public distributions via either the copy dist button, or by simply typing in a custom name into the  ' +
    'Parameter Distribution search select, and select that new custom value instead of an existing one. <br><br>Also note: the specific parameter descriptions ' + 
    'for each parameter (via the help icon) is automatically scraped from that objects base python documentation. Therefore, in some cases the descriptions may ' +
    'include non-relevant descriptions or other oddities.';
    var p_label = getPopLabel(undefined, 'Parameters ', p_descr);

    var p_dist_txt = 'Parameter Distributions represent collections of parameter values. They are split into default / unchangable pre-set distributions, ' +
    'user defined custom distributions and shared public distributions from other users (if this feature is enabled). The drop down menu below allows you to ' +
    'either select from an existing distribution or create a new distribution by typing in a custom name, and then selecting it. As a short hand, the Copy Dist button ' + 
    'is avaliable. Note that some parameter distributions, especially the first preset default ones, ussually contain only fixed values. On the other hand, some preset / default ' +
    'distributions may contain parameters set to themselves a distribution of parameters. In this case, if a parameter is set to a range of values to search over, then a ' + 
    'Parameter Search must be defined for this pipeline!';

    var type_descr = 'The parameter type button for each parameter is change-able. To change the type of a parameter ' +
    'click the type button until the desired type appears (which each press the type will change). The following types can be chosen:<br>' +
    
    '<br><b>str</b><br>' +
    'The str, or string python data type refers to non-numeric input values. These are often used ' +
    'to specify the choice of a specific parameter' +

    '<br><b>bool</b><br>' +
    'The bool type specifies that this value should be explicitly True or False. In python, 0 can also refer to False, and 1 to True. ' +
    'This type is often used to turn a certain feature of an object on or off.' +

    '<br><b>float</b><br>' +
    'The float type refers that the value should be loaded as a python floating point number. This ' + 
    'type is used to represent any numeric input, regardless of if it is an ordinal integer number.' +

    '<br><b>int</b><br>' +
    'The int type is used to specify explicitly that the value is an interger. E.g., 5. ' +
    'In some cases you may need to distinguish between integers and floats depending on how the ' +
    'argument structure of the parameter is setup. '+

    '<br><b>tuple</b><br>' +
    'The tuple represents a special python object sometimes used in parameters. Tuples are ordered ' +
    'non mutable list-like objects in python, e.g., (5,5) is a tuple with first element 5 and second element also 5.' +

    '<br><b>-</b><br>' +
    'The - type is a special type which indicates that native python syntax should be used in order to determine the ' +
    'the type internally. E.g., by passing a value wrapped in single or double quotations, then the str type will be inferred.' +
    'Further, passing a single number, e.g., 6, the int type will be inferred. By passing a number with a decimal, e.g., 6.5, the float ' +
    'type will be inferred. By passing values wrapped in a tuple, e.g., (5,5), then a tuple with two ints inside will be inferred. ' +
    'Note also that passing None with this type will pass the python value of None, which is a special type often used in parameters.' +
    '+Check the syntax of base python for more information / examples. Note also that in special cases small code blocks can be passed here.';

    var type_label = getPopLabel(undefined, 'Type ', type_descr);

    var html = '' +
    
    '<div class="modal fade" id="'+key+'-edit-popup" role="dialog"' +
     'aria-labelledby="'+key+'-modal-label" aria-hidden="true">' +
        '<div class="modal-dialog modal-xl" role="document">' +
          '<div class="modal-content">' +
            '<div class="modal-header">' +
              '<div class="container-fluid">' +

              '<div class="row">' +
              '<div class="col-sm-4" style="padding-left:0px;">' +
              '<h5 class="modal-title" id="'+key+'-modal-label">' +
              '<b><a id="'+key+'-params-name"></a>' + '</b></h5>' +
              '<br>' + p_label +
              '</div>' +

              '<div class="col-sm-7" style="padding-left:10px;">' +
              '<div class="row">' +

              '<label for="'+key+'-param-dist">' +
              '<span data-toggle="popover"' +
              'title="Parameter Distributions" data-placement="left"' +
              'data-content="' + p_dist_txt + '">' +
              'Parameter Distributions <i class="fas fa-info-circle fa-sm"></i></span>' +
              '</label>' +

              '<button class="btn btn-sm btn-danger" id="'+key+'-del-dist" style="margin-bottom: 20px; margin-left: 100px;">' +
              '<span id="'+key+'-del-dist-txt"></span></button>' +

              '<button class="btn btn-sm" id="'+key+'-copy-dist" style="margin-bottom: 20px; margin-left: 100px;">' +
              'Copy Dist</button>' +

              '<select id="'+key+'-param-dist" class="form-control" data-width="100%"></select>' +
              
              '</div>' +
              '</div>' +
              
              '<div class="col-sm-1" style="padding-right: 0px;">' +
              '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
              '<span aria-hidden="true">&times;</span>' +
              '</button>' +
              '<br><br>' + 
              '<div class="text-center" style="margin-top: 15px;">' +
              type_label +
              '</div>' + 
              
              '</div>' +

              '</div>' +
              '</div>' +

            '</div>' +

            '<div id="'+key+'-params-body" class="modal-body"></div>' +

          '</div>' +
        '</div>' +
      '</div>';

    return html;
}

function getDefaultParamVal(options, i, params, name) {

    // Init as just base val
    var def = options['default_params'][i];
    if (def == undefined) {
        def = '';
    }

    // If any saved values use that instead - unless saved as use default
    if ((params[name] !== undefined) && (params[name] !== 'USE-DEFAULT')) {
        def = params[name];
    }

    // Try replace all single quotes w/ double
    def = def.toString().replace(/[']/g, '"');
    return def;
}

function registerParamType(key, n, name, params, p_types) {

    var type_k = key + '-type-' + n;

    if (name == undefined) {
        jQuery('#'+type_k).css('display', 'none');
        return
    }
    else {
        jQuery('#'+type_k).css('display', 'block');
    }

    var param_type_name = name + '_type';

    // Unregister any previous
    jQuery('#'+type_k).off('click');

    // On click change type to next
    jQuery('#' + type_k).on('click', function() {

        // Set to next type
        var current_ind = p_types.indexOf($(this).html());
        var new_ind = (current_ind + 1) % p_types.length;
        var new_val = p_types[new_ind];
        $(this).html(new_val);

        // Save to project params
        params[param_type_name] = new_val;
    });

    // If undefined, set param_type to current default
    if (params[param_type_name] == undefined) {
        params[param_type_name] = jQuery('#' + type_k).html();
    }

    // If saved type not valid
    if (!p_types.includes(params[param_type_name])){
        params[param_type_name] = p_types[0];
    }

    // Set html to saved value
    jQuery('#'+type_k).html(params[param_type_name]);

}

function registerShowParamDist(key, n, name, params, dist_params) {

    var dist_k = key+'-dist-'+n;
    var input_b = key+'-b-input-'+n;
    var input_d = key+'-d-input-'+n;
    
    jQuery('#'+dist_k).on('click', function () {

        if ($(this).hasClass('active')) {

            // Toggle active state
            $(this).removeClass('active');

            // Show type + re-register with full choices
            jQuery('#' + key + '-type-' + n).css('display', 'block');
            registerParamType(key, n, name, params, param_types);

            // Show original input
            jQuery('#' + input_b).css('display', 'block');

            // Hide params
            jQuery('#' + input_d).css('display', 'none');

            // Save choice to params
            dist_params['on'] = false;
        }
        else {

            // Toggle active state
            $(this).addClass('active');

            // Hide base
            jQuery('#' + input_b).css('display', 'none');

            // The type should only hide if it is now not applicable
            var existing_choice = jQuery('input[name=' + key + '-dist-' + n + '-choice]:checked').val();

            if (existing_choice == 'normal') {
                registerParamType(key, n, existing_choice, params[name+'_dist'], ['float', 'int']);
            }
            else if (existing_choice == 'log') {
                registerParamType(key, n, existing_choice, params[name+'_dist'], ['float']);
            }
            else {
                registerParamType(key, n, existing_choice, params[name+'_dist'], ['-']);
            }

            // Show params
            jQuery('#' + input_d).css('display', 'block');

            // Save choice to params
            dist_params['on'] = true;
        }

    });

    // On init register the Param Dist always starts hidden,
    // so need to check here if previously saved on, and in that case
    // press the dist button
    if (isBool(dist_params['on'])) {
        jQuery('#'+key+'-dist-'+n).click();
    }
}

function getSelectParamOptions(p_options) {
    var cat_choices = Array();
    p_options.forEach(opt => {
        opt = opt.toString().replace(/[']/g, '"');
        cat_choices.push({ 'id': opt, 'text': opt });
    });
    return cat_choices;
}

function registerParamDistChoices(key, n, name, params, dist_params, dis) {

    if (params[name+'_dist'] == undefined) {
        params[name+'_dist'] = {};
    }
    
    var dist_options_k = key + '-dist-' + n + '-choice';
    jQuery('input[name=' + dist_options_k + ']').on('change', function() {

        var choice = $(this).val();
        dist_params['type'] = choice;

        // Handle showing
        dist_types.forEach(dist => {

            if (choice == dist) {
                jQuery('#' + key + '-if-' + dist + '-' + n).css('display', 'block');
            }
            else {
                jQuery('#' + key + '-if-' + dist + '-' + n).css('display', 'none');
            }
        });

        // Register correct choice
        if (choice == 'normal') {
            registerParamType(key, n, choice, params[name+'_dist'], ['float', 'int']);
        }
        else if (choice == 'log') {
            registerParamType(key, n, choice, params[name+'_dist'], ['float']);
        }
        else {
            registerParamType(key, n, choice, params[name+'_dist'], ['-']);
        }
            

    });

    // If any previous dist's selected, set choice
    if (dist_params['type'] !== undefined) {
        jQuery('input[name=' + dist_options_k + '][value="' + dist_params['type'] + '"]').trigger('click').blur();
    }

    if (dis) {
        jQuery('#'+dist_options_k+'-grp').removeAttr('data-toggle');
        jQuery('input[name=' + dist_options_k + ']').prop('disabled', true);
    }
}

function initDists(dist_params) {
    dist_types.forEach(dist => {
        if (dist_params[dist] == undefined) {
            dist_params[dist] = {};
        }
    });
}

function registerParamDistFields(key, n, dist_params, cat_choices, dis) {

    // Init if not init'ed
    initDists(dist_params);

    // Init extra cat choices for sub dists
    cat_choices.push({'id': 'Normal-1', 'text': 'Normal-1'});
    cat_choices.push({'id': 'Log-1', 'text': 'Log-1'});
    cat_choices.push({'id': 'Choice-1', 'text': 'Choice-1'});
    cat_choices.push({'id': 'Transition-1', 'text': 'Transition-1'});
    cat_choices.push({'id': 'Code-1', 'text': 'Code-1'});

    // Register both choice options
    ['choice', 'transition'].forEach(dist => {
        registerChoiceParamDist(key, n, dist, dist_params, cat_choices, false, dis);
    });

    // Save + register normal + log options
    ['normal', 'log', 'code'].forEach(dist => {
        registerScalerParamDist(key, n, dist, dist_params, false, dis);
    });
}

function onSubParamDist(if_key, html_func, val, base_key, base, type_key=undefined) {

    var new_dist = false;
    
    if ($('#' + if_key).html() == undefined) {
        var html = html_func(if_key, val, type_key);
        jQuery('#' + base_key).append(html);

        // Add choice
        var new_v = base + (parseInt(val.split('-')[1])+1).toString();
        var new_choice = new Option(new_v, new_v, false, false);
        jQuery('#'+base_key+'-choices').append(new_choice);

        new_dist = true;
    }

    // Make sure shown
    $('#' + if_key).css('display', 'block');

    return new_dist;
}

function registerNewSubChoiceDist(choice_obj, key, dist, n, dist_params, cat_choices, dis, subdist) {

    choice_obj.on('change', function() {

        // Extra funcs
        var base_key = key + '-if-' + dist + '-' + n;

        var p_dist_ind = dist;
        if (subdist) {
            p_dist_ind = dist+'-'+n;
        }

        // Make sure any new sub-dists are added
        $(this).val().forEach(val => {

            // Will just be undefined if regular param
            var p = val.split('-')[1];

            // If normal
            if (val.startsWith('Normal-')) {
                var if_key = base_key + '-if-normal-' + p;
                var type_key = base_key + '-type-' + p + 'n';
                var html_func = getNormalParamDistHTML;

                // Add + register only if not already added
                var new_dist = onSubParamDist(if_key, html_func, val, base_key, 'Normal-', type_key);
                if (new_dist) {
                    registerScalerParamDist(base_key, p, 'normal',
                        dist_params[p_dist_ind], true, dis);

                    registerParamType(base_key, p + 'n', val, dist_params[p_dist_ind], ['float', 'int']);
                }
            }
            else if (val.startsWith('Log-')) {
                var if_key = base_key + '-if-log-' + p;
                var type_key = base_key + '-type-' + p + 'l';
                var html_func = getLogParamDistHTML;

                // Add + register only if not already added
                var new_dist = onSubParamDist(if_key, html_func, val, base_key, 'Log-', type_key);
                if (new_dist) {
                    registerScalerParamDist(base_key, val.split('-')[1], 'log',
                        dist_params[p_dist_ind], true, dis);
                    registerParamType(base_key, p + 'l', val, dist_params[p_dist_ind], ['float']);
                }
            }
            else if (val.startsWith('Code-')) {
                var if_key = base_key + '-if-code-' + p;
                var type_key = base_key + '-type-' + p + 'z';
                var html_func = getCodeParamDistHTML;

                // Add + register only if not already added
                var new_dist = onSubParamDist(if_key, html_func, val, base_key, 'Code-', type_key);
                if (new_dist) {
                    registerScalerParamDist(base_key, val.split('-')[1], 'code',
                        dist_params[p_dist_ind], true, dis);
                    registerParamType(base_key, p + 'z', val, dist_params[p_dist_ind], ['-']);
                }
            }
            else if (val.startsWith('Choice-')) {
                var if_key = base_key + '-if-choice-' + p;
                var type_key = base_key + '-type-' + p + 'c';
                var html_func = getChoiceParamDistHTML;

                // Add + register only if not already added
                var new_dist = onSubParamDist(if_key, html_func, val, base_key, 'Choice-', type_key);
                if (new_dist) {
                    registerChoiceParamDist(base_key, val.split('-')[1], 'choice',
                        dist_params[p_dist_ind], cat_choices, true, dis);
                    registerParamType(base_key, p + 'c', val, dist_params[p_dist_ind], ['-']);
                }
            }
            else if (val.startsWith('Transition-')) {
                var if_key = base_key + '-if-transition-' + p;
                var type_key = base_key + '-type-' + p + 't';
                var html_func = getChoiceParamDistHTML;

                // Add + register only if not already added
                var new_dist = onSubParamDist(if_key, html_func, val, base_key, 'Transition-', type_key);
                if (new_dist) {
                    registerChoiceParamDist(base_key, val.split('-')[1], 'transition',
                        dist_params[p_dist_ind], cat_choices, true, dis);
                    registerParamType(base_key, p + 't', val, dist_params[p_dist_ind], ['-']);
                }
            }

        });
    });
}

function registerRemoveSubChoiceDist(choice_obj, key, dist, n) {
    choice_obj.on("select2:unselect", function (evt) {

        var base_key = key + '-if-' + dist + '-' + n;
        var remove_id = evt.params.data.id;
        var p = remove_id.split('-')[1];
        var if_key = undefined;

        if (remove_id.startsWith('Normal-')) {
            if_key = base_key + '-if-normal-' + p;
        }
        else if (remove_id.startsWith('Log-')) {
            if_key = base_key + '-if-log-' + p;
        }
        else if (remove_id.startsWith('Choice-')) {
            if_key = base_key + '-if-choice-' + p;
        }
        else if (remove_id.startsWith('Transition-')) {
            if_key = base_key + '-if-transition-' + p;
        }

        jQuery('#' + if_key).css('display', 'none');
    });
}

function registerChoiceParamDist(key, n, dist, dist_params, cat_choices, subdist=false, dis=false) {

    if (subdist) {
        if (dist_params[dist+'-'+n] == undefined) {
            dist_params[dist+'-'+n] = {}
        }
    }
    else {
        if (dist_params[dist] == undefined) {
            dist_params[dist] = {};
        }
    }

    var choices_key = key + '-if-' + dist + '-' + n + '-choices';
    var choice_obj = jQuery('#' + choices_key);

    // Set multiple select2
    choice_obj.select2({
        tags: true,
        data: cat_choices
    });

    // On change, proc funcs based on selection
    registerNewSubChoiceDist(choice_obj, key, dist, n, dist_params, cat_choices, dis, subdist);

    // Hide a sub-dist if removed
    registerRemoveSubChoiceDist(choice_obj, key, dist, n);

    // Handle if sub-dist
    var ps = dist_params[dist]
    if (subdist) {
        var ps = dist_params[dist+'-'+n];
    }

    // Save value on change
    choice_obj.on('change', function() {
        ps['-choices'] = $(this).val();
    })

    // Set existing if any
    var exist_vals = ps['-choices'];
    if (exist_vals !== undefined) {

        exist_vals = exist_vals.map(v => v.toString().replace(/[']/g, '"'));

        // If any option doesnt exist, add it
        exist_vals.forEach(val => {
            if (!choice_obj.find("option[value='" + val + "']").length) {
                var newOption = new Option(val, val, false, false);
                choice_obj.append(newOption);
            }
        });

        // Set vals
        choice_obj.val(exist_vals).trigger('change');
    }

    if (dis) {
        choice_obj.prop('disabled', true);
    }
}

function registerScalerParamDist(key, n, dist, dist_params, subdist=false, dis=false) {

    var if_dist = key + '-if-' + dist + '-' + n;
    var fields = ['-init', '-lower', '-upper'];

    if (dist == 'log') {
        fields.push('-exponent');
    }

    else if (dist == 'code') {
        fields = ['-code'];
    }

    fields.forEach(field => {
        var f_key = if_dist + field;

        if (subdist) {

            // Init if undefined
            if (dist_params[dist+'-'+n] == undefined) {
                dist_params[dist+'-'+n] = {}
            }
            registerSaveAndTrigger(f_key, dist_params[dist+'-'+n], field);
        }
        else {
            registerSaveAndTrigger(f_key, dist_params[dist], field);
        }

        if (dis) {
            jQuery('#'+f_key).prop('disabled', true);
        }
    });
}

function registerParamDist(key, n, name, params, cat_choices, dis) {

    // If param dist info not init'ed
    var param_dist_name = name + '_dist';
    if (params[param_dist_name] == undefined) {
        params[param_dist_name] = {};
    }

    var dist_params = params[param_dist_name];

    // On click make param dist, toggle shows
    registerShowParamDist(key, n, name, params, dist_params);

    // Register different dist. choices
    registerParamDistChoices(key, n, name, params, dist_params, dis);

    // Register the param 
    registerParamDistFields(key, n, dist_params, cat_choices, dis);
}

function registerParamInput(key, i, options, params, dis) {

    var name = options['param_names'][i];

    // Don't register any of the ignored params
    if (ignore_params.includes(name)) {return '';}

    var n = i.toString();
    var k = key+'-p-'+n;
    
    // Register select2 if choices
    var p_options = options['options'][i];
    var cat_choices = [params[name]];
    if (p_options !== '') {
        cat_choices = getSelectParamOptions(p_options);

        jQuery('#'+k).select2({
            tags: true,
            data: cat_choices,
        });

        // Select existing / default or add new choice
        var def = getDefaultParamVal(options, i, params, name);
        selectOrAdd(k, {'id': def, 'text': def});
    }

    // If not select2
    else {

        // Set value as default or saved
        var def = getDefaultParamVal(options, i, params, name);
        jQuery('#'+k).val(def).trigger('change');
    }

    // Register param dist
    registerParamDist(key, n, name, params, cat_choices, dis);

    // Register + save the param type
    registerParamType(key, n, name, params, param_types);

    // If dis, disable all inputs and hide delete
    if (dis) {
        disableParamInput(k, key, n);
    }
}

function disableParamInput(k, key, n) {

    // Disable all
    jQuery('#'+k).prop('disabled', true);
    jQuery('#'+key+'-dist-'+n).off('click');
    jQuery('#'+key+'-type-'+n).prop('disabled', true);
}

function getDistTypeHTML(key, n) {

    var dist_options_k = key+'-dist-'+n+'-choice';

    var hyp_txt = 'This option allows to specify this parameter as instead of one specific value, a ' +
    'distribution over different possible values (the choice of value to be optimized by the Parameter Search). ' +
    'There are a few different options for different types of hyper-parameter distributions, they are explained below: <br>' +
    '<br><b>Normal</b><br>' +
    'This represents a scalar variable with gaussian mutations, or in other words, ' +
    'a set of values spanning a Noraml distribution. One may set the initial value as well as ' +
    'an upper or lower bound. Note: that Type will be avaliable for this choice of distribution. If ' +
    'float, then floating point real values will be used, but if int, then values will be casted to integers ' +
    'before being passed as parameters.' +

    '<br><b>Log</b><br>' +
    'Log distributions are simmilar to Normal distributions, expect that the mutations occur in Log scale. ' +
    'That means this type of distribution is especially suitable for searching values of hyper-parameters which ' +
    'are distributed in log-space. The type for this distribution is fixed as float. You may set in addition to ' +
    'the initial value, upper and lower bounds, an exponent for the log mutation.' +

    '<br><b>Choice</b><br>' +
    'This represents an unordered categorical parameter, randomly choosing one of the provided choice options as a value. ' +
    'The choices can be further be nested distributions themselves (i.e., nested Log or Choice options). ' 
    'The chosen parameter is drawn randomly from the softmax of weights which are updated during the optimization. ' +
    'Since the chosen value is drawn randomly, the use of this variable makes deterministic functions become stochastic, hence adding noise. ' +
    'Note: types for values in choice are restricted to ' +
    'the - option, so they must be written in python style syntax.' +

    '<br><b>Transition</b><br>' +
    'Transition represent a transition choice, which is simillar to the choice distribution, but difers ' +
    'importantly in that it represents an ordered (vs. unordered) categorical variable. ' +
    'As with Choice, this parameter can accept nested hyper-parameter distributions as valid choices. ' +
    'On the backend, it tunes the weights between choices as the probability of a continuous transition. ' +
    'Note: types for values in transition choice are restricted to ' +
    'the - option, so they must be written in python style syntax.' +

    '<br><b>Code</b><br>' +
    'This last option represents a special advanced usage. Specifically, it allows the user ' +
    'to pass in a nevergrad valid distribution in python code. Code should be passed with the assumption ' +
    'that numpy is imported as np, and nevergrad is imported as ng. For example, you could pass ' +
    'ng.p.Choice(np.arange(0, 10)) to request the choice between integers 0 to 10. ' +
    'Please look up nevergrad for more specific advice on how to get started writing your own custom ' +
    'distributions in code.';

    var html = '' +
    '<label style="padding-left:0px; padding-right:20px;">' +
    '<span data-toggle="popover"' +
    'title="Hyper-Parameter Distribution Type" data-placement="left"' +
    'data-content="'+hyp_txt+'">' +
    'Dist. Type <i class="fas fa-info-circle fa-sm"></i></span>' +
    '</label>' +

    '<div class="btn-group-toggle btn-group" id="'+dist_options_k+'-grp" role="group" data-toggle="buttons">';

    // Add html button for each dist type
    dist_types.forEach(dist => {
        var dist_name = dist[0].toUpperCase() + dist.slice(1);
        html = html + '<label class="btn btn-secondary">' +
        '<input type="radio" name="'+dist_options_k+'" value="'+dist+'">'+dist_name+'</input>' +
        '</label>';
    });

    html = html + '</div>' +
    '<br><br>' + getIfParamDistHTML(key, n);

    return html;
}

function getDistFieldHTML(key, title, content, select=false, textarea=false) {

    var html = '' +
    '<div class="row" style="padding-bottom: 5px;">' + 

    '<label for="'+key+'" class="col-form-label col-sm-2" style="padding-left: 0px; padding-right: 0px;">' +
    '<span data-toggle="popover"' +
    'title="'+title+'"' +
    'data-placement="left"' +
    'data-content="'+content+'">'+title +
    ' <i class="fas fa-info-circle fa-sm"></i>' +
    '</span></label>' +

    '<div class="col col-sm-10" style="padding-left:20px;">';

    if (select) {
        html = html + '<select data-width="100%" class="form-control" id="'+key+'" multiple="multiple"></select>';
    }
    else {
        if (textarea) {
            html = html + '<textarea class="form-control" rows="3"  id="'+key+'"></textarea>';
        }
        else {
            html = html + '<input type="text" class="form-control" id="'+key+'">';
        }
    }

    html = html + '</div></div>';
    return html
}

function getBaseScalerDistHTML(if_key) {

    var html = '' +
    getDistFieldHTML(if_key+'-init', 'Init.', 'Init represents the initial value that this ' +
    'either Normal or Log distribution should start at. By default, if left empty, this will default to 0 (assuming also no value is passed to Upper ' +
    'or Lower). In the case that a value is passed to Upper and Lower, then this value if left empty will default to halfway between the passed bounds. ' +
    'If this is a log distribution, this value is still an absolute number, but you can pass python shorthands such as 1e5 for 10,000 or 1e-2 for .001.') +
    
    getDistFieldHTML(if_key+'-lower', 'Lower', 'The minimum value, if any, that this parameter can take. It is okay to leave this value empty ' +
    'if there is no minimum. This value should be smaller than any value passed to Upper. ' +
    'If this is a log distribution, this value is still an absolute number, but you can pass python shorthands such as 1e5 for 10,000 or 1e-2 for .001. ' +
    'Likewise, if a log distribution this value should be greater than 0!') +
    
    getDistFieldHTML(if_key+'-upper', 'Upper', 'The maximum value, if any, that this parameter can take. It is okay to leave this value empty ' +
    'if there is no maximum. This value should be greater than any value passed to Lower. ' +
    'If this is a log distribution, this value is still an absolute number, but you can pass python shorthands such as 1e5 for 10,000 or 1e-2 for .001.');

    return html;
}

function wrapBaseParamDistHTML(if_key, html, subtitle=undefined, type_key=undefined) {

    var return_html = '' +
    '<div id="'+if_key+'" class="container-fluid" style="display: none;">';

    if (subtitle !== undefined) {
        return_html = return_html + '<br>' +
        '<div class="row">' +
        '<div class="col-sm-10" style="padding-left: 0px;">' +
        '<b>'+subtitle+'</b>' +
        '</div>' + 
        
        '<div class="col-sm-2" style="padding-bottom: 5px;">' +
        '<button class="btn btn-outline-dark btn-block" id="'+type_key+'" style="padding: 6px;">' +
        'float</button></div>' +
        '</div>';
    }

    return_html = return_html + html + '</div>';
    return return_html;
}

function getNormalParamDistHTML(if_key, subtitle=undefined, type_key=undefined) {
    return wrapBaseParamDistHTML(if_key, getBaseScalerDistHTML(if_key), subtitle, type_key);
}

function getLogParamDistHTML(if_key, subtitle=undefined, type_key=undefined) {
    
    var html = '' +
    getBaseScalerDistHTML(if_key) + 
    getDistFieldHTML(if_key+'-exponent', 'Exp.', 'This is the exponent for the log mutation. ' +
    'An exponent of 2.0 will lead to mutations by factors between around 0.5 and 2.0. ' +
    'By default, it is set to either 2.0, or if the parameter is completely bounded ' +
    'to a factor so that bounds are at 3 sigma in the transformed space.');
    return wrapBaseParamDistHTML(if_key, html, subtitle, type_key);
}

function getChoiceParamDistHTML(if_key, subtitle=undefined, type_key=undefined) {

    var txt = 'This input field is used to select the values in which should be choices with the Choice or Transition Choice ' +
    'distribution. You may either select from any automatically generated values, add new values (by typing in what you want, and then clicking ' +
    'the choice as it appears, i.e., the select2 tagging feature), or select a nested hyper-parameter distribution as one of the choices. ' +
    'If selecting a nested hyper-parameter dist, the relevant params for that dist will pop up below. Note: types for values in choice are restricted to ' +
    'the - option, so they must be written in python style syntax.';

    return wrapBaseParamDistHTML(
        if_key, 
        getDistFieldHTML(if_key+'-choices', 'Choices', txt, select=true),
        subtitle, type_key);
}

function getCodeParamDistHTML(if_key, subtitle=undefined, type_key=undefined) {

    var txt = 'This is an advanced usage option. A nevergrad valid distribution can ' +
    'be specified here assuming that nevergrad is imported as ng and numpy is imported as np. ' +
    'Please view nevergrads documentation on how values should be formatted. This option is not ' +
    'reccomended for new users, but just provided if advanced users wish to specify a distribution ' +
    'not allowable via the other distribution choices. For example: <br>' +
    'ng.p.Array(init=(100, 100, 100)).set_mutation(sigma=50).set_bounds(lower=1, upper=300).set_integer_casting()<br>' +
    'Which specifies that an array of three values, each which takes on an initial value of 100, e.g., (100, 100, 100), be ' +
    'created, with bounds 1 to 300 for each one, a mutation of sigma 50, and forced integer casting.';

    return wrapBaseParamDistHTML(
        if_key, 
        getDistFieldHTML(if_key+'-code', 'Code', txt, select=false, textarea=true),
        subtitle, type_key);
}

function getIfParamDistHTML(key, n) {

    html = '' +
    getNormalParamDistHTML(key+'-if-normal-'+n) +
    getLogParamDistHTML(key+'-if-log-'+n) +
    getChoiceParamDistHTML(key+'-if-choice-'+n) +
    getChoiceParamDistHTML(key+'-if-transition-'+n) +
    getCodeParamDistHTML(key+'-if-code-'+n);

    return html;
}

function addParam(key, i, options) {

    var name = options['param_names'][i];
    if (ignore_params.includes(name)) {return '';}

    var n = i.toString();
    var docs_link = getDocsLink(options['docs_name']);
    var p_options = options['options'][i];

    var label = '<label for="'+key+'-p-'+n+'"class="col-form-label col-sm-3">' +
    '<span data-toggle="popover"' +
    'title="' + name + '"' +
    'data-placement="left"' +
    'data-content="' + clean_doc_link(options['descrs'][i], docs_link) + '">' + name +
    ' <i class="fas fa-info-circle fa-sm"></i>' +
    '</span></label>';

    var data_type = options['default_param_types'][i];
    if (data_type == 'NoneType') {
        data_type = 'str';
    }

    var dist_button = '<div class="col-sm-1" style="padding-left: 25px; padding-right: 10px;">' +
    '<button class="btn btn-outline-dark btn-block dist-button" id="'+key+'-dist-'+n+'" style="padding: 6px;">' +
    '<i class="fa fa-industry"></i></button></div>';

    var input_html = '<div class="col-sm-7" style="padding-left:0px; padding-right:0px;">';

    // Base input html
    input_html = input_html + '<div id="'+key+'-b-input-'+n+'">';
    if (p_options !== '') {
        input_html = input_html + '<select data-name="'+name+'" data-width="100%" class="form-control base-param" id="'+key+'-p-'+n+'"></select>';
    }
    else {
        input_html = input_html + '<input data-name="'+name+'" type="text" class="form-control base-param" id="'+key+'-p-'+n+'">';
    }
    input_html = input_html + '</div>';

    // Alt param dist input
    input_html = input_html + '<div id="'+key+'-d-input-'+n+'" style="display:none">' +
    getDistTypeHTML(key, n) + '</div>';

    input_html = input_html + '</div>';

    var data_type_button = '<div class="col-sm-1" style="padding-left: 10px;">' +
    '<button class="btn btn-outline-dark btn-block" id="'+key+'-type-'+n+'" style="padding: 6px;">' +
    data_type + '</button></div>';

    var params_html = '' +
    '<div class="form-group row">' +
    label + dist_button + input_html + data_type_button +
    '</div>';

    return params_html;
}

function refreshParams(options, key, params, dis) {
    
    // Add the html for this objects params
    var param_html = '';
    for (var i = 0; i < options['param_names'].length; i++) {
        param_html = param_html + addParam(key, i, options);
    }

    jQuery('#' + key + '-params-body').empty();
    jQuery('#' + key + '-params-body').append(param_html);

    // Save params values to project
    jQuery('.base-param').on('change', function () {
        params[$(this).data('name')] = $(this).val();
    });

    // Register inputs to params
    for (var i = 0; i < options['param_names'].length; i++) {
        registerParamInput(key, i, options, params, dis);
    }

    // Update for new popovers
    registerPopovers();
}

function getOptions(dists, obj_name) {

    if (dists[obj_name] == undefined) {
        dists[obj_name] = {};
        return [];
    }
    else {
        return Object.keys(dists[obj_name]);
    }
}

function getUserOptions(obj_name) {
    return getOptions(param_dists['user'], obj_name);
}

function getPublicOptions(obj_name) {
    return getOptions(param_dists['public'], obj_name);
}

function getDistChoices(options, obj_name) {

    var choices = [];

    var base_options = options['preset_params'];
    var user_options = getUserOptions(obj_name);
    var public_options = getPublicOptions(obj_name);
    
    choices.push({
        'text': 'Default',
        'children': arrayToChoices(base_options)
    });

    if (user_options.length > 0) {
        choices.push({
            'text': 'User',
            'children': arrayToChoices(user_options)
        });
    }

    if (public_options.length > 0) {
        choices.push({
            'text': 'Public',
            'children': arrayToChoices(public_options)
        });
    }

    choices.push({
        'text': 'Just Added',
        'children': []
    });

    return choices;
}

function setParamDistChoices(key, options, obj_name) {

    jQuery('#'+key+'-param-dist').empty().select2({
        tags: true,
        data: getDistChoices(options, obj_name)
    });

}

function updateParamsModal(key, options, project) {
    // Update Params Models gets called everytime the object changes

    // Clear any existing events bound to param dist
    jQuery('#'+key+'-param-dist').off('change');

    // Update card name on change
    jQuery('#'+key+'-param-dist').on('change', function() {
        updatePieceCardName(key, project);
    });

    // Save value on change
    jQuery('#'+key+'-param-dist').on('change', function() {
        project['data'][key]['param_dist'] = $(this).val();
    });

    // Set params name
    var obj_name = jQuery('#'+key+'-obj-input').find('option:selected').html();
    jQuery('#'+key+'-params-name').empty();
    jQuery('#'+key+'-params-name').append(obj_name);

    // Save obj name to project
    project['data'][key]['-obj-name'] = obj_name

    // Add choices of parameter distribution
    setParamDistChoices(key, options, obj_name);

    // If no param dist already selected, set to first one
    if (project['data'][key]['param_dist'] == undefined) {
        project['data'][key]['param_dist'] = options['preset_params'][0];
    }

    // Set to save previous selection
    jQuery('#'+key+'-param-dist').on('select2:select', function() {
         $(this).data('val', $(this).val());
    });

    // Set the selection of param dist
    jQuery('#'+key+'-param-dist').val(project['data'][key]['param_dist']).trigger('select2:select').trigger('change');
}

function registerParamsModal(key, options, project) {

    // First call update params modal
    updateParamsModal(key, options, project);

    jQuery('#'+key+'-param-dist').on('change', function() {

        var choice = $(this).val();
        var prev_val = $(this).data('val');
        var obj_name = project['data'][key]['-obj-name'];

        // Grab the correct params
        var params_and_dis = getParamsFromChoice(key, options, choice, obj_name, prev_val);
        var params = params_and_dis[0];
        var dis = params_and_dis[1];

        // Set params with correct values + registrations
        refreshParams(options, key, params, dis);

        // Register delete button
        jQuery('#'+key+'-del-dist-txt').empty().append('Delete Dist.')
        jQuery('#'+key+'-del-dist').off('click');

        // Register delete button
        if (!dis) {

            jQuery('#'+key+'-del-dist').css('display', 'block');
            jQuery('#'+key+'-copy-dist').css('display', 'none');

            jQuery('#'+key+'-del-dist').on('click', function() {

                if (jQuery('#'+key+'-del-dist-txt').html().includes('Dist.')) {
                    jQuery('#'+key+'-del-dist-txt').empty().append('Confirm Delete');
                }
                else {
                    delete param_dists['user'][obj_name][choice];
                    project['data'][key]['param_dist'] = options['preset_params'][0]
                    registerParamsModal(key, options, project);
                }
            });
        }
        else {
            jQuery('#'+key+'-del-dist').css('display', 'none');
            jQuery('#'+key+'-copy-dist').css('display', 'block');

            jQuery('#'+key+'-copy-dist').on('click', function() {

                jQuery('#'+key+'-param-dist').select2('open');

                var n = 1;
                var user_options = getUserOptions(obj_name);
                while (user_options.includes(choice + ' (' + n.toString() + ')')) {
                    n = n+1;
                }

                jQuery('span.select2-search.select2-search--dropdown > input').val(choice + ' (' + n.toString() + ')').trigger('input');
            });
        }
    });

    jQuery('#'+key+'-param-dist').trigger('change');
}

function getParamsFromChoice(key, options, choice, obj_name, prev_val) {

    if (choice == 'default') {
        return [{}, true];
    }
    
    // If in default choices
    else if (options['preset_params'].includes(choice)) {
        
        if (param_dists['default'][choice] == undefined) {
            param_dists['default'][choice] = {};
        }

        // Return a copy instead of direct reference
        // as this dist should not be changable
        var dist = param_dists['default'][choice];
        return [JSON.parse(JSON.stringify(dist)), true];
    }

    // If user added choice
    else if (getUserOptions(obj_name).includes(choice)) {
        
        if (param_dists['user'][obj_name][choice] == undefined) {
            param_dists['user'][obj_name][choice] = {};
        }

        return [param_dists['user'][obj_name][choice], false];
    }

    // If public
    else if (getPublicOptions(obj_name).includes(choice)) {

        if (param_dists['public'][obj_name][choice] == undefined) {
            param_dists['public'][obj_name][choice] = {};
        }

        // Return a copy instead of direct reference
        // as this dist should not be changable
        var dist = param_dists['public'][obj_name][choice];
        return [JSON.parse(JSON.stringify(dist)), true];
    }

    // If a new choice
    else {

        // Add as permenant option
        var newOption = new Option(choice, choice, false, true);
        $('#'+key+'-param-dist').append(newOption);

        param_dists['user'][obj_name][choice] = {};
        
        if (prev_val == undefined){
            return [param_dists['user'][obj_name][choice], false];
        }

        var prev_and_dis = getParamsFromChoice(key, options, prev_val, obj_name, undefined);
        var prev = prev_and_dis[0];

        if (prev !== undefined) {
            param_dists['user'][obj_name][choice] = JSON.parse(JSON.stringify(prev));
        }
        else {
            param_dists['user'][obj_name][choice] = {};
        }

        return [param_dists['user'][obj_name][choice], false];
    }
}

jQuery(document).ready(function() {
    
    // Load the User's param dists
    getParamDists();

});