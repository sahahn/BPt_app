function inputDropNaHTML(key) {

    var html = '<div class="d-flex flex-column">' +
    
    '<label for="'+key+'-drop-buttons">' +
    '<span data-toggle="popover"' +
    'title="Drop NaN" data-placement="top"' +
    'data-content="Data Variables with missing values can either be dropped, or imputed later on.' +
    'If set to True, they will be dropped, if False, then they will be kept"' +
    '>Drop Missing <i class="fas fa-info-circle fa-sm"></i></span></label>' +

    '<div class="btn-group-toggle btn-group"' +
    'data-toggle="buttons" id="'+key+'-drop-buttons">' +

        '<label id="'+key+'-drop-choice-true" class="btn btn-secondary active">' +
        '<input type="radio" name="'+key+'-drop-choice" value="true" checked>True</input>' +
        '</label>' +

        '<label id="'+key+'-drop-choice-false" class="btn btn-secondary">' +
        '<input type="radio" name="'+key+'-drop-choice" value="false">False</input>' +
        '</label>' +

    '</div></div>';
    return html;
}

function inputEventnameHTML(key) {
    
    var html = '' +
    '<div class="form-group col-md-6">' +
        '<label for="'+key+'-eventname">' +

        '<span data-toggle="popover"' +
        'title="Eventname" data-placement="top"' +
        'data-content="ABCD is a longitudinal study, which means some variables have values for multiple time points.' +
        'Eventname is used select a specific timepoint per variable or groups of variables." >' +
        'Eventname <i class="fas fa-info-circle fa-sm"></i>' +
        '</span></label>' +

        '<select id="'+key+'-eventname" class="form-control" data-width="100%">' +
            '<option selected value="baseline">' +
                    'baseline</option>' +
            '<option value="year 1">' +
                    'year 1</option>' +
        '</select>' +
    '</div>';
    return html;
}

function inputVariableHTML(key, name_label){
    
    var html = '' +
    '<div class="form-row">' +
    
        '<div class="form-group col-md-6">' +
        name_label +
        '<input type="text" class="form-control" id="'+key+'-input"' +
                'placeholder="" value="">' +
        '</div>' +

        inputEventnameHTML(key) +

    '</div>';
    return html;
}

function inputDataTypeOptionsHTML(key, label, data_types) {

    var html = label + 
    '<div class="btn-group-toggle btn-group" data-toggle="buttons" ' +
    'data-toggle="buttons" id="'+key+'-buttons">';

    data_types.forEach(k => {
        if (k == 'float') {
            label = 'Continuous';
        }
        else if (k == 'cat'){
            label = 'Categorical';
        }
        else if (k == 'binary'){
            label = 'Binary';
        }

        html = html + 
           '<label class="btn btn-secondary">' +
           '<input type="radio" name="'+key+'-type" value="'+k+'">'+label+'</input>' +
           '</label>';

        });

    html = html +
    '</div>' +
    '<div id="'+key+'-buttons-val" class="invalid-feedback">' +
    'You must select a data type!' +
    '</div>' +
    '<div id="'+key+'-type-warning" class="invalid-feedback">' +
    'Warning: Changing the type of a set variable can<br>lead to broken display of the parent set table.' +
    '</div>';

    return html
}

function inputDataTypeHTML(key, label, target, data_types) {

    var html = '' +
    '<div class="form-row">' +
        '<div class="col-md-6">' +
        '<div class="d-flex flex-row">' +
         
        '<div class="d-flex flex-column" style="padding-right:10px;">' +
        inputDataTypeOptionsHTML(key, label, data_types) +
        '</div>';
        
        if (!target) {
            html = html + inputDropNaHTML(key);
        }
        html = html + '</div></div>';

    data_types.forEach(k => {

        if (k == 'float') {
            html = html + ifFloatHTML(key);
        }
        else if (k == 'cat') {
            html = html + ifCatHTML(key, target);
        }
        else if (k == 'binary') {
            html = html + ifBinaryHTML(key);
        }
    });

    html = html + '</div>';
    return html;
}



function inputSetFormHTML(key) {

    html = '' +
        '<div class="form-group col-md-6">' +
        '<label for="'+key+'-data-sets"' +
        '>' +
        '<span data-toggle="popover"' +
        'title="Data Set" data-placement="top"' +
        'data-content="Data sets can be used to load in multiple data variables at once. ' +
        'To add or edit existing sets click the Add Sets button to the right, ' +
        'and once changes are made then press the Refresh Sets button.' +
        ' In general, Sets should be used to load homogenous groupings of conceptually simmilar variables."' +
        '>Data Set <i class="fas fa-info-circle fa-sm"></i></span>' +
        '</label>' +

        '<button type="button" id="'+key+'-refresh-set" class="btn btn-sm float-right" ' +
        'style="background-color:transparent;">' +
        'Refresh Sets <i class="fas fa-sync fa-xs"></i>' +
        '</button>' +

        '<button id='+key+'-add-set type="button" class="btn btn-sm float-right" ' +
        'style="background-color:transparent;">' +
        '<a style="color:inherit; text-decoration : none;" target="_blank" ' +
        'href="/applications/Sets/">Add Sets <i class="fas fa-plus fa-sm"></i></a>' +
        '</button>' +

        '<select id="'+key+'-data-sets" class="form-control" data-width="100%"></select>' +

        '<div id="'+key+'-data-sets-val" class="invalid-feedback">' +
        'You must select a set!' +
        '</div>' + 
    '</div>';

    return html

}

function ifFloatHTML(key) {

    var html = '' +
    '<div class="form-group col-md-6" style="display:none" id="'+key+'-if-float">' +

    '<label><span data-toggle="popover"' +
    'title="Continuous Outlier Options" data-placement="left"' +
    'data-content="' +

    '<b>Drop Outliers by STD</b><br>' +
    'Any data points outside of the selected value multiplied by the standard deviation (for both the upper and lower portions of the distribution)' +
    ' will be dropped.' +

    '<br><b>Drop Outliers by Percent</b><br>' +
    'The selected fixed percent of datapoints from either end of' +
    'the distribution will be dropped.' +
    '">Outlier Options <i class="fas fa-info-circle fa-sm"></i></span></label>' +

    '<!--Display under if % pressed -->' + 
    '<div class="custom-control custom-checkbox">' +
        '<input type="checkbox" class="custom-control-input" id="'+key+'-outlier-percent">' +
        '<label class="custom-control-label" for="'+key+'-outlier-percent">Drop Outliers by Percent</label>' +
    '</div>' +

    '<!--Display under if pressed -->' +
    '<div class="form-group col" style="display:none" id="'+key+'-percent">' +
    '<label></label>' +
    '<div class="range-wrap">' +
        '<div class="range-value" id="'+key+'-rangeV-percent"></div>' +
        '<input id="'+key+'-range-percent" type="range" min="0" max="10" value="1" step=".01">' +
    '</div>' +
    '</div>' +

    '<!--Display under if std pressed -->' +
    '<div class="custom-control custom-checkbox">' +
        '<input type="checkbox" class="custom-control-input" id="'+key+'-outlier-std">' +
        '<label class="custom-control-label" for="'+key+'-outlier-std">Drop Outliers by STD</label>' +
    '</div>' +

    '<!--Display under if pressed -->' +
    '<div class="form-group col" style="display:none" id="'+key+'-std">' +
    '<label></label>' +
    '<div class="range-wrap">' +
        '<div class="range-value" id="'+key+'-rangeV-std"></div>' +
        '<input id="'+key+'-range-std" type="range" min=".1" max="25" value="10" step=".1">' +
    '</div>' +
    '</div>' +
    '</div>';
    return html;
}

function ifBinaryHTML(key) {
    var html = '' +
    '<!--Display options for binary -->' +
    '<div class="form-group col-md-6" style="display:none" id="'+key+'-if-binary">' +

        '<label><span data-toggle="popover"' +
        'title="Binary Encoding Choices" data-placement="left"' +
        'data-content="<b>Default:</b><br>The top two unique values by occurance will be '+
        'used to define the two valid binary classes, any additional classes will be dropped.' +
        '<br> <b>Continuous to Binary:</b><br>A binary variable will be created from an originally ' +
        'continuous variable via thresholding via different thresholding options."' +
        '>Encoding Type <i class="fas fa-info-circle fa-sm"></i></span></label>' +

        '<div class="custom-control custom-radio">' +
        '<input type="radio" class="custom-control-input" ' +
        'name="'+key+'-binary-choice" ' +
        'id="'+key+'-binary-default" value="default" checked>' +
        '<label class="custom-control-label" for="'+key+'-binary-default"' +
        '>Default</label>' +
        '</div>' +

        '<div class="custom-control custom-radio">' +
        '<input type="radio" class="custom-control-input "' +
        'name="'+key+'-binary-choice" ' +
        'id="'+key+'-threshold" value="threshold">' +
        '<label class="custom-control-label" for="'+key+'-threshold"' +
        '>Continuous to Binary</label>' +
        '</div>' +

        '<div id="'+key+'-if-threshold" style="display:none">' + 
        '<div class="input-group mb-3" style="margin-top: 10px;">' +

            '<div class="input-group-prepend">' +
                '<span class="input-group-text" id="'+key+'-l1">Single Threshold</span>' + 
            '</div>' + 
            '<input id="'+key+'-binary-threshold" type="number" '+
                    'class="form-control" aria-describedby="'+key+'-l1" step="0.1" min="0" title="Single threshold value"></input>' + 


        '</div>' + 

        '<hr>' + 

        '<div class="input-group mb-3">' +
            
            '<div class="input-group-prepend">' +
                '<span class="input-group-text" id="'+key+'-l2">Lower Threshold</span>' + 
            '</div>' + 
            '<input id="'+key+'-binary-thresholdL" type="number" class="form-control" aria-describedby="'+key+'-l2" step="0.1" min="0" title="Lower threshold value"></input>' + 

        '</div>' + 

        '<div class="input-group mb-3">' +
            
            '<div class="input-group-prepend">' +
                '<span class="input-group-text" id="'+key+'-l3">Upper Threshold</span>' + 
            '</div>' + 
            '<input id="'+key+'-binary-thresholdU" type="number" class="form-control" aria-describedby="'+key+'-l3" step="0.1" min="0" title="Upper threshold value"></input>' + 

        '</div>' + 
        '</div>' +

    '</div>';
    return html;
}

function ifCatHTML(key, target) {

    var html = '' +
    '<!--Display options for categorical -->' +
    '<div class="form-group col-md-6" style="display:none" id="'+key+'-if-cat">'

    if (!target) {
        html = html +
        '<label><span data-toggle="popover"' +
        'title="Categorical Encoding Choices" data-placement="left"' +
        'data-content="<b>Ordinal Encoding:</b><br> Ordinal' +
        '<br><b>One Hot Encoding:</b><br>One Hot' +
        '<br><b>Dummy Encoding:</b><br> some text"' +
        '>Encoding Type <i class="fas fa-info-circle fa-sm"></i></span></label>' +

        '<div class="custom-control custom-radio">' +
            '<input type="radio" class="custom-control-input"' +
            'id="'+key+'-cat-encode-ordinal"' +
            'name="'+key+'-cat-encode-choice"' +
            'value="ordinal" checked>' +
            '<label class="custom-control-label"' +
            'for="'+key+'-cat-encode-ordinal"' +
            '>Ordinal Encoding</label>' +
        '</div>' +

        '<div class="custom-control custom-radio">' +
            '<input type="radio" class="custom-control-input"' +
            'name="'+key+'-cat-encode-choice"' +
            'id="'+key+'-cat-encode-onehot"' +
            'value="one hot">' +
            '<label class="custom-control-label"' +
            'for="'+key+'-cat-encode-onehot"' +
            '>One Hot Encoding</label>' +
        '</div>' +

        '<div class="custom-control custom-radio">' +
            '<input type="radio" class="custom-control-input"' +
            'name="'+key+'-cat-encode-choice"' +
            'id="'+key+'-cat-encode-dummy"' +
            'value="dummy">' +
            '<label class="custom-control-label"' +
            'for="'+key+'-cat-encode-dummy"' +
            '>Dummy Encoding</label>' +
        '</div>' +
        '<br>';
    }

    html = html +
    '<!--Display under if % pressed -->' +
        '<label><span data-toggle="popover"' +
        'title="Categorical Outlier Options" data-placement="left"' +
        'data-content="<b>Drop Category by Percent</b><br>' +
        'Any categories that make up less than the selected percent ' +
        'of values will be dropped if this option is selected."' +
        '>Outlier Options <i class="fas fa-info-circle fa-sm"></i></span></label>' +

        '<div class="custom-control custom-checkbox">' +
            '<input type="checkbox" class="custom-control-input" id="'+key+'-outlier-cat">' +
            '<label class="custom-control-label" for="'+key+'-outlier-cat">Drop Category by Percent</label>' +
        '</div>' +

        '<div class="form-group col" style="display:none" id="'+key+'-cat">' +
        '<label></label>' +
        '<div class="range-wrap">' +
            '<div class="range-value" id="'+key+'-rangeV-cat"></div>' +
            '<input id="'+key+'-range-cat" type="range" min="0" max="10" value="1" step=".01">' +
        '</div>' +
        '</div>' +

    '</div>';
    return html;
}

function dataLoadingStructureHTML() {

    var html = '' + 
    '<br>' +
    '<!-- Add Subject Filtering -->' +
    '<div id="filter-space"></div>' +
    '<br>' +
    '<div class="form-row">' +
        '<div class="col-md-12">' +
        '<label style="padding-left: 5px">Add Subject Filtering:&nbsp</label>' +
        '<button class="btn btn-outline-success mr-1" id="add-inclusion">Inclusions <span id="inclusion-count" class="badge badge-light">0</span></button>' +
        '<button class="btn btn-outline-danger" id="add-exclusion">Exclusions <span id="exclusion-count" class="badge badge-light">0</span></button>' +
        '</div>' +
    '</div>' +

    '<br>' +

    '<!-- Fill this with the target variable-->' +
    '<div id="target-space"></div>' +
    '<br>' +

    '<div class="form-row">' +
    '<div class="col-md-12">' +
        '<label style="padding-left: 5px">Add Additional:&nbsp</label>' +
        '<button class="btn btn-outline-primary" id="add-target">Target <span id="target-count" class="badge badge-light">0</span></button>' +
    '</div>' +
    '</div>' +
    '<br>' +

    '<!-- Add Data Source -->' +
    '<div id=data-space></div>' +
    '<br>' +
    '<div class="form-row">' +
    '<div class="col-md-12">' +
        '<label style="padding-left: 5px">Add Data Source:&nbsp</label>' +
        '<button class="btn btn-outline-info mr-1" id="add-set">Set <span id="set-count" class="badge badge-light">0</span></button>' +
        '<button class="btn btn-outline-info" id="add-var">Variable <span id="var-count" class="badge badge-light">0</span></button>' +
    '</div>' +
    '</div>' +

    '<br>' +

    '<!-- Add Strat -->' +
    '<div id="strat-space" ondrop="drop(event)"></div>' +
    '<br>' +
    '<div class="form-row">' +
    '<div class="col-md-12">' +
        '<label style="padding-left: 5px">Add Non-Input:&nbsp</label>' +
        '<button class="btn btn-outline-secondary" id="add-strat">Variable <span id="strat-count" class="badge badge-light">0</span></button>' +
    '</div>' +
    '</div>' +
    '<br><br><br><br><br>';
    
    return html;
}