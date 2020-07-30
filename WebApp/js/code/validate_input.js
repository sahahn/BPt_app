//////////////////////////////////////
// Space for input validation funcs //
/////////////////////////////////////


function validateVariableInput(key, data) {

    var var_input = data['-input'];

    if (var_input == undefined) {
        $('#'+key+'-input').addClass('is-invalid');
        return false;
    }

    else if (var_input.length < 1) {
        $('#'+key+'-input').addClass('is-invalid');
        return false;
    }

    else {
        $('#'+key+'-input').removeClass('is-invalid');
    }

    return true;
}

function validateSetInput(key, data) {

    var set_name = data['-data-sets'];

    if (set_name == undefined) {
        $('#'+key+'-data-sets-val').css('display', 'block');
        return false;
    }

    else if (set_name.length < 1) {
        $('#'+key+'-data-sets-val').css('display', 'block');
        return false;
    }

    else {
        $('#'+key+'-data-sets-val').css('display', 'none');
    }

    return true;
}

function validateDataType(key, data) {

    if (data['-type'] == undefined) {
        $('#'+key+'-buttons-val').css('display', 'block');
        return false;
    }

    else {
        $('#'+key+'-buttons-val').css('display', 'none');
    }
    
    return true;
}

function validateCardNameInput(data) {

    var var_input = data['-name'];

    // No visual effects for bad input, as the stop propegate makes things weird
    if (var_input == undefined) {
        return false;
    }
    else if (var_input.length < 1) {
        return false;
    }

    return true;
}

function validateVariable(key, data) {
    
    var okay = true;
    
    if (!validateVariableInput(key, data)) {
        okay = false;
    }

    if (!validateDataType(key, data)) {
        okay = false;
    }
    return okay;
}

function validateSet(key, data) {
    
    var okay = true;
    
    if (!validateSetInput(key, data)) {
        okay = false;
    }

    if (!validateDataType(key, data)) {
        okay = false;
    }
    return okay;
}

function validateValidation(key, data) {
    
    var okay = true;

    if (!validateCardNameInput(data)) {
        okay = false;
    }

    return okay;
}

function validatePiece(key, data) {
    
    var okay = true;

    if (data['-obj-input'] == undefined) {
        okay = false;
    }

    return okay;
}

function validatePipeline(key, project) {

    var data = project['data'][key];
    var model_key = key + "-model-space-model";
    var model_data =  project['data'][model_key];

    var okay = true;

    if (!validateCardNameInput(data)) {
        okay = false;
    }

    if (!validatePiece(model_key, model_data)) {
        okay = false;
    }

    return okay;
}

function validateGenericInput(key, data, field) {

    var var_input = data[field];

    if (var_input == undefined) {
        $('#'+key+field).addClass('is-invalid');
        $('#'+key+field+'-val').css('display', 'block');
        return false;
    }

    else if (var_input.length < 1) {
        $('#'+key+field).addClass('is-invalid');
        $('#'+key+field+'-val').css('display', 'block');
        return false;
    }

    else {
        $('#'+key+field).removeClass('is-invalid');
        $('#'+key+field+'-val').css('display', 'none');
    }

    return true;
}

function validatePreSubmitJob(key, data) {
    
    var okay = true;

    if (!validateGenericInput(key, data, '-target')) {
        okay = false;
    }

    if (!validateGenericInput(key, data, '-pipeline')) {
        okay = false;
    }

    if (!validateGenericInput(key, data, '-metrics')) {
        okay = false;
    }

    if (!validateGenericInput(key, data, '-scope-input')) {
        okay = false;
    }


    return okay;
}

function validateJobName(key, data, existing) {

    var okay = true;

    if (!validateGenericInput(key, data, '-job-name')) {
        okay = false;
    }

    // Special extra check for if already exists
    if (existing.includes(data['-job-name'])) {
        $('#'+key+'-job-name-existing').css('display', 'block');
        $('#'+key+'-job-name').addClass('is-invalid');
        okay = false;
    }
    else {
        $('#'+key+'-job-name-existing').css('display', 'none');
    }

    return okay;
}

function validateSubmitJob(key, project) {

    var data = project['data'][key];
    var existing = Object.keys(project['jobs']);

    var okay = true;

    if (!validateJobName(key, data, existing)) {
        okay = false;
    }

    return okay;
}