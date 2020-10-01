function ifExists(val) {
    
    if ((val == null) || (val == undefined)) {
        return false
    }
    return true;
}

function isBool(val) {
    var bool_val = ((val === "true") || (val === true));
    return bool_val;
}

function getPopLabel(key, title, content, ext=undefined) {

    html = '<label';

    if (ext !== undefined) {
        html = html + ' for="' + key + ext +'"';
    }
    html = html + '>' +
    '<span data-toggle="popover"' +
    'title="'+title+'" data-placement="top"' +
    'data-content="' + content + '"' +
    '>'+title+'<i class="fas fa-info-circle fa-sm"></i></span></label>';

    return html;
}

function getFreeDataInd(data_fields) {

    var cnt = 0;
    while ((data_fields.indexOf(cnt) !== -1) || (data_fields.indexOf(cnt.toString()) !== -1)) {
        cnt = cnt + 1;
    }
    return cnt;
}

function getSubSpaceKeys(space, project) {

    var keys = [];
    project['loading_spaces'][space]['data_fields'].forEach(n=> {
        keys.push(space + '-' + n.toString());
    });

    return keys;
}

function registerPopovers() {
    // Set pop overs, s.t. only one can be up at once
    // since if more then one can be, then can block the button
    // to close them

    var popover_template = '' + 
    '<div class="popover" role="tooltip">' +
    '<div class="arrow"></div>' +
    '<h3 class="popover-header"></h3>' +
    '<div class="popover-body"></div>' +
    '<div class="popover-footer">' +
       '<i>Press again to close this message - or open any other tooltip.</i>' +
    '</div>' +
    '</div>';

    $('[data-toggle="popover"]').popover({html: true, template: popover_template}).on("show.bs.popover", function(e){
        $(".popover").not(e.target).remove();
    });

    
}

const findDuplicates = (arr) => {
    
    let sorted_arr = arr.slice().sort();
    let results = [];
    for (let i = 0; i < sorted_arr.length - 1; i++) {
      if (sorted_arr[i + 1] == sorted_arr[i]) {
        results.push(sorted_arr[i]);
      }
    }
    return results;

}

function jump(h){
    jQuery('#'+h)[0].scrollIntoView({behavior: 'smooth', block: 'end'}); 
}

function addScrollTo(key, to_id) {
    
    jQuery('#'+key+'-collapse').on('shown.bs.collapse', function() {
        jump(to_id);
    });

    jQuery('#'+key+'-collapse').collapse("show");
}

function selectDontOpen(input_key) {

    jQuery('#'+input_key).on("select2:unselect", function (evt) {
        if (!evt.params.originalEvent) {
        return;
        }
        evt.params.originalEvent.stopPropagation();
    });

}

function getAllKeys(project) {
    var all_keys = Object.keys(project['data']);
    all_keys.sort(function (a, b) {
        return (parseInt(project['data'][a]['index']) - parseInt(project['data'][b]['index']));
    });

    return all_keys;
}

function registerSaveAndTrigger(key, params, dist) {

    // Save to project on change
    jQuery('#'+key).on('change', function() {
        params[dist] = $(this).val();
    });

    // If previous value, set
    if (params[dist] !== undefined) {

        var val = params[dist].toString().replace(/[']/g, '"');
        jQuery('#'+key).val(val).trigger('change');
    }
}

function clean_doc_link(text, docs_link) {

    // Change all double quotes to single quotes
    text = text.replace(/"/g, "'");

    // Replace internal references with link to docs
    docs_link = '<a href=\'' + docs_link + ' \' target=\'_blank\'>Docs</a>';
    text = text.replace(/:ref:`.*`/g, docs_link);

    // Replace new line with line breaks
    text = text.replace(/(\r\n|\n|\r)/gm, '<br>');

    return text;
}

function selectOrAdd(select_id, data) {

    if ($('#'+select_id).find("option[value='" + data.id + "']").length) {
        $('#'+select_id).val(data.id).trigger('change');
        } 

    else { 
            
        // Create a DOM Option and pre-select by default
        var newOption = new Option(data.text, data.id, true, true);
        
        //Append it to the select
        $('#'+select_id).append(newOption).trigger('change');
    } 
}

function arrayToChoices(arr) {
    var choices = [];

    if (arr.length == 0) {
        return choices;
    }

    arr.forEach(a => {
        choices.push({
            'id': a,
            'text': a
        });
    });

    return choices;
}

function addUniqueID(key, project) {

    if (project['data'][key]['id'] == undefined) {
        project['data'][key]['id'] = Date.now().toString();
    }
}

function registerProjectVal(key, project, indc, default_val) {

    jObj = jQuery('#'+key+indc);

    // Save to project
    jObj.on('change', function() {
        project['data'][key][indc] = $(this).val();
    })

    // Set default / existing
    if (project['data'][key][indc] == undefined) {
        project['data'][key][indc] = default_val;
    }
    jObj.val(project['data'][key][indc]).trigger('change');
}


///////////////////////
// External add new //
/////////////////////

function registerAddNewVal(key, project) {
    jQuery('#' + key + '-add-new-val').on('click', function () {
        jQuery('#' + project['key'] + '-val').click();
        jQuery('#add-val').click();
    });
}

function registerAddNewStratVar(key, project) {
    jQuery('#' + key + '-add-strat-var').on('click', function () {
        jQuery('#' + project['key'] + '-data-loading').click();
        jQuery('#add-strat').click();
    });
}

////////////////////////////
// Eventname related code //
///////////////////////////

function getReprName(name, eventname) {

    var event_mapping = settings['event_mapping'];
    var event_default = settings['event_default'];

    var ext = '';

    // Check if any of valid operators in eventname
    var op_ind = valid_ops.map(op => eventname.includes(op)).indexOf(true);

    // If no eventname, set to default
    if ((eventname == undefined) || (eventname.length == 0)) {
        ext = event_mapping[event_default];
    }

    // If a specific eventname, find the mapping entry
    else if (Object.keys(event_mapping).includes(eventname)) {
        ext = event_mapping[eventname];
    }

    else if ((eventname.startsWith('(')) && 
             (eventname.endsWith(')')) && 
             (op_ind !== -1)) {

        console.log('here')
        
        var op = valid_ops[op_ind];

        console.log(op);
        var op_ind = eventname.indexOf(op);
        console.log(op_ind)
        var e1 = eventname.slice(0, op_ind);
        console.log(e1)
        var e2 = eventname.slice(op_ind+op.length);
        console.log(e2)
        ext = event_mapping[e1] + op.replace(/ /g, '') + event_mapping[e2];
        console.log(ext)
    }

    // Return just base name if no ext
    if (ext == '') {
        return name;
    }

    // Otherwise, return name w/ ext
    return name + ' - ' + ext;
}

function getVarReprName(key, project) {
    return getReprName(project['data'][key]['-input'], project['data'][key]['-eventname'])
}

function getBaseName(repr_name) {

    // Create reverse mapping
    var reverse_mapping = {}
    Object.keys(settings['event_mapping']).forEach(k => {
        reverse_mapping[settings['event_mapping'][k]] = k;
    });

    var ext_check = repr_name.indexOf(' - ');
    if (ext_check !== -1) {
        repr_name = repr_name.slice(0, ext_check);
    }

    return repr_name;
}

function getTargetType(key, project) {


    var type_mapping = {'cat': 'categorical',
                        'float': 'regression',
                        'binary': 'binary'}

    if (project['data'][key] == undefined) {
        project['data'][key] = {};
    }

    // Grab the type of the first target
    // This one is unremovable !
    var target_type =  project['data'][key]['-type'];

    // Default float
    if ((target_type == undefined) || (target_type == null)) {
        target_type = 'float';
    }

    return type_mapping[target_type];
}

//////////////////////////
// Job Submission code //
/////////////////////////

var n_jobs = 0;

function hideOutput(key) {
    jQuery('#'+key+'-info').empty();
    jQuery('#'+key+'-info').css('display', 'none');
    jQuery('#'+key+'-dist').empty();
    jQuery('#'+key+'-table').empty();
    jQuery('#'+key+'-hide').css('display', 'none');
    jQuery('#'+key+'-show').blur();
    jQuery('#'+key+'-loading').css('display', 'none');
}

function submitPy(params) {

    jQuery.post('php/run_py.php', {
        'params': params
    }, function (output) {
        console.log('run submitted');
    }, "json").fail(function (xhr, textStatus, errorThrown) {
        alert('error ' + textStatus + xhr + errorThrown);
    });

}

function runQuickPy(params, key, setResultsFunc, project) {
    
    var n = n_jobs;
    params['n'] = n;
    n_jobs = n_jobs + 1;

    // Clear any existing results if any
    hideOutput(key);

    // Set to loading
    jQuery('#'+key+'-loading').css('display', 'inline-block');

    jQuery.post('php/run_quick_py.php', {
        'params': params
    }, function (output) {

        var status = output['status'];

        // If status 1 then run completed without error
        if (status == 1) {

            // Clear any previous
            hideOutput(key);

            // Unhide 
            jQuery('#' + key + '-hide').css('display', 'block');
            jQuery('#' + key + '-info').css('display', 'block');

            // Add output to info
            jQuery('#' + key + '-info').append(output['html_output']);

            // Call func specific results func
            setResultsFunc(output, key, project);

            // Decrement n_jobs
            n_jobs = n_jobs - 1;

        }
        else {
            hideOutput(key);

            // Display error
            if (output['error'].length > 0) {
                alert(output['error']);
            }
            else {
                alert('Unknown error!');
            }

            // Decrement n_jobs
            n_jobs = n_jobs - 1;
        }

    }, "json").fail(function (xhr, textStatus, errorThrown) {
        hideOutput(key);
        alert('error ' + textStatus);
        n_jobs = n_jobs - 1;
    });
}

///////////////////////////////////
// Code to make cards draggable //
/////////////////////////////////

var start_drag_id;
var start_drag_Y;
var start_drag_stub;

function getStub(key) {

    var off = 2;
    if ((key.endsWith('-var-space')) || (key.endsWith('-set-space'))) {
        off = 3;
    }

    var split = key.split('-');
    var stub = split.slice(0, split.length-off).join('-');

    return stub;
}

function drag(ev) {
    start_drag_Y = ev.pageY;
    start_drag_id = ev.target.id;
    start_drag_stub = getStub(ev.target.id);
}

function onDragOver(ev) {

    var drag_stub = getStub(ev.currentTarget.id);
    if ((ev.currentTarget.id !== start_drag_id) && (drag_stub == start_drag_stub)) {

        if ((ev.pageY - start_drag_Y) > 24) {
            jQuery('#'+start_drag_id).insertAfter(jQuery('#'+ev.currentTarget.id));
            jQuery('#'+start_drag_id).trigger('changeIndex');
            jQuery('#'+ev.currentTarget.id).trigger('changeIndex');
        }

        else if ((ev.pageY - start_drag_Y) < 24) {
            jQuery('#'+start_drag_id).insertBefore(jQuery('#'+ev.currentTarget.id));
            jQuery('#'+start_drag_id).trigger('changeIndex');
            jQuery('#'+ev.currentTarget.id).trigger('changeIndex');
        }

    }
}

function registerCard(key, data) {

    registerTrackIndex(key, data);
    registerCardDragBehavior(key);
    jQuery('#'+key+'-space').trigger('changeIndex');
}

function registerCardDragBehavior(key) {

    // Remove any old registers
    jQuery('#'+key+'-collapse').off('show.bs.collapse hide.bs.collapse hidden.bs.collapse');

    jQuery('#'+key+'-collapse').on('show.bs.collapse', function() {
        jQuery('#'+key+'-space').prop('draggable', false);
    });

    jQuery('#'+key+'-collapse').on('hide.bs.collapse', function() {
        jQuery('#'+key+'-space').prop('draggable', true);
    });

    jQuery('#'+key+'-collapse').on('hidden.bs.collapse', function() {
        jQuery('#'+key+'-space').prop('draggable', true);

        // Also remove any popovers
        $(".popover").remove();
    });
}

function registerTrackIndex(key, data) {

    // Remove any old registers
    jQuery('#'+key+'-space').off('changeIndex');

    jQuery('#'+key+'-space').on('changeIndex', function() {
        data['index'] = $(this).index().toString();
    });

    // Init if not already
    if (data['index'] == undefined) {
        jQuery('#'+key+'-space').trigger('changeIndex');
    }
}