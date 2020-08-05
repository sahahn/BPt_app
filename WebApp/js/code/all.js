var variables;
var variable_choices;
var projects = [];
var project_steps = ['-setup', '-data-loading', '-val', '-test-split',
                     '-ml-pipe', '-evaluate', '-results'];
var active_jobs_interval;


function save_all() {
    
    // Save projects
    jQuery.post('php/save_projects.php', {
        'projects': projects
    });

    // Save user param dists
    saveParamDists();
}

function hideAllProjSteps() {

    project_steps.forEach(step => {
        jQuery('#body'+step).css('display', 'none');
    });
    jQuery('#body-noproj').css('display', 'none');
    jQuery('#body-sets').css('display', 'none');
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

    // Remove other active projects
    removeActiveProjects();

    // Set this one to active class
    jQuery('#'+key+'-project-button').addClass('active');

    // Unhide options
    jQuery('#'+key+'-project-options').css('display', 'block');

    // If last active was None, default to setup
    if (project['last_active'] == undefined) {
        project['last_active'] = '-setup'
    }
    var last_active = project['last_active'];

    // Unsure if I want to keep this... but can init the full project upon selection
    // Or do the option below instead
    project_steps.forEach(step => {
        jQuery('#'+key+step).click();
    });
    removeActiveProjectOption(key);
    
    // Init w/ last active
    jQuery('#'+key+last_active).click();

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

    var key = project['key'];

    var html = '' +
    '<div id="'+key+'-entry">' + 
    '<li class="nav-item">' +
    '<a id="'+key+'-project-button" class="nav-link" href="#">' + 
    '<span><i class="fas fa-book navbutton"></i>&nbsp;</span>' +
    '<span id="'+key+'-project-name">' + project['name'] +
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
    jQuery('#'+key+'-project-button').on('click', function() {

        if ($(this).hasClass('active')) {
            projectOff(key);
        }
        else {
            projectOn(key, project);
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

function noProjectDefault() {

    removeActiveProjects();
    jQuery('#top-text').empty();
    jQuery('#delete-project').css('display', 'none');

     // Clear all project steps
     clearAllProjSteps();

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
    '<h3>Welcome to ABCD ML</h3>' +
    '<br>' + 
    '<p>Select an existing project to work on, or add a new one.</p>' +
    '<p>Other random helper/ intro text, etc...</p>' +
    '<br>' +
    '<p>Press the button below to make all of your custom hyper-parameter distributions public to other users!</p>' +
    '<button id="upload-user-dists" class="btn">Upload User Dists</button>' +
    '</div>' +
    '<div class="form-group col-md-6">' +
    '<img src="images/logo.png" class="img-fluid" width="100%" alt="Logo" style="background:transparent;"/>'+
    '</div>' + 
    '</div>';

    jQuery('#body-noproj').append(html);
    jQuery('#body-noproj').css('display', 'block');

    // On upload button click, trigger upload
    jQuery('#upload-user-dists').on('click', uploadPublicDists);
}

function showSets() {

    // Clear everything
    noProjectDefault();
    jQuery('#body-noproj').css('display', 'none');

    // If already loaded
    if (jQuery('#body-sets').html().length > 30) {
        jQuery('#body-sets').css('display', 'block');
        return;
    }

    var html = '' +
    '<div class="card-columns">' +
    '<div class="card w-100">' +
    '<div class="card-body">' +
        '<h5 class="card-title"><input type="text" class="set-name form-control" placeholder="Set Name"></h5>' +
         getPopLabel('temp', "Set From RegExp ", "Blah Blah Blah") +

        '<div class="row">' +
        '<div class="col">' +
        '<div>' +
        '<input type="text" class="form-control search-text" style="width: 70%; margin-right:3px; display:inline-block">' +
        '<button class="btn search-button">Search</button>' +
        '<div>' +
        '<div></div>' + 
        '</div></div>' +

        

    '</div>' +
    '</div>' +

    '<div class="card w-100">' +
    '<div class="card-body">' +
        '<h5 class="card-title">Card title</h5>' +
    '</div>' +
    '</div>' +

    '<div class="card w-100">' +
    '<div class="card-body">' +
        '<h5 class="card-title">Card title</h5>' +
    '</div>' +
    '</div>' +

    '</div>';

    jQuery('#body-sets').append(html);
    jQuery('#body-sets').css('display', 'block');

    jQuery('.search-button').on('click', function() {

        var search = $(this).siblings().val();
        var results = variables.filter(entry => entry.match(RegExp(search)));
        console.log(results);
    });


    //



    // sets should be already loaded


    //jQuery.getJSON('getSets.php', { 'action': "delete", "id": id }, function(data) {
    //jQuery.getJSON('getSets.php', { "action": "get" }, function(data) {
    //jQuery.getJSON('getSets.php', { "action": "save", "name": value, "id": jQuery(this).parent().attr("id") }, function(data) {
    //jQuery.getJSON('getSets.php', { "action": "removeMeasure", "id": id, "variable": item }, function(data) {
    //jQuery.getJSON('getSets.php', { "action": "addMeasure", "id": activeCard, "variable": jQuery(this).attr('item') }, function(data) {
    //jQuery.getJSON('getSets.php', { "action": "create", "name": "unnamed", "variables": [] }



    //"name": "smri",
    //"variables": [],
    //"id": "ABCD5eb07431c916d"



}

function startApp() {

    // It is important to get if the user has any existing projects
    // s.t., should not allow any interaction, e.g., add new projects
    // before existing ones are loaded.
    jQuery.getJSON('php/get_projects.php', function (data) {

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

        // Set w/ default no- project entry screen
        noProjectDefault();

        // On click add var, call func
        jQuery('#add-new-project').on('click', function () {
            addNewProject();
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
    });
}

function checkDBReady(db_interval) {

    jQuery.getJSON('php/check_db_ready.php', function (data) {

        if (data !== 'not ready') {
            clearInterval(db_interval);
            variables = data;
            variables.unshift('');
            variable_choices = arrayToChoices(variables);
            startApp();
        }
    });
}

// On document load
jQuery(document).ready(function() {

    // Use the select2 bootstrap theme
    $.fn.select2.defaults.set("theme", "bootstrap4");

    // Run setup
    jQuery.post('php/setup.php');

    // Start loop to check if db ready
    db_interval = setInterval(function() {
        checkDBReady(db_interval);
    }, 750);

});







