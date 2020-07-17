function displayResults(project) {

    // Hide everything
    hideAllProjSteps()

    // If already loaded
    if (jQuery('#body-results').html().length > 100) {
        jQuery('#body-results').css('display', 'block');
        refreshTable(project);
        return;
    }

    // Init key
    var key = 'results'
    if (project['data'][key] == undefined) {
        project['data'][key] = {};
    }
    
    var html = '<div id="results-table-space"></div>';
    jQuery('#body-results').append(html);
    jQuery('#body-results').css('display', 'block');

    // Add table
    refreshTable(project);

    // Get initial status
    updateJobs(project);

    // Start loop to check for active jobs
    active_jobs_interval = setInterval(function() {
        updateJobs(project);
    }, 1000);
}

function refreshTable(project) {

    // Clear and add table html
    var table_html = getResultsTableHTML(project);
    jQuery('#results-table-space').empty().append(table_html);

    // Create data table
    $('#results-table').DataTable({
        "scrollX": true,
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
        refreshAll(project);

        // Re-register delete jobs
        jQuery('.results-delete').off('click');
        jQuery('.results-delete').on('click', function() {
            var job_name = $(this).data()['jobname'];
            console.log('delete ' + job_name);


            // Delete from project
            delete project['jobs'][job_name];

            // Delete from saved
            jQuery.post('php/delete_job.php', {
                'project_id': project['id'],
                'job_name': job_name
            });

            // Delete row
            $(this).parent().parent().remove();

        }); 

    });
    
    // Trigger once to init
    $('#results-table').trigger('draw.dt');
}

function refreshAll(project) {
    jQuery('.results-status').each(function () {
        refreshStatus($(this), project);
    });
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

        if ((status !== "1") && (status != "error")) {
            
            jQuery.getJSON('php/check_job_status.php', {
                'project_id': project['id'],
                'job_name': jobName 
            }, function (output) {

                // If done, set to done / 1
                if (output == 'done') {
                    job['status'] = "1";
                }

                // Check for error
                else if (output["error"] !== undefined) {
                    job['status'] = "-1";
                    job['error_msg'] = output["error"];
                }

                // Otherwise set status as percent progress
                else {
                    job['status'] = parseProgressPercent(output, job['params']['eval_params']);
                }
            });  
        }
    });

    // Trigger update status
    refreshAll(project);
}

function parseProgressPercent(output, eval_params) {

    // Check if this job has a hyper-param search
    var search_iter = 1;
    if (eval_params['search-iter'] !== undefined){
        search_iter = parseInt(eval_params['search-iter']);
    }

    var by_line = output.split('\n');
    var total_folds = 1;

    // Dif cases for test vs. evaluate
    if (by_line[0] == 'test') {
        console.log('test');
    }

    // Evaluate case
    else {
        var first_line = by_line[0].split(',');
        var n_repeats = parseInt(first_line[0]);
        var n_folds = parseInt(first_line[1]);
        total_folds = n_repeats * n_folds;
    }
    var total = (total_folds * search_iter);

    // Calculate current progress
    var last_line = by_line.length - 1;
    var params_done = by_line[last_line].split(',').length - 1;
    var current = ((last_line-1) * search_iter) + params_done;

    // Return % done out of 1
    return current / total;
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

    // Want to update bar only if last_status is either undefined or
    // different from the current status
    if ((data['laststatus'] == undefined) || (data['laststatus'] !== job['status'])) {

        if ((job['status'] == "1") || (job['status'] == "-1")) {

            var color;
            var txt;

            if (job['status'] == "1") {
                color = '#28a745';
                txt = 'Done';
            } 
    
            else if (job['status'] == "-1") {
                color = '#dc3545';
                txt = 'Error';
            }

            data['bar'].animate(parseFloat(job['status']), {
                    duration: 0,
                    from: { color: '#add8e6' },
                    to: { color: color },
            });
            data['bar'].setText(txt);
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

function initProgressBar(container) {
    
    var bar = new ProgressBar.SemiCircle(container, {
        strokeWidth: 4,
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

            bar.path.setAttribute('stroke', state.color);

            if (bar.value() == 1) {
                bar.setText('Done');
            }
            else if (bar.value() == -1) {
                bar.setText('Error');
            }
            else {
                bar.path.setAttribute('stroke', state.color);
                bar.setText(Math.round((bar.value() * 100)) + '%');
            }

            bar.text.style.color = state.color;
        }
    });
    bar.text.style.fontFamily = '"Raleway", Helvetica, sans-serif';
    bar.text.style.fontSize = '1rem';

    return bar;
}

function getResultsTableHTML(project) {

    var table_html = '' +
    '<table id="results-table" class="table table-striped">' +
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

        '<td class="align-bottom"><button class="btn btn-sm btn-primary results-view" ' +
        'data-jobName="'+job_name+'">' +
        'Show</button></td>' +

        '<td class="align-bottom"><button class="btn btn-sm btn-danger results-delete" ' +
        'data-jobName="'+job_name+'">' +
        'Delete</button></td>' +
        '</tr>';
    });

    table_html += '</tbody></table>';

    return table_html;
}

