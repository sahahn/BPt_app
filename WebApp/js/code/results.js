
/////////////////////
// Get HTML funcs //
///////////////////

function getResultsTableHTML(project) {

    var table_html = '' +
    '<table id="results-table" class="table table-striped" style="width:100%">' +
    '<thead><tr>' + 
    '<th scope="col">Job Name</th>' +
    '<th scope="col">Status</th>' +
    '<th scope="col">Type</th>' + 
    '<th scope="col">Target</th>' + 
    '<th scope="col">Pipeline</th>' + 
    '<th scope="col">Submitted</th>' + 
    '<th scope="col"></th>' +
    '<th scope="col"></th>' +
    '</tr></thead>' +
    '<tbody>';

    Object.keys(project['jobs']).forEach(job_name => {

        var job_params = project['jobs'][job_name]['params'];
        var eval_params = job_params['eval_params'];
        
        table_html +=
        '<tr>' +
        '<th scope="row" class="align-bottom">' + job_name + '</th>' +
        '<td class="align-bottom" data-sort="'+project['jobs'][job_name]['status']+'">' +
        '<div class="results-status" data-jobName="'+job_name+'"></div></td>' +
        '<td class="align-bottom">';

        if (job_params['script'] == 'evaluate.py') {
            table_html += 'Evaluate';
        }
        else {
            table_html += 'Test';
        }
        table_html += '</td>' +
        '<td class="align-bottom">' + eval_params['-target'] + '</td>' +
        '<td class="align-bottom">' + eval_params['pipeline_name'] + '</td>' +

        '<td class="align-bottom" data-sort="' + moment(eval_params['created']).valueOf() + '">' +
        moment(eval_params['created']).calendar() + '</td>' +

        '<td class="align-bottom"><button class="btn btn btn-primary results-view" ' +
        'data-jobName="'+job_name+'">' +
        'Show</button></td>' +

        '<td class="align-bottom"><button class="btn btn btn-danger results-delete" ' +
        'data-jobName="'+job_name+'">' +
        'Delete</button></td>' +
        '</tr>';
    });

    table_html += '</tbody></table>';

    return table_html;
}

function getBarHTML(key, ext, label, job_name) {

    var html = '' +

    '<div class="job-progress-bar" ' +
    'data-jobName="'+job_name+'" data-key="'+key+'" data-ext="'+ext+'">' +
    
    '<div class ="form-row">' +
    '<div style="padding: 2px;">' + label + '</div>' +
    '</div>' +

    '<div class="form-row">' +
    '<div class="col-md-10" id="'+key+'-bar-'+ext+'"></div>' +
    '<span id="'+key+'-text-'+ext+'"></span>' + 
    '</div>' +

    '</div>';

    return html;
}

function getJobStatusHTML(key, job_name) {

    var repeats_label = getPopLabel(undefined, 'Repeats ', 'Repeats refers to the current number of finished repeats, where repeats are set ' +
    'when submitting this job. It is the number of times in which the inner folds of the CV are repeated with different random seeds.');

    var folds_label = getPopLabel(undefined, 'Folds ', 'Folds refers to the current number of completed evaluate folds. ' +
    'For example, if an Evaluate job is submitted with K-folds set to 5, then this progress bar will be out of ' +
    '5. Or, if say set to Leave-Out-Group, this this number will reflect the number of unique groups. If any repeats are set ' +
    'These are considered seperately.');

    var search_label = getPopLabel(undefined, 'Search Params ', 'Search params refers to the current number of ' +
    'of completed hyper-parameter combinations tested. This will always be out of whatever was set as ' +
    'the search budget for the current ML Pipeline.');

    var html = '' +
    '<div id="'+key+'-progress" class="container-fluid">' +

    getBarHTML(key, 'repeats', repeats_label, job_name) +
    getBarHTML(key, 'folds', folds_label, job_name) +
    getBarHTML(key, 'search-iter', search_label, job_name) +

    '</div>';

    return html;
}
///////////////////
// Update funcs //
/////////////////

function parseProgress(output, job) {

    // Parse the progress
    // returns the percent done, but also
    // saves more detailed progress info

    if (job['progress'] == undefined) {
        job['progress'] = {};
    }

    var eval_params = job['params']['eval_params'];

    // Check if this job has a hyper-param search
    var n_search_iter = 1;
    if (eval_params['search-iter'] !== undefined){
        n_search_iter = parseInt(eval_params['search-iter']);
    }

    // If evaluate - test case only progress is params
    var n_repeats = 1;
    var n_folds = 1;
    var by_line = output.split('\n');

    if (by_line[0] !== 'test') {
        var first_line = by_line[0].split(',');
        n_repeats = parseInt(first_line[0]);
        n_folds = parseInt(first_line[1]);
    }

    // Save detailed out of info to progress
    job['progress']['n-search-iter'] = n_search_iter;
    job['progress']['n-repeats'] = n_repeats;
    job['progress']['n-folds'] = n_folds;

    // Total is n_repeats * n_folds * n_search_iter
    total_folds = n_repeats * n_folds;
    var total = (total_folds * n_search_iter);

    // Calculate current progress percent
    var last_line = by_line.length - 1;
    var search_iter = by_line[last_line].split(',').length - 1;
    var current = ((last_line-1) * n_search_iter) + search_iter;

    // Save current detailed progress
    var folds = (last_line-1) % n_folds ;
    var repeats = Math.floor((last_line-1) / n_folds);
    job['progress']['folds'] = folds;
    job['progress']['repeats'] = repeats;
    job['progress']['search-iter'] = search_iter;

    var percent_done = current / total
    job['progress']['percent_done'] = percent_done;

    // Return percent done out of 1
    return percent_done;
}

function updateJobs(project) {

    // Only check when results page is active
    if (project['last_active'] !== '-results') {
        return;
    }

    Object.keys(project['jobs']).forEach(jobName => {

        // Check the job status of every incomplete job
        var job = project['jobs'][jobName];
        var status = job['status'];

        if ((status !== "1") && (status != "-1") && (status != 'NaN')) {
            
            jQuery.getJSON('php/check_job_status.php', {
                'project_id': project['id'],
                'job_name': jobName 
            }, function (return_output) {

                // Handle the returned status as error, done or progress
                var output = return_output['status'];

                // Check for error
                if ((output["error"] !== undefined) || (status == 'NaN')) {
                    job['status'] = "-1";
                    job['error_msg'] = output["error"];
                }

                // If done, set to done / 1
                else if (output == 'done') {
                    job['status'] = "1";
                }

                // Otherwise set status as percent progress
                else {
                    job['status'] = parseProgress(output, job);
                }

                // Add the logs
                job['logs'] = return_output['logs'];
            });  
        }
    });

    // Trigger update status on table
    refreshJobsStatus(project);

    // Also trigger update any open (Show) job's progress
    refreshJobProgress(project);

    // Refresh job logs
    refreshJobLogs(project);

}

////////////
// Utils //
//////////

function getJobKey(job_name, project) {

    // Get job key as unique id / key as time created
    var job_params = project['jobs'][job_name];
    var eval_params = job_params['params']['eval_params'];
    var key = moment(eval_params['created']).valueOf().toString();

    return key;
}

//////////////////
// Status bars //
////////////////

function initProgressBar(container) {
    
    var bar = new ProgressBar.SemiCircle(container, {
        strokeWidth: 5,
        color: '#add8e6',
        trailColor: '#eee',
        trailWidth: 1,
        easing: 'easeInOut',
        duration: 1000,
        svgStyle: null,
        text: {
            value: '',
            alignToTop: false
        },

        from: { color: '#add8e6' },
        to: { color: '#007bff' },

        step: (state, bar) => {

            if (isNaN(bar.value())) {
                bar.setText('Error');
                bar.path.setAttribute('stroke', '#dc3545');
                bar.text.style.color = '#dc3545';
            }

            else {

                bar.path.setAttribute('stroke', state.color);

                if (bar.value() == 1) {
                    bar.setText('Done');
                }
                else if (bar.value() === -1) {
                    bar.setText('Error');
                }
                else {
                    bar.path.setAttribute('stroke', state.color);
                    bar.setText(Math.round((bar.value() * 100)) + '%');
                }

                bar.text.style.color = state.color;
            }
        }
    });
    bar.text.style.fontFamily = '"Raleway", Helvetica, sans-serif';
    bar.text.style.fontSize = '1rem';

    return bar;
}

function initSingleProgressBar(container, txt) {

    var bar = new ProgressBar.Line(container, {
        strokeWidth: 4,
        easing: 'easeInOut',
        duration: 1000,
        color: '#add8e6',
        trailColor: '#eee',
        trailWidth: 1,
        svgStyle: { width: '100%', height: '100%' },
        from: { color: '#add8e6' },
        to: { color: '#007bff' },
        
        step: (state, bar) => {
            bar.path.setAttribute('stroke', state.color);
            txt.css('color', state.color)
          }
    });

    return bar;
}

function refreshStatus(entry, project) {

    var data = entry.data();

    // Init progress bar only if not yet init'ed
    if (data['bar'] == undefined) {
        data['bar'] = initProgressBar(entry[0]);
    }

    // Grab assoc. job
    var job_name = data['jobname'];
    var job = project['jobs'][job_name];

    // Make sure status is string
    job['status'] = job['status'].toString();
    if (job['status'] == "NaN") {
        job['status'] = '-1';
    }

    // Want to update bar only if last_status is either undefined or
    // different from the current status
    if ((data['laststatus'] == undefined) || (data['laststatus'] !== job['status'])) {

        // Special cases for already done or error
        if ((job['status'] == "1") || (job['status'] == "-1")) {

            var color;
            var txt;

            if (job['status'] == "1") {
                color = '#28a745';
                txt = 'Done';
            } 
    
            else if ((job['status'] == "-1") || (job['status'] == "NaN")) {
                color = '#dc3545';
                txt = 'Error';
            }

            data['bar'].animate(parseFloat(job['status']), {
                    duration: 0,
                    from: { color: '#add8e6' },
                    to: { color: color },
            });

            // Have it wait before setting error text;
            window.setTimeout(function () {
                data['bar'].setText(txt);
            }, 300);
        } 
        else {
            data['bar'].animate(parseFloat(job['status']), {duration: 1000});
        }

        // Update the sort status
        entry.parent().data('sort', job['status']);

        // Set last status
        data['laststatus'] = job['status'];
    }

}

function refreshJobsStatus(project) {
    jQuery('.results-status').each(function () {
        refreshStatus($(this), project);
    });
}

function refreshBar(entry, project) {

    var data = entry.data();

    // Grab assoc. job
    var job_name = data['jobname'];
    var job = project['jobs'][job_name];

    var progress = job['progress'];
    var ext = data['ext'];
    var key = data['key'];

    // If already done / error, remove progress.
    if (job['status'] == "1") {
        loadResults(data['jobname'], key, project);
        jQuery('#'+key+'-progress').remove();
        return;
    }
    else if ((job['status'] == "-1") || (job['status'] == "NaN")) {
        jQuery('#'+key+'-progress').remove();
        showError(job_name, key, project);
        return;
    }

    // Skip + remove if out of 1
    if (progress['n-' + ext] == 1) {
        entry.remove();
        return;
    }

    // Proc potential init/update otherwise
    var bar_e = jQuery('#'+key+'-bar-'+ext);
    var text_e = jQuery('#'+key+'-text-'+ext);
    var bar_data = bar_e.data();
    
    // If not init'ed, init
    if (bar_data['bar'] == undefined) {
        bar_data['bar'] = initSingleProgressBar(bar_e[0], text_e);
    }

    // Check for change
    var out_of =  progress['n-' + ext];
    var current = progress[ext];

    if ((bar_data['laststatus'] == undefined) || (bar_data['laststatus'] !== current)) {

        // Update bar
        bar_data['bar'].animate(current / out_of);

        // Update text
        text_e.empty().append(current + '/' + out_of);

        // Save to element
        bar_data['laststatus'] = current;
    }
}

function refreshJobProgress(project) {

    jQuery('.job-progress-bar').each(function () {
        refreshBar($(this), project);
    });
}

function refreshJobLogs(project) {

    jQuery('.job-logs').each(function() {
        var data = $(this).data();

        // Grab assoc. job
        var job_name = data['jobname'];
        var job = project['jobs'][job_name];

        if ((data['prev_length'] == undefined) || (data['prev_length'] !== job['logs'].length)) {
            data['prev_length'] = job['logs'].length;

            var scrol_to_bot = false;
            if (($(this)[0].scrollHeight - $(this)[0].scrollTop) == $(this)[0].offsetHeight) {
                scrol_to_bot = true;
            }
            
            var parsed = job['logs'].replace(/\n/g, '<br>')
            $(this).empty().append(parsed);

            // If was scrolled to bottom, smooth scroll to bottom after adding new lines
            if (scrol_to_bot) {
                $(this)[0].scrollTo({
                    top: $(this)[0].scrollHeight + $(this)[0].offsetHeight,
                    behavior: 'smooth'
                });
            }
        }

        // Stop updating if done
        if ((job['status'] == "1") || (job['status'] == "-1")) {
            $(this).removeClass('job-logs');
        }
    });

}

////////////////
// Registers //
//////////////

function registerTable(project) {

    // Clear and add table html
    var table_html = getResultsTableHTML(project);
    jQuery('#results-table-space').empty().append(table_html);

    // Create data table
    var table = $('#results-table').DataTable({
        "lengthMenu": [[5, 10, 25, 50, -1], [5, 10, 25, 50, "All"]],
        "scrollX": false,
        "searching": true,
        "paging": true,
        "info": true,
        "autoWidth": true,
        "order": [[ 5, "desc"]],
        "columnDefs": [
            {"orderable": false, "targets": [-1, -2]},
        ]
    });

    // Register refresh status on each re-draw
    $('#results-table').on('draw.dt', function() {
        
        // Refresh each status
        refreshJobsStatus(project);

        // Re-register show jobs
        registerJobsShow(project);

        // Re-register delete jobs
        registerJobsDelete(project, table); 

        // Rerefresh confirm delete
        refreshConfirmDelete();
    });
    
    // Trigger once to init
    $('#results-table').trigger('draw.dt');
}

function registerJobsShow(project) {

    // Remove any previous registers
    jQuery('.results-view').off('click');

    // Add remove job register to each shown button
    jQuery('.results-view').on('click', function() {

        var job_name = $(this).data()['jobname'];
        var job_params = project['jobs'][job_name];

        // Set unique id / key as time created
        var key = getJobKey(job_name, project);
        var space_name = key + '-space';

        // If not already open - show space
        if (jQuery('#'+space_name).html() == undefined) {

            var card_body = '' +

                '<div class="form-row">' +

                '<div class="col col-md-6" id="'+key+'-error" style="display: none;"></div>' + 
                '<div class="col col-md-6" id="'+key+'-loading" style="display: none;"><h5 class="text-center">Loading Job Results...</h5></div>' +
                
                '<div class="col col-md-6" id="'+key+'-progress">' +
                getJobStatusHTML(key, job_name) +
                '</div>' +

                '<div class="col col-md-6" id="'+key+'-output" style="display: none"></div>' +

                '<div class="col-md-6">' +
                '<div class="text-center">' +
                '<button class="btn btn-outline-dark" id="'+key+'-toggle-logs" data-toggle="button" aria-pressed="false" autocomplete="off">Toggle Logs</button>' +
                '</div>' +
                '<div class="job-logs" id="'+key+'-logs" data-jobName="'+job_name+'" ' +
                'style="height: 500px; background-color: rgba(0,0,0,.03); overflow-y: scroll; margin: 3em; padding: 3em; display: none"></div>' +
                '</div>' +


                '<div class="col col-md-12 text-center" id="'+key+'-raw-preds" style="padding-top: 10em;"></div>' +

                '</div>';

            // Add the card
            var card_name = '<b>Show</b>: <i>' + job_name + '</i>';
            var card_html = cardWrapHTML(card_name, key, card_body, false);
            jQuery('#results-show-space').prepend(card_html);


            // Set logs button to toggle logs visibility
            jQuery('#'+key+'-toggle-logs').on('click', function() {
                if (!$(this).hasClass('active')) {
                    jQuery('#'+key+'-logs').css('display', 'block');
                } 
                else {
                    jQuery('#'+key+'-logs').css('display', 'none');
                }
            });

            // Make un-draggable
            jQuery('#'+key+'-space').prop('draggable', false);

            // If already done / error, remove progress.
            if (job_params['status'] == "1") {
                loadResults(job_name, key, project);
                jQuery('#'+key+'-progress').remove();
            }
            else if ((job_params['status'] == "-1") || (job_params['status'] == "NaN")) {
                jQuery('#'+key+'-progress').remove();
                showError(job_name, key, project);
            }

            // Register remove
            jQuery('#'+key+'-remove').on('click', function () {
                jQuery('#'+key+'-space').remove();
            });

            // Unwrap on show
            jQuery('#'+key+'-collapse').collapse("show");
    
            // Make sure updated
            refreshJobProgress(project);

            // Update popovers
            registerPopovers();
        }
    });

}

function registerJobsDelete(project, table) {

    // Remove any previous registers
    jQuery('.results-delete').off('click');

    // Add remove job register to each shown button
    jQuery('.results-delete').on('click', function() {

        // On first click, set to confirm
        if ($(this).data('clicked') == undefined) {
            $(this).data('clicked', 'true');
            $(this).html('Confirm');
        }

        // Only delete if already set to confirm
        else {
            var job_name = $(this).data()['jobname'];

            // Check if open/shown, and delete if so
            var job_space = getJobKey(job_name, project) + '-space';
            if (jQuery('#'+job_space).html() !== undefined) {
                jQuery('#'+job_space).remove();
            }

            // Delete from project
            delete project['jobs'][job_name];

            // Delete from saved
            jQuery.post('php/delete_job.php', {
                'project_id': project['id'],
                'job_name': job_name
            });

            // Delete row
            table.row($(this).parents('tr')).remove().draw();
        }
    });
}

function refreshConfirmDelete() {

    // This function is called on every table re-draw
    // as a way of resetting the confirm back to delete
    jQuery('.results-delete').each(function () {
        if ($(this).data('clicked') !== undefined) {
            delete $(this).data('clicked');
            $(this).html('Delete');
        }
    });
}

function showError(job_name, key, project) {

    jQuery('#'+key+'-error').css('display', 'block');
    jQuery('#'+key+'-error').empty().append(project['jobs'][job_name]['error_msg']);
}

function procBaseTableResults(table_key, table_results_html, label) {

    var table_html = table_results_html.replace('TEMP-ID', table_key);

    var html = '' +
    '<div class="form-row">' +
    '<div class="col">' +
    '<div class="d-flex justify-content-center">' +
    '<h5><b>' + label + '</b></h5>' +
    '</div>' +
    '</div>' +
    '</div>' +

    '<div class="form-row">' +
    '<div class="col col-md-12">' +
    table_html + 
    '</div>' +
    '</div>' +
    
    '<div class="form-row" style="padding-top: 5px;">' +
    '<div class="col">' +
    '<div class="d-flex justify-content-center">' +
    '<div id="'+table_key+'-buttons"></div>' +
    '</div>' +
    '</div>' +
    '</div>';

    return html;
}

function loadRawPreds(job_name, key, project) {

    // Show loading
    jQuery('#'+key+'-raw-preds-loading').css('display', 'inline-block');

    var params = {};
    params['n'] = job_name;
    params['script'] = 'show_raw_preds.py';
    params['project_id'] =  project['id'];

    jQuery.post('php/run_quick_py.php', {
        'params': params
    }, function (output) {

        var raw_table_key = key +'-raw-table'
        var raw_descr = 'These are the raw computed predictions from this Evaluate or Test run. This table includes ' +
        'the baseline target in addition to the predicted values (which will vary based on problem type, e.g., binary will include ' +
        'thresholded predictions and raw probability predictions). Likewise, if an Evaluate job, the predicted scores will be in a column with ' +
        'the name of that Repeat, e.g., column 1 will represent the predicted scores from the first repeat, and column 2 from the second. The column ' +
        '1_fold, will then listen which fold for the first repeat each prediction was made in. If a prediction was not made for a subject within a repeat, ' +
        'then it will contain an NaN. Note that you may also download a csv or excel spreadsheet with these raw predictions.';
        var raw_label = getPopLabel(key, "Raw Predictions ", raw_descr);
        var raw_html = procBaseTableResults(raw_table_key, 
                                            output['raw_preds'],
                                            raw_label);
        jQuery('#'+key+'-raw-preds').empty().append(raw_html);

        var raw_table = $('#'+raw_table_key).DataTable({
            data: output['pred_rows'],
            scrollX: true,
            dom: 'lBfrtip',
            searching: true,
            buttons: [
                'csvHtml5',
                {extend: 'excelHtml5', title: ''},
            ],
            paging: true,
            info: true,
            autoWidth: true,
            lengthChange: true,
            "lengthMenu": [[5, 10, 25, 50, -1], [5, 10, 25, 50, "All"]],
        });

        // Add buttons under table
        raw_table.buttons().container().appendTo($('#'+raw_table_key+'-buttons'));

        // Register new popovers
        registerPopovers();

    }, "json").fail(function (xhr, textStatus, errorThrown) {
        alert('error ' + textStatus + xhr + errorThrown);
    });

}

function loadResults(job_name, key, project) {

    // If already loading, stop
    if (jQuery('#'+key+'-loading').css('display') == 'block') {
        return;
    }
    jQuery('#'+key+'-loading').css('display', 'block');

    var params = {};
    params['n'] = job_name;
    params['script'] = 'show_results.py';
    params['project_id'] =  project['id'];

    jQuery.post('php/run_quick_py.php', {
        'params': params
    }, function (output) {

        // Remove loading indicator
        jQuery('#'+key+'-loading').css('display', 'none');

        // Add summary table
        var sum_table_key = key +'-summary-table';
        var summary_descr = 'Summary Scores contains a table with computed scores from the either Evaluae or Test job. ' +
        'Metric refers to the metric listed in the rest of the Row. Mean Score, is the mean metric as computed across all of the folds + repeats. ' +
        'Score referes to a single score, e.g., in the case of a Test job. STD refers to the standard deviation across folds in computed score. Macro STD ' +
        'refers to the standard deviation across repeats (i.e., between the mean metrics from each set of folds). Micro STD refers to the standard deviation across ' +
        'all folds, regardless of which repeat it was part of. Note the buttons at the bottom for downloading or exporting these results.';
        var summary_label = getPopLabel(key, "Summary Scores ", summary_descr);
        var summary_html = procBaseTableResults(sum_table_key, 
                                                output['table_html'],
                                                summary_label);

        jQuery('#'+key+'-output').css('display', 'block');
        jQuery('#'+key+'-output').append(summary_html);

        // Init data table with download buttons
        var table = $('#'+sum_table_key).DataTable({
            dom: 'Bfrtip',
            buttons: [
                {extend: 'copyHtml5', title: ''},
                'csvHtml5',
                {extend: 'excelHtml5', title: ''},
                {extend: 'pdfHtml5', title: 'Job: "'+job_name+'" Summary Scores'}
            ],
            searching: false,
            paging: false,
            info: false,
            autoWidth: true,
        });

        // Add buttons to special spot centered under table
        table.buttons().container().appendTo($('#'+sum_table_key+'-buttons'));

        // Add a button to load raw preds if desired

        var logs_html = '<button class="btn btn-outline-dark" id="'+key+'-show-raw-preds" ' +
                        'data-toggle="button" aria-pressed="false" autocomplete="off">Show By Subject Predictions' +
                        '<img id="'+key+'-raw-preds-loading" src="images/loading.gif" aria-hidden="true" style="display: none; width: 1.5em;"></img>' +
                        '</button>';
        jQuery('#'+key+'-raw-preds').append(logs_html);

        jQuery('#'+key+'-show-raw-preds').on('click', function() {
            loadRawPreds(job_name, key, project);
        });

        // Register new popovers
        registerPopovers();

        
    }, "json").fail(function (xhr, textStatus, errorThrown) {
        alert('error ' + textStatus + xhr + errorThrown);
    });



}

///////////////////
// Main display //
/////////////////


function displayResults(project) {

    // Hide everything
    hideAllProjSteps()

    // If already loaded
    if (jQuery('#body-results').html().length > 100) {
        jQuery('#body-results').css('display', 'block');
        registerTable(project);
        return;
    }

    // Init key
    var key = 'results'
    if (project['data'][key] == undefined) {
        project['data'][key] = {};
    }
    
    var html = '' +
    '<div id="results-table-space"></div>' +
    '<hr><br>' + 
    '<div id="results-show-space"></div>';

    jQuery('#body-results').append(html);
    jQuery('#body-results').css('display', 'block');

    // Add table
    registerTable(project);

    // Get initial status
    updateJobs(project);

    // Start loop to check for active jobs
    active_jobs_interval = setInterval(function() {
        updateJobs(project);
    }, 3000);
}