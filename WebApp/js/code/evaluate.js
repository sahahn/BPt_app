
////////////////////
// Evaluate HTML //
//////////////////

function getTargetHTML(key) {

    var target_content = 'Within the context of a BPt job submission, you can only predict a single target at a time. ' +
    'This variable controls which loaded target (if multiple) should be predicted. Note that depending on the loaded type of this ' +
    'variable, the options for valid ML Pipelines will be restricted. For example, if loaded as Continuous, then only ML Pipelines set ' +
    'to type regression will appear as valid options. Likewise, binary for binary and categorical for categorical.';
    var target_label = getPopLabel(key, 'Target ', target_content);

    var html = '' +
    '<div class="form-group col-md-6">' +
    target_label +
    '<select id="'+key+'-target" class="form-control" data-width="100%"></select>' +

    '<div id="'+key+'-target-val" class="invalid-feedback">' +
    'You must select a target!' +
    '</div>' +

    '</div>';

    return html;
}

function getPipelineHTML(key) {

    var pipeline_content = 'Select which ML Pipeline to use.' +
    '<br><br><b>Note:</b><br>Only valid pipelines are shown below, which means that ' +
    'only those with the right corresponding type to the selected target will be ' +
    'shown. In addition, the pipeline must be valid in that there is at the very ' +
    'minimum a selected Model!';
    var pipeline_label = getPopLabel(key, 'ML Pipeline ', pipeline_content);

    var html = '' +
    '<div class="form-group col-md-6">' +
    pipeline_label +
    '<select id="'+key+'-pipeline" class="form-control" data-width="100%"></select>' +
    
    '<div id="'+key+'-pipeline-val" class="invalid-feedback">' +
    'You must select a pipeline!' +
    '</div>' +

    '</div>';

    return html;
}

function getMetricsHTML(key) {

    var metrics_content = 'Select one or more metrics to comptue for this evaluation. Avaliable ' +
    'metrics are determined by the problem type (e.g., regression). Please refer to the scikit-learn documentation ' +
    'https://scikit-learn.org/stable/modules/model_evaluation.html ' +
    'for more information on ' +
    'what each metric specifically computes.'
    var metrics_label = getPopLabel(key, 'Metrics ', metrics_content);

    var html = '' +
    '<div class="form-group col-md-6">' +
    metrics_label +
    '<select id="'+key+'-metrics" class="form-control" data-width="100%" multiple="multiple"></select>' +

    '<div id="'+key+'-metrics-val" class="invalid-feedback">' +
    'You must select atleast one metric!' +
    '</div>' +

    '</div>';

    return html;
}

function getEvalSubjectsHTML(key) {

    var subj_overlap_txt = 'Selecting a subset of subjects in which to perform modeling on is foremost an optional step. ' +
    'If not value is provided here, or to Subset-Subjects by Non-Input Value, then the full avaliable set of subjects will be used. ' +
    'On the otherhand, if subjects are provided, then the overlap will be computed between the passed subjects and the set of subjects ' +
    'considered by the type of job submission (i.e., if running Evaluate, then the set of train subjects are used, but if running Test then ' +
    'train + test  - aka all subjects are used).'

    var file_input_content = 'This option allows you to define that only a subset of subjects be used in modelling via file upload. ' +
    'The file containing the subjects in which to subset by should be formatted as a text file with one subject per line. ' + subj_overlap_txt;

    var file_input_label = getPopLabel(key, 'Subset-Subjects from File ', file_input_content);

    var from_strat_content = 'This option allows you to define that only a subset of subjects be used in modeling via selecting values from loaded ' +
    ' Non-Input variables. Note: Load/Show must have been called on the Non-Input variable during Data Loading in order for it to appear as option here. ' +
    subj_overlap_txt;
    
    var from_strat_label = getPopLabel(key, 'Subset-Subjects by Value ', from_strat_content);

    var html = addSubjectsInputRowHTML(key, file_input_label, from_strat_label,
                                      'eval', row_class=' mb-5 ml-5 mr-5 mt-3');
    html = '<div class="text-center"><i>Optional</i></div><hr>' + html;
    return html;

}

function getEvaluateHTML(key) {

    var html = '' +
    '<div class="form-row m-5">' +
        getTargetHTML(key) +
        getPipelineHTML(key) +
    '</div>' +

    '<div class="form-row m-5">' +
        getMetricsHTML(key) +
        getScopeHTML(key) +
    '</div>' +

    getEvalSubjectsHTML(key) +

    '<hr>' + 

    '<div class="form-row m-5">' +
    '<div class="col text-center" style="padding-left: 30%; padding-right: 30%">' +
      '<button class="btn btn-primary btn-lg btn-block" id="'+key+'-eval-submit" ' +
      'data-toggle="modal" data-target="#'+key+'-submit">Evaluate</button>' +
      '<button class="btn btn-primary btn-lg btn-block" id="'+key+'-test-submit" ' +
      'data-toggle="modal" data-target="#'+key+'-submit">Test</button>' +
    '</div>' +

    '</div>';

    return html;
}

//////////////////
// Submit HTML //
////////////////

function getBaseSubmitHTML(key) {

    var html = '' +
    '<div class="modal fade" id="'+key+'-submit" role="dialog" ' +
    'aria-labelledby="'+key+'-modal-label" aria-hidden="true">' +
        '<div class="modal-dialog modal-lg" role="document">' +
            '<div class="modal-content">' +
                
                '<div class="modal-header">' +
                    '<h5 id="'+key+'-modal-label" class="modal-title" style="padding-left:15px;"></h5>' +
                    '<button type="button" class="close" data-dismiss="modal" aria-label="Close">' +
                    '<span aria-hidden="true">&times;</span>' +
                '</div>' +

                '<div class="modal-body">' +
                    '<div class="container-fluid" id="'+key+'-submit-body">' +
                    '</div>' +
                '</div>' +

            '</div>' +
        '</div>' +
    '</div>';

    return html;
}

function addJobNameHTML(key) {

    var job_name_content = 'The name this job should be submitted under. Note, this is the name this ' + 
    'job will appear under within the Results table. This job name must also be unique.';
    var job_name_label = getPopLabel(key, 'Job Name ', job_name_content);

    var n_jobs_content = 'The number of processors this job should be submitted with. Note: ' +
    'If the underlying model does not benefit from multiple cores, then only 1 will be used. Also ' +
    'in rare cases (e.g., with some search strategies), using more than n_jobs == 1 will trigger an error.';
    var n_jobs_label = getPopLabel(key, 'Num. Jobs ', n_jobs_content);
    
    var html = '' +
    '<div class="row">' +
    
    '<div class="form-group col-md-8">' +
        job_name_label +
        '<input type="text" class="form-control" id="'+key+'-job-name" placeholder="" value="">' +

        '<div id="'+key+'-job-name-existing" class="invalid-feedback">' +
        'This job name already exists!' +
        '</div>' +

        '<div id="'+key+'-job-name-val" class="invalid-feedback">' +
        'You must supply a job name!' +
        '</div>' +
    '</div>' +

    '<div class="form-group col-md-4">' +
        n_jobs_label +
        '<input id="'+key+'-n-jobs" type="number" class="form-control" step="1" min="1" title="Number of proc. to use"></input>' +
    '</div>' +
    '</div>';

    return html;
}

function addSubmitButtonHTML(key) {

    var html = '' +
    '<div class="row">' +
    '<div class="form-group col-md-12">' +

        '<div class="col text-center" style="padding-left: 30%; padding-right: 30%; padding-top: 10px;">' +
        '<button class="btn btn-primary btn-lg btn-block" id="'+key+'-job-submit">Submit Job' +
        '<img id="'+key+'-loading" src="images/loading.gif" aria-hidden="true" style="display: none; width: 30px;"></img>' +
        '</button>' +

    '</div>' +
    '</div>';

    return html;

}

function getSubmitEvalHTML(key) {

    var splits_content = 'Splits in this context defines the outer CV behavior for this Evaluation. ' +
    'Evaluate represents testing a Model Pipeline in a specific context on the training set, or a sub-sample of ' +
    'the training set. This option allows you to define the specific splits of the CV behavior in which the Pipeline ' +
    'should be evaluated. ' +  
    'There are a few different selectable CV strategies selectable from the tab below:<br>' +
    getEachSplitInfoText();

    var splits_label = getPopLabel(key, 'Splits ', splits_content);

    var val_strat_label = getPopLabel(key, 'Validation Strategy ', getValidationStratText());
    
    var html = '' +
    addJobNameHTML(key) + 

    '<div class="row">' +
    '<div class="form-group col-md-12">' +
    getSplitsHTML(key, splits_label) + 
    '</div>' +
    '</div>' +

    '<div class="row">' +
    '<div class="form-group col-md-12">' +
    getValStratHTML(key, val_strat_label) + 
    '</div>' +
    '</div>' +

    addSubmitButtonHTML(key);

    return html;
}

function getSubmitTestHTML(key) {

    var html = '' +
    addJobNameHTML(key) +
    addSubmitButtonHTML(key);

    return html;
}


////////////
// Utils //
//////////

function getDefaultMetrics(project, key) {
    
    var target_type = getTargetType(project['data'][key]['-target'], project);
    
    var default_vals = {
        'binary': ['roc_auc', 'matthews'],
        'regression': ['r2', 'neg_mean_squared_error'],
        'categorical': ['roc_auc_ovr', 'matthews']
    };

    return default_vals[target_type];
}

////////////////////////////////
// Generate Choice Functions //
//////////////////////////////

function getTargetChoices(project) {

    var choices = [];

    getAllKeys(project).forEach(key => {
        
        if (key.includes('target-space')) {
            if (validateVariable(key, project['data'][key])) {
                
                choices.push({
                    'id': key,
                    'text': getVarReprName(key, project)
                });
            }
        }
    });

    return choices;
}

function getPipelineChoices(key, project) {

    var target_type = getTargetType(project['data'][key]['-target'], project);
    var choices = [''];

    getAllKeys(project).forEach(k => {

        // If pipeline
        if ((k.includes('pipe-space')) && (k.split('-').length == 3)) {

            // If valid pipeline
            if (validatePipeline(k, project)) {

                // Grab the pipe type (if undefined, then still as same type as first target)
                var pipe_type = project['data'][k]['-type'];
                if (pipe_type == undefined) {
                    pipe_type = getTargetType('target-space-0', project);
                }

                // If same type as target
                if (pipe_type == target_type) {

                    choices.push({
                        'id': k,
                        'text': project['data'][k]['-name']
                    });
                }
            }
        }
    });

    return choices;
}

function getMetricsChoices(key, project) {

    var target_type = getTargetType(project['data'][key]['-target'], project);
    return getMetricChoices(target_type);
}

/////////////////////
// File Functions //
///////////////////

function changeEvalFile(key, project, file) {

    // Change file text
    var fileName = file.split("\\").pop();
    changeFileText(key, fileName);

    // If non-empty clear any selected from strat val
    if (fileName.length > 0) {
        jQuery('#'+key+'-var-input').val(null).trigger('change');
    }

    // Refresh the train only files
    refreshEvalFiles(project)
}

function refreshEvalFiles(project) {
    refreshFiles(['eval'], 'evaluate-space', project);
}


/////////////////////////
// Register Functions //
///////////////////////

function registerTargetChoices(key, project) {

    var target = jQuery('#'+key+'-target');

    // Register select choices
    target.select2({
        'data': getTargetChoices(project)
    });

    // Registers
    registerProjectVal(key, project, '-target', 'target-space-0');

    // Re-register type-dep pipeline + metrics on change
    target.on('change', function() {
        registerPipelineChoices(key, project);
        registerMetricsChoices(key, project);
    });

    // Call val on select
    target.on('select2:select', function() {
        validateGenericInput(key, project['data'][key], '-target');
    });
}

function registerPipelineChoices(key, project) {

    var pipeline = jQuery('#'+key+'-pipeline');

    // Remove any previous
    pipeline.off('change select2:select');

    // Register select choices
    pipeline.empty().select2({
        'placeholder': 'Select a ML Pipeline',
        'data': getPipelineChoices(key, project)
    });

    // Save to project
    registerProjectVal(key, project, '-pipeline', '');

    // Call val on change
    pipeline.on('select2:select', function() {
        validateGenericInput(key, project['data'][key], '-pipeline');
    });
}

function registerMetricsChoices(key, project) {

    var metrics = jQuery('#'+key+'-metrics');

    // Remove any previous
    metrics.off('change select2:select');

    // Register select choices
    metrics.empty().select2({
        'placeholder': 'Select Metrics',
        'data': getMetricsChoices(key, project)
    });

    // Save to project
    registerProjectVal(key, project, '-metrics', []);

    // If existing values empty:  set to default
    if (metrics.val().length == 0) {
        metrics.val(getDefaultMetrics(project, key)).trigger('change');
    }

    // Call val on change
    metrics.on('select2:select', function() {
        validateGenericInput(key, project['data'][key], '-metrics');
    });

}

function registerEvaluatePieces(key, project) {
    
    // Choice of target
    registerTargetChoices(key, project);

    // Choice of pipeline
    registerPipelineChoices(key, project);

    // Metrics + def. metrics
    registerMetricsChoices(key, project);

    // Scope
    registerScope(key, project, ['all']);

    // Optional subject Sub-Sett-'ing'-er
    registerSubjectsInput(key, project, 'evaluate-space', changeEvalFile);
}

function registerEvaluate(key, project) {
    
    // Register evaluate pieces
    registerEvaluatePieces(key, project);
    
    // Popovers
    registerPopovers();
}

function registerJobName(key, project) {

    jQuery('#'+key+'-job-name').on('input', function() {

        // make sure no /'s or \s
        var input = $(this).val().replace(/[\/\\]/g, '');
        if ($(this).val() !== input) {
            $(this).val(input).trigger('input');
        }

        project['data'][key]['-job-name'] = input;
    });

    // Set existing if any
    if (project['data'][key]['-job-name'] !== undefined) {
        jQuery('#'+key+'-job-name').val(project['data'][key]['-job-name']).trigger('input');
    }

    // Update validation w/ changes
    jQuery('#'+key+'-job-name').on('input', function() {
        validateJobName(key, project['data'][key], Object.keys(project['jobs'])); 
    });
}

function registerNJobs(key, project) {

    jQuery('#'+key+'-n-jobs').on('change', function() {
        project['data'][key]['n-jobs'] = $(this).val();
    });

    var def = 1;
    if (project['data'][key]['n-jobs'] !== undefined) {
        def = project['data'][key]['n-jobs'];
    }

    jQuery('#'+key+'-n-jobs').val(def).trigger('change');
}

//////////////////////////
// Params helper funcs //
////////////////////////

function getPieceHyperParams(obj_name, param_dist) {

    if (param_dists['user'][obj_name] == undefined) {
        param_dists['user'][obj_name] = {};
    }

    if (param_dists['public'][obj_name] == undefined) {
        param_dists['public'][obj_name] = {};
    }

    var all_options = [param_dists['default'],
                       param_dists['user'][obj_name],
                       param_dists['public'][obj_name]];
    var return_params;


    // Check different dist types
    all_options.forEach(options => {

        var options_keys = Object.keys(options);
        var index = options_keys.indexOf(param_dist);

        if (index !== -1) {
            return_params = options[options_keys[index]]
        }

    });

    return return_params;
}

function getBaseEvalParams(key, project) {

    // Start with copy
    var params = getBaseParams(key, project);

    // Replace scope with processed
    params['-scope-input'] = processScopes(params['-scope-input'], project);

    // Replace target with explicit var name
    params['-target'] = getVarReprName(params['-target'], project);

    // Get pipeline name
    params['pipeline_name'] = jQuery('#'+key+'-pipeline').find('option:selected').html();

    // Add created time
    params['created'] = moment().toISOString();

    // Set the problem type
    params['problem_type'] = getTargetType(project['data'][key]['-target'], project);

    // Set the val params
    var v_strat_key = project['data'][key]['val-strategy-key']
    params['val_params'] = getValParams(v_strat_key, project);

    // Set the random state
    params['random_state'] = project['data']['setup']['-random-seed'];

    // Get subset subjs from file
    if (project['data'][key]['file'] == undefined) {
        project['data'][key]['file'] = '';
    }
    if (project['data'][key]['file'].length > 0) {
        params['subjs_file'] = project['files']['eval'];
    }

    // Get by val
    params['subjs_by_val'] = checkByValEntry('', key, project);

    // Get all pipeline params
    var pipeline_params = {}
    getAllKeys(project).forEach(k => {
        if (k.startsWith(params['-pipeline'])) {
            pipeline_params[k] = getBaseParams(k, project);

            // Replace scope with processed, if scope
            if (Object.keys(pipeline_params[k]).includes('-scope-input')) {
                pipeline_params[k]['-scope-input'] = processScopes(pipeline_params[k]['-scope-input'], project);
            }

            // If contains a hyper param dist add it
            if (Object.keys(pipeline_params[k]).includes('param_dist')) {
                pipeline_params[k]['params'] = getPieceHyperParams(pipeline_params[k]['-obj-name'],
                                                                   pipeline_params[k]['param_dist']);
            }

            // If the param search & search type not none, get nested val params
            if (k.includes('-parameterSearch-space-parameterSearch')) {
                if (pipeline_params[k]['-search-type'] !== 'None') {
                    var p_v_strat_key = pipeline_params[k]['val-strategy-key'];
                    pipeline_params[k]['val_params'] = getValParams(p_v_strat_key, project);
                    
                    // Record search iter more conv.
                    params['search-iter'] = pipeline_params[k]['-n-iter'];
                }
            }
        }
    });

    params['pipeline_params'] = pipeline_params;
    return params;
}

function getSumbitJobParams(key, project) {

    var params = {};

    // Add the loading params
    params['loading_params'] = getAllLoadedDataParams(project);

    // Add the test params
    params['test_params'] = getTestParams('test-space', project);

    // Add the evaluate params
    params['eval_params'] = getBaseEvalParams(key, project);

    return params;

}

//////////////////
// Submit code //
////////////////


function registerJobSubmit(key, project, script) {
    
    // Remove previous register
    jQuery('#'+key+'-job-submit').off('click');
    jQuery('#'+key+'-job-submit').on('click', function() {

        if (validateSubmitJob(key, project)) {

            // Set to loading
            jQuery('#'+key+'-loading').css('display', 'inline-block');

            // Get the params
            var params = getSumbitJobParams(key, project);
            params['script'] = script;
            params['n'] = project['data'][key]['-job-name'];
            params['project_id'] = project['id'];

            // Submit the job to run
            submitPy(params);

            // Define a local function, checkInitialJob to make
            // sure job submits correctly before closing screen
            var cnt = 0;
            function checkInitialJob(interval_var, project, params) {

                jQuery.getJSON('php/check_initial_job.php', {
                    'project_id': params['project_id'],
                    'job_name': params['eval_params']['-job-name'] 
                }, function (output) {    
                    
                    
                    if (output == "started") {

                        // Add the job if started okay
                        // TODO add other descriptors here?
                        project['jobs'][params['eval_params']['-job-name']] = {
                            'status': "0",
                            'params': params
                        };

                        atEndSubmit(interval_var, key);
                    }
            
                    else if (output["error"] !== undefined) {
                        alert('Error with job:' + output["error"]);
                        atEndSubmit(interval_var, key);
                    }

                    // If job hasn't been confirmed as started after 10 seconds
                    cnt += 1
                    if (cnt == 50) {
                        alert('Unknown error!');
                        atEndSubmit(interval_var, key);
                    }
            
            
                }).fail(function (xhr, textStatus, errorThrown) {
                    alert('Error checking submission ' + textStatus + xhr + errorThrown);
                    atEndSubmit(interval_var, key);
                });
            }

            // Set check to loop every 500ms
            var interval_var = setInterval(function() {
                checkInitialJob(interval_var, project, params);
            }, 500);

        }
    });
}

function atEndSubmit(interval_var, key) {
    $('.modal').modal('hide');
    clearInterval(interval_var);
    jQuery('#' + key + '-loading').css('display', 'none');
}

function registerSubmitEval(key, project) {

    // Set HTML
    jQuery('#' + key + '-submit-body').empty().append(getSubmitEvalHTML(key));
    jQuery('#' + key + '-modal-label').empty().append('<b>Evaluate</b>');

    // Registers
    registerJobName(key, project);
    registerNJobs(key, project);
    registerSplitsRow(key, project);
    registerPopovers();

    // Register submit job
    registerJobSubmit(key, project, 'evaluate.py');
}

function registerSubmitTest(key, project) {

    // Set HTML
    jQuery('#' + key + '-submit-body').empty().append(getSubmitTestHTML(key));
    jQuery('#' + key + '-modal-label').empty().append('<b>Test</b>');

    // Base registers
    registerJobName(key, project);
    registerNJobs(key, project);
    registerPopovers();

    // Register submit job
    registerJobSubmit(key, project, 'test.py');
}

///////////
// Main //
/////////

function displayEvaluate(project) {

    // Hide everything
    hideAllProjSteps()

    // For now, just re-load everytime from scratch
    // as most registers need to be re-loaded if anything changes, 
    // and they should all be quick
    jQuery('#body-evaluate').empty();

    // Init key
    var key = 'evaluate-space'
    if (project['data'][key] == undefined) {
        project['data'][key] = {};
    }

    // Get + set base page HTML
    var html = getEvaluateHTML(key);
    jQuery('#body-evaluate').append(html);
    jQuery('#body-evaluate').css('display', 'block');

    // Empty + add submit modal
    jQuery('#submit-modals').empty()
    jQuery('#submit-modals').append(getBaseSubmitHTML(key, '-submit'));

    // Add eval as data type
    project['data'][key]['data_type'] = 'eval';

    // All base registers
    registerEvaluate(key, project);

    // Register Eval submit button popup
    jQuery('#'+key+'-eval-submit').on('click', function(e) {
        
        if (!validatePreSubmitJob(key, project['data'][key])) {
            e.stopPropagation();
        }

        registerSubmitEval(key, project);
    });

    // Register Test submit button popup
    jQuery('#'+key+'-test-submit').on('click', function() {

        if (!validatePreSubmitJob(key, project['data'][key])) {
            e.stopPropagation();
        }

        registerSubmitTest(key, project);
    });
}



    
