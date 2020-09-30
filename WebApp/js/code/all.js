var datasets;
var all_events;
var variables;
var variable_choices;
var events;

var projects = [];
var settings = {};
var project_steps = ['-setup', '-data-loading', '-val', '-test-split',
                     '-ml-pipe', '-evaluate', '-results'];
var active_jobs_interval;


function save_all() {
    
    // Save projects
    jQuery.post('php/save_projects.php', {
        'projects': JSON.stringify(projects),
        'settings': JSON.stringify(settings)
    });

    // Save user param dists
    saveParamDists();
}

function hideAllProjSteps() {

    project_steps.forEach(step => {
        jQuery('#body'+step).css('display', 'none');
    });
    jQuery('#body-noproj').css('display', 'none');
    jQuery('#body-settings').empty();
    jQuery('#body-sets').empty();
}

function clearAllProjSteps() {

    hideAllProjSteps();

    project_steps.forEach(step => {
        jQuery('#body'+step).empty();
    });
}

function projectOptionsHTML(key) {

    var html = '' +
    '<ul id="'+key+'-project-options" class="nav ml-2" style="font-size: 0.9rem; display: none;">' +
    
    '<li class="nav-item">' +
    '<a id="'+key+'-setup" class="nav-link" href="#">' + 
    '<span><i class="fas fa-address-card navbutton fa-fw"></i></span> Setup' +
    '</a>' +
    '</li>' +

    '<li class="nav-item">' +
    '<a id="'+key+'-data-loading" class="nav-link" href="#">' + 
    '<span><i class="fas fa-boxes navbutton fa-fw"></i></span> Data Loading' +
    '</a>' +
    '</li>' +

    '<li class="nav-item">' +
    '<a id="'+key+'-val" class="nav-link" href="#">' + 
    '<span><i class="fas fa-balance-scale navbutton fa-fw"></i></span> Validation' +
    '</a>' +
    '</li>' +

    '<li class="nav-item">' +
    '<a id="'+key+'-test-split" class="nav-link" href="#">' + 
    '<span><i class="fas fa-cut navbutton fa-fw"></i></span> Test Split' +
    '</a>' +
    '</li>' +

    '<li class="nav-item">' +
    '<a id="'+key+'-ml-pipe" class="nav-link" href="#">' + 
    '<span><i class="fas fa-microchip navbutton fa-fw"></i></span> ML Pipeline' +
    '</a>' +
    '</li>' +

    '<li class="nav-item">' +
    '<a id="'+key+'-evaluate" class="nav-link" href="#">' + 
    '<span><i class="fas fas fa-cloud-upload-alt navbutton fa-fw"></i></span> Evaluate' +
    '</a>' +
    '</li>' +

    '<li class="nav-item">' +
    '<a id="'+key+'-results" class="nav-link" href="#">' + 
    '<span><i class="fas fas fa-clipboard navbutton fa-fw"></i></span> Results' +
    '</a>' +
    '</li>' +

    '</ul>';

    return html;
}

function removeActiveProjectOption(key) {
    project_steps.forEach(k => {
        if (jQuery('#'+key+k).hasClass('sec-active')) {
            jQuery('#'+key+k).removeClass('sec-active');
            jQuery('#body'+k).css('display', 'none');
        }
    });
}

function updateTopText(text, key, ext) {

    var top_text = '' +
    '<button type="button" id="prev" class="btn btn-sm btn-dark" ' +
    'style="background-color:transparent;">' +
    '<i class="fas fa-arrow-left fa-xs"></i>' +
    '</button>&nbsp' +
    text +
    '&nbsp<button type="button" id="next" class="btn btn-sm btn-dark" ' +
    'style="background-color:transparent;">' +
    '<i class="fas fa-arrow-right fa-xs"></i>' +
    '</button>';

    jQuery('#top-text').append(top_text);

    var ind = project_steps.indexOf(ext);

    if (ind == 0) {
        jQuery('#prev').attr("disabled", true);
    }
    else if (ind == project_steps.length-1) {
        jQuery('#next').attr("disabled", true);
    }

    jQuery('#prev').on('click', function() {
        jQuery('#'+key+project_steps[ind-1]).click();
    });
    jQuery('#next').on('click', function() {
        jQuery('#'+key+project_steps[ind+1]).click();
    });
}

function registerProjectOptionsClick(project, ext, text, func) {

    var key = project['key'];

    jQuery('#'+key+ext).off('click');
    jQuery('#'+key+ext).on('click', function() {

        if (!$(this).hasClass('sec-active')) {
            removeActiveProjectOption(key);

            $(this).addClass('sec-active');
            jQuery('#top-text').empty();

            updateTopText(text, key, ext);
           
            project['last_active'] = ext;
            func(project);
        }
        else {
            project['last_active'] = undefined;
            projectDefault(key);
        }

        // Close any open popovers + modal;s
        $(".popover").remove();
        $('.modal').modal('hide');
    });

    
}

function projectOff(key) {

    jQuery('#'+key+'-project-button').removeClass('active');
    jQuery('#'+key+'-project-options').css('display', 'none');
    removeActiveProjectOption(key);
    noProjectDefault();
}

function projectOn(key, project) {

    if (!datasets.includes(project['dataset'])) {
        alert('Warning! The dataset this project was created with: "' + project['dataset'] + 
              '" was not found. Check data to make sure it was not deleted or the name changed. ' +
              'You may still view this saved project, but attempting to load new variables or run new ' +
              'experiments will likely fail!')
    }

    // Set dataset to settings
    settings['dataset'] = project['dataset'];

    // Remove other active projects
    removeActiveProjects();

    // Set this one to active class
    jQuery('#'+key+'-project-button').addClass('active');

    // Unhide options
    jQuery('#'+key+'-project-options').css('display', 'block');

    // Show delete project button
    jQuery('#delete-project').css('display', 'block');

    // Clear and set project name on confirm delete screen
    jQuery('#del-project-name').empty();
    jQuery('#del-project-name').append(project['name']);

    var confirm_del = jQuery('#confirm-delete-project')

    // Clear if existing event handler
    confirm_del.off('click');

    // Register new - delete this project
    confirm_del.on('click', function() {
        deleteProject(project);
    });

    // If last active was None, default to setup
    if (project['last_active'] == undefined) {
        project['last_active'] = '-setup'
    }
    var last_active = project['last_active'];
    
    // Grab the correct sets for this project
    jQuery.getJSON('php/getSets.php', { "action": "get",
                                        "dataset": project['dataset']}, function(data) {
        sets = data;
 
        // Start by init'ing all project steps       
        project_steps.forEach(step => {
            jQuery('#'+key+step).click();
        });
        removeActiveProjectOption(key);
        
        // Set to last active
        jQuery('#'+key+last_active).click();
    });   
}

function removeActiveProjects() {

    projects.forEach(proj => {
        if (jQuery('#'+proj['key']+'-project-button').hasClass('active')) {
            projectOff(proj['key']);
        }
    });

    // Clear the job checking interval
    clearInterval(active_jobs_interval);
}

function loadProject(project) {

    // Init various project pieces if undefined
    checkProject(project);

    // Project registers
    registerLoadProject(project);
}

function checkProject(project) {
    
    if (project['jobs'] == undefined) {
        project['jobs'] = {};
    }

    if (project['files'] == undefined) {
        project['files'] = {};
    }
    if (project['files']['inclusions'] == undefined) {
        project['files']['inclusions'] = {};
    }
    if (project['files']['exclusions'] == undefined) {
        project['files']['exclusions'] = {};
    }
    if (project['files']['tr_onlys'] == undefined) {
        project['files']['tr_onlys'] = {};
    }
    if (project['files']['test'] == undefined) {
        project['files']['test'] = {};
    }
    if (project['files']['eval'] == undefined) {
        project['files']['eval'] = {};
    }
    if (project['strat_choices'] == undefined) {
        project['strat_choices'] = {};
    }
    if (project['loading_spaces'] == undefined) {
        project['loading_spaces'] = {};
    }
}

function registerLoadProject(project) {
    
    var key = project['key'];

    var html = '' +
        '<div id="' + key + '-entry">' +
        '<li class="nav-item">' +
        '<a id="' + key + '-project-button" class="nav-link" href="#">' +
        '<span><i class="fas fa-book navbutton"></i>&nbsp;</span>' +
        '<span id="' + key + '-project-name">' + project['name'] +
        '</a>' +
        '</li>' +
        projectOptionsHTML(key) +
        '</div>';

    jQuery('#projects-list').append(html);

    // Register on click project setups
    registerProjectOptionsClick(project, '-setup', 'Setup', displaySetup);
    registerProjectOptionsClick(project, '-data-loading', 'Data Loading', displayDataLoading);
    registerProjectOptionsClick(project, '-val', 'Validation', displayValidation);
    registerProjectOptionsClick(project, '-test-split', 'Test Split', displayTestSplit);
    registerProjectOptionsClick(project, '-ml-pipe', 'ML Pipeline', displayMLPipe);
    registerProjectOptionsClick(project, '-evaluate', 'Evaluate', displayEvaluate);
    registerProjectOptionsClick(project, '-results', 'Results', displayResults);

    // Register on project button click actions
    jQuery('#' + key + '-project-button').on('click', function () {

        if ($(this).hasClass('active')) {
            projectOff(key);
        }
       
        else {
            jQuery.getJSON('php/load_dataset.php',
                {'dataset': project['dataset']},
                function (data) {

                // Unpack to global vars
                variables = JSON.parse(data['variables']);
                if (variables == false){
                    variables = [];
                }
 
                events = JSON.parse(data['events']);
                if (events == false) {
                    events = [];
                }

                variable_choices = arrayToChoices(variables);
                
                // Trigger project on
                projectOn(key, project);
            });
        }
    });
}

function deleteProject(project) {

    // Set to no project default default
    noProjectDefault();

    // Dismiss the modal
    $("[data-dismiss=modal]").trigger({ type: "click" });

    // Delete the html
    jQuery('#'+project['key']+'-entry').remove();

    // Delete associated saved job results
    jQuery.post('php/delete_jobs.php', {
        'project_id': project['id']
    });

    // Delete from projects
    projects.splice(projects.indexOf(project), 1);    
}

function addNewProject() {

    removeActiveProjects();

    var data_fields = [];
    projects.forEach(project => {
        data_fields.push(project.n);
    });

    var n = getFreeDataInd(data_fields)
    var key = 'project-' + n.toString();

    var project = {
        'dataset': jQuery('#data-source').val(),
        'key': key,
        'n': n,
        'name': 'My Project',
        'last_active': '-setup',
        'data': {},
        'strat_choices': {},
        'files': {
            'inclusions': {},
            'exclusions': {},
            'tr_onlys': {},
        },
        'id' : Date.now().toString()
    };

    loadProject(project);
    projects.push(project);
    
    // On init - switch focus to the new project
    jQuery('#'+key+'-project-button').click();
}

function projectDefault(key) {
    removeActiveProjectOption(key);
    jQuery('#top-text').empty();
}

function clearAll() {

    // Remove any open popovers
    $(".popover").remove();

    // Call remove active projects
    removeActiveProjects();

    // Remove the top text
    jQuery('#top-text').empty();

    // Hide delete project
    jQuery('#delete-project').css('display', 'none');

    // Clear all project steps
    clearAllProjSteps();

}

function noProjectDefault() {

    // Clear anything open
    clearAll()

    // If already loaded
    if (jQuery('#body-noproj').html().length > 30) {
        jQuery('#body-noproj').css('display', 'block');
        return;
    }

    var html = '' +
    '<div class="form-row">' +
    '<div class="col-md-1"></div>' +
    '<div class="form-group col-md-4">' +
    '<br>' + 
    '<h3>Welcome to the Brain Predictability toolbox</h3>' +
    '<br>' + 
    '<p>This is an early beta release version, so please report any bugs or feel free to contribute any suggestions for ' +
    'new features on the BPt_app github page!</p>' +
    '<p>Select an existing project to work on, or add a new one over on the left menu.</p>' +
    '<p>The left menu also holds links to pages dedicated to general Settings, and for making namedSets of variables.</p>' +
    '<p>Note: you may want to zoom in or out a bit on your browser to your prefered text and button size.</p>'
    '<p>Warning: BPt is not currently designed to handle multiple tabs of this app open at the same time. If you choose to do so, ' +
    'it may result in strange behavior.</p>' +
    '<br>' +
    // Hide this for now for the single user version
    //'<p>Press the button below to make all of your custom hyper-parameter distributions public to other users!</p>' +
    //'<button id="upload-user-dists" class="btn">Upload User Dists</button>' +
    //'</div>' +
    '<div class="form-group col-md-6">' +
    //'<img src="images/logo.png" class="img-fluid" width="100%" alt="Logo" style="background:transparent;"/>'+
    '</div>' + 
    '</div>';

    jQuery('#body-noproj').append(html);
    jQuery('#body-noproj').css('display', 'block');

    // On upload button click, trigger upload
    jQuery('#upload-user-dists').on('click', uploadPublicDists);
}

function startApp() {

    // It is important to get if the user has any existing projects
    // s.t., should not allow any interaction, e.g., add new projects
    // before existing ones are loaded.
    jQuery.getJSON('php/get_projects.php', function (data) {

        console.log(data)

        if (Object.keys(data).includes('settings')) {
            settings = data['settings'];
        }

        if (Object.keys(data).includes('projects')) {
            projects = data['projects'];

            // Add all existing projects as options
            projects.forEach(project => {

                if (!Object.keys(project).includes('data')) {
                    project['data'] = {};
                }
                loadProject(project);
            });
        };

        // On click add var, call func
        jQuery('#add-new-project').on('click', function() {

            jQuery('#data-source').select2({
                data: arrayToChoices(datasets)
            });

            jQuery('#select-data-source').modal('show');
        });

        // On submit modal, create project
        jQuery('#create-project').on('click', function() {
            addNewProject();
        });

        // Register Settings button
        jQuery('#home-but').on('click', function () {
            noProjectDefault();
        });

        // Register Settings button
        jQuery('#settings').on('click', function () {
            showUserSettings();
        });

        // Register Sets button
        jQuery('#sets').on('click', function () {
            showSets();
        });

        // Register save projects button
        jQuery('#save-projects').on('click', save_all);

        // Save the updated projects on leaving the window
        $(window).bind('beforeunload', function () {
            save_all();
        });

         // Set w/ default no- project entry screen
         jQuery('#settings').click();
         noProjectDefault();
    });
}

function checkDBReady(db_interval) {

    jQuery.getJSON('php/check_db_ready.php', function (data) {

        var status = JSON.parse(data['status']);

        if (status == '1') {
            clearInterval(db_interval);
            isReady(data);
        }
        else if (status == '-1') {
            alert('Creating/Updating Data failed with error message: ' +
            data['error_msg'] + ' Try to fix this error and then refresh the page to try again');
        }
    });
}

function isReady(data) {

    datasets = JSON.parse(data['datasets']);
    all_events = JSON.parse(data['all_events']);
    jQuery("#body-db-loading").css('display', 'none');
    startApp();
}

// On document load
jQuery(document).ready(function() {

    // Run setup
    jQuery.post('php/setup_db.php');
    jQuery.post('php/setup_info.php');

    // Use the select2 bootstrap theme
    $.fn.select2.defaults.set("theme", "bootstrap4");

    // Run once in this loop, so waits for finish
    jQuery.getJSON('php/check_db_ready.php', function (data) {

        var status = JSON.parse(data['status']);

        // If ready, call isReady
        if (status == '1') {
            isReady(data);
        }

        else if (status == '-1') {
            alert('Creating/Updating Data failed with error message: ' +
            data['error_msg'] + ' Try to fix this error and then refresh the page to try again');
        }

        // If not ready, set load and start check loop
        else {
            jQuery("#body-db-loading").css('display', 'block');

             // Start loop to check if db ready
            var db_interval = setInterval(function() {
                checkDBReady(db_interval);
            }, 750);
        }
    });

});









