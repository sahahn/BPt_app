
function getEachSplitInfoText() {

    var txt = '' +
    '<b>K-Fold</b><br>' +
    'K-Fold defines that a k-fold cross validation be defined, see: https://en.wikipedia.org/wiki/Cross-validation_(statistics). ' +
    'Importantly, these k-folds are made with respect to the passed Validation Strategy, as well as with the corresponding Repeats ' +
    'parameter (which controls the number of times this k-fold CV is repeated with a different random seed).<br>' +

    '<b>Single Split</b><br>' + 
    'Simillar to K-fold (in that the splits are made according to the passed Validation Strategy + Repeats), ' +
    'this parameter allows you to specify that a single train validation split be made. For example, if .2, is passed ' +
    'here, then 20% of the data will be set as validation and 80% as train. Likewise, if multiple repeats are set, this ' +
    'split will be repeated with new random seeds.<br>' +

    '<b>Leave-Out Group</b><br>' + 
    'This parameter allows to explcitily specify that a leave-out-group cross validation strategy be used. ' +
    'e.g., if sex is selected as the variable here, then the internal validation performed will first train on one ' +
    'sex and then validate on the other, and then vice versa. This parameter essentially allows you to conduct this ' +
    'leave-out-one group type CV across either the unique values from a single variable or a combinarion of variables. ' +
    'In the case that a combination of variables is passed, then the combination of unique overlapped values across all ' +
    'passed variables will be used. For example if sex and race are passed, then each group within the leave out CV will be ' +
    'male and race 0, female and race 0, male and race 1, etc...';

    return txt;
}

function getValidationStratText() {
    var txt = 'Optionally, select a validation strategy in which the specified Splits should repsect. ' +
    'By default, the pre-defined choice Random Splits will be used, where splits will be made at random. ' +
    'Otherwise, you may specify a custom validation behavior as defined within the Validation tab for this project. ' +
    'Note that this option is not avaliable when Leave-Out Group is selected as the split strategy.';

    return txt;
}


function resultsHTML(key, button_label) {
    
    var html = '<hr>' +
    '<div class="form-row">' + 
    
    '<!--Show Button-->' +
    '<div class="col-sm-auto">'  +
        '<div class="btn-group">' +
        '<button class="btn btn-primary" id="'+key+'-show">'+button_label + 
        '<img id="'+key+'-loading" src="images/loading.gif" aria-hidden="true" style="display: none; width: 25px;"></img>' +
        '</button>' +
        '<button class="btn btn-danger" id="'+key+'-hide" style="display:none">Hide</button>' +
        '</div>' +
        '<div id="'+key+'-info" style="margin-top: 20px; display:none;"></div>' +
    '</div>' +

    '<!--Space for showing table -->' +
    '<div class="col-sm-auto" id="'+key+'-table"></div>' +
    
    '<!--Space for showing pic of distribution -->' +
    '<div class="col-sm-auto" id="'+key+'-dist"></div>' +
    '</div>';
    return html;
}

function resultsAltHTML(key, button_label) {
    
    var html = '' +
    '<hr>' +
    '<div class="form-row">' + 
        '<div class="col text-center" style="padding-left: 25%; padding-right: 25%">' +
            '<div class="btn-group">' +
                '<button class="btn btn-lg btn-primary" id="'+key+'-show">'+button_label +
                '<img id="'+key+'-loading" src="images/loading.gif" aria-hidden="true" style="display: none; width: 30px;"></img>' +
                '</button>' +
                '<button class="btn btn-danger btn-lg" id="'+key+'-hide" style="display:none">Hide</button>' +
            '</div>' +
            
            
        '</div>' +
    '</div>' +

    '<div class="form-row" style="padding-top: 10px">' +
        '<div class="col-sm-auto">'  +
            '<div id="'+key+'-info" style="display:none;"></div>' +
    '</div>' +
    
    '<!--Space for showing table -->' +
    '<div class="col-sm-auto" id="'+key+'-table"></div>' +
    
    '<!--Space for showing pic of distribution -->' +
    '<div class="col-sm-auto" id="'+key+'-dist"></div>' +
    '</div>';
    return html;
}

function addSubjectsInputRowHTML(key, file_input_label,
                                 from_strat_label, data_type,
                                 row_class=undefined) {

    var html = '<div class="form-row';
    if (row_class !== undefined) {html = html + row_class;}
    html = html + '">' +
    
    '<div class="form-group col-md-6">' +
        file_input_label +
        '<div class="custom-file">' +
        '<input data-type="'+data_type+'" type="file" id="'+key+'-file-input">' +
        '<label class="custom-file-label" for="'+key+'-file-input"><i>Choose a file</i></label>' +
        '</div>' +
    '</div>' +

    '<div class="form-group col-md-6">' +
        from_strat_label +
    
        '<button type="button" id="'+key+'-add-strat-var" class="btn btn-sm float-right" ' +
        'style="background-color:transparent;">' +
        'Add Non-Input Variable <i class="fas fa-plus fa-sm"></i>' +
        '</button>' +

        '<select id="'+key+'-var-input" class="form-control" data-width="100%"></select>' +
        '<select id="'+key+'-var-val" class="form-control" data-width="100%"></select>' +
    '</div>' +

    '</div>';

    return html
}

function cardWrapHTML(start_text, key, to_wrap, no_remove, row_wrap=false) {
    
    var html = '' +
    '<div id='+key+'-space class="card" draggable="true" ondragstart="drag(event)" ondragover="onDragOver(event)">' +
    
    '<div data-toggle="collapse" data-target="#'+key+'-collapse" class="card-header"' +
         'id="'+key+'-card-header" aria-expanded="true" aria-controls="'+key+'-collapse">';

    if (row_wrap) {
        html = html + '<div class="row">'
    }

    html = html +
    start_text + '<div id="'+key+'-header-text" style="display:inline">' +
    '</div>' +
    '<div id="'+key+'-header-text-extra" style="display:inline"></div>';

    if (row_wrap) {
        html = html + '<div class="col">';
    }

    if (!no_remove) {
        html = html +
        '<span id="'+key+'-remove-spot">' +
        '<button type="button" class="close float-right" aria-label="Remove" id="'+key+'-remove">' +
        '<span aria-hidden="true">&times;</span></button></span>';
    }

    if (row_wrap) {
        html = html + '</div></div>';
    }

    html = html + '</div>' +
    '<div id="'+key+'-collapse" class="collapse" ' +
    'aria-labelledby="'+key+'-card-header" data-parent="#accordion">' +
        '<div id="'+key+'-body-card" class="card-body">' + to_wrap + '</div>' +
    '</div>' +
    '</div>';

    return html;
}

function getValStratHTML(key, val_strat_label) {

    var html = '' +
    '<div id="'+key+'-show-val-strat" style="display: block;">' +

    val_strat_label +

    '<button type="button" id="'+key+'-add-new-val" class="btn btn-sm float-right" ' +
    'style="background-color:transparent;">' +
    'Add New Validation Strategy <i class="fas fa-plus fa-sm"></i>' +
    '</button>' +

    '<select id="'+key+'-val-strategy" class="form-control input-group-append" data-width="100%"></select>' +
    '</div>';

    return html;
}

function getSplitsHTML(key, splits_label) {

    var html = '' +

    splits_label +
    '<div class="input-group">' +
        '<div class="input-group-prepend select2-bootstrap-prepend">' +
            '<button class="input-group-text btn dropdown-toggle" type="button"' +
            'data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><a id="'+key+'-split-type-name"></a></button>' +

            '<div class="dropdown-menu">' +
            '<span id="'+key+'-kfold" class="dropdown-item fake-link">K-Fold</span>' +
            '<span id="'+key+'-single" class="dropdown-item fake-link">Single Split</span>' +
            '<span id="'+key+'-group" class="dropdown-item fake-link">Leave-Out Group</span>' +
            '</div>' + 
        '</div>' + 

        '<input id="'+key+'-if-kfold" type="number" class="form-control" ' + 
        'step="1" min="2" title="Num. Folds"' +
        'style="display: none;"' +
        '></input>' + 

        '<input id="'+key+'-if-single" type="number" class="form-control" ' +
        'step=".001" min=".05" max=".95" title="Val. %"' +
        'style="display: none;"' +
        '></input>' + 

        '<select id="'+key+'-group-by" class="form-control" data-width="20%" style="display: none;" multiple="multiple">' +
        '</select>' +

        '<input id="'+key+'-repeats" type="number" aria-label="Repeats" ' +
        'class="form-control '+key+'-show-repeats" step="1" min="1"></input>' + 
        '<div class="input-group-append select2-bootstrap-append '+key+'-show-repeats">' +
            '<span class="input-group-text">Repeats</span>' +
        '</div>' +
    '</div>';

    return html;
}
