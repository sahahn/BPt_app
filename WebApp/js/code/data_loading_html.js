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

function getEventNameOptionsHTML() {

    var html = '';
    Object.keys(settings['event_mapping']).forEach(event => {

        if (event == settings['event_default']) {
            html += '<option selected value="' + event + '">'+event+'</option>';   
        }
        else {
            html += '<option value="' + event + '">'+event+'</option>';
        }
    });

    return html;
}

function inputEventnameHTML(key) {

    var eventname_text = 'If some variables have values across multiple time points, then ' +
    'the Eventname parameter is used select a specific timepoint per variable or groups of variables. ' +
    'This can be particulary useful for longitudinal studies.<br>Note that a special Append Short Name can be ' +
    'specified in the global Settings menu (found on the sidebar) for each eventname. The Append Short Name ' +
    'is a value appended to the end of a variable or set name in order to make it unique, this full name is ' +
    'the name shown in plots, card titles and option menus. By default this Short Name will just be the exact name ' + 
    'of the event.'
    
    var html = '' +
    '<div class="form-group col-md-6">' +
        '<label for="'+key+'-eventname">' +

        '<span data-toggle="popover"' +
        'title="Eventname" data-placement="top"' +
        'data-content="' + eventname_text + '" >' +
        'Eventname <i class="fas fa-info-circle fa-sm"></i>' +
        '</span></label>' +

        '<select id="'+key+'-eventname" class="form-control" data-width="100%">' +
            getEventNameOptionsHTML() + 
        '</select>' +
    '</div>';
    return html;
}

function inputVariableHTML(key, name_label){
    
    var html = '' +
    '<div class="form-row">' +
    
        '<div class="form-group col-md-6">' +
        name_label +
        '<select id="'+key+'-input" class="form-control" data-width="100%"></select>' +
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
            html = html + ifCatHTML(key);
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
        ' In general, Sets should be used to load homogenous groupings of conceptually simmilar variables.<br><br>' +
        'One a set is loaded, a table will appear showing you information about each loaded variable. ' +
        'Each variable has a button which allows you to set specific loading settings for just that variable. ' +
        'When this is done, any parameters will override those for the main set."' +
        '>Data Set <i class="fas fa-info-circle fa-sm"></i></span>' +
        '</label>' +

        //'<button type="button" id="'+key+'-refresh-set" class="btn btn-sm float-right" ' +
        //'style="background-color:transparent;">' +
        //'Refresh Sets <i class="fas fa-sync fa-xs"></i>' +
        //'</button>' +

        '<button type="button" id="'+key+'-add-sets-but" class="btn btn-sm float-right" ' +
        'style="background-color:transparent;">' +
        'Add/Edit Sets <i class="fas fa-plus fa-xs"></i>' +
        '</button>' +

        //'<a style="color:inherit; text-decoration : none;" target="_blank" ' +
        //'href="Sets/">Add Sets <i class="fas fa-plus fa-sm"></i></a>' +        

        '<select id="'+key+'-data-sets" class="form-control" data-width="100%"></select>' +

        '<div id="'+key+'-data-sets-val" class="invalid-feedback">' +
        'You must select a set!' +
        '</div>' + 
    '</div>';

    return html

}

function getFloatOutlierHTML(key, append='') {
    var a = append;

    var html = '' +

    '<!--Display under if std pressed -->' +
    '<div class="custom-control custom-checkbox">' +
        '<input type="checkbox" class="custom-control-input" id="'+key+'-outlier-std'+a+'">' +
        '<label class="custom-control-label" for="'+key+'-outlier-std'+a+'">Drop Outliers by STD</label>' +
    '</div>' +

    '<div class="form-group col" style="display:none; padding:0px;" id="'+key+'-std'+a+'">' +

        '<div class="input-group mb-3" style="margin-top: 10px;">' +
            '<div class="input-group-prepend">' +
                '<span class="input-group-text" id="'+key+'-s1'+a+'">Single STD Threshold</span>' + 
            '</div>' + 
            '<input id="'+key+'-range-std'+a+'" type="number" class="form-control" aria-describedby="'+key+'-s1'+a+'" step="0.1" min="0" title="Single STD Value"></input>' + 
        '</div>' + 

        '<hr>' + 

        '<div class="input-group mb-3">' +
            '<div class="input-group-prepend">' +
                '<span class="input-group-text" id="'+key+'-s2'+a+'">Lower STD Threshold</span>' + 
            '</div>' + 
            '<input id="'+key+'-range-std'+a+'L" type="number" class="form-control" aria-describedby="'+key+'-s2'+a+'" step="0.1" min="0" title="Lower STD Value"></input>' + 
        '</div>' + 

        '<div class="input-group mb-3">' +
            '<div class="input-group-prepend">' +
                '<span class="input-group-text" id="'+key+'-s3'+a+'">Upper STD Threshold</span>' + 
            '</div>' + 
            '<input id="'+key+'-range-std'+a+'U" type="number" class="form-control" aria-describedby="'+key+'-s3'+a+'" step="0.1" min=".1" title="Upper STD Value"></input>' + 
        '</div>' +

    '</div>' +

    '<!--Display under if % pressed -->' + 
    '<div class="custom-control custom-checkbox">' +
        '<input type="checkbox" class="custom-control-input" id="'+key+'-outlier-percent'+a+'">' +
        '<label class="custom-control-label" for="'+key+'-outlier-percent'+a+'">Drop Outliers by Percent</label>' +
    '</div>' +

    '<div class="form-group col" style="display:none; padding:0px;" id="'+key+'-percent'+a+'">' +

        '<div class="input-group mb-3" style="margin-top: 10px;">' +
            '<div class="input-group-prepend">' +
                '<span class="input-group-text" id="'+key+'-p1'+a+'">Single Percent Threshold</span>' + 
            '</div>' + 
            '<input id="'+key+'-range-percent'+a+'" type="number" class="form-control" aria-describedby="'+key+'-p1'+a+'" step="0.1" min="0" max="10" title="Single Percent Value"></input>' + 
        '</div>' + 

        '<hr>' + 

        '<div class="input-group mb-3">' +
            '<div class="input-group-prepend">' +
                '<span class="input-group-text" id="'+key+'-p2'+a+'">Lower Percent Threshold</span>' + 
            '</div>' + 
            '<input id="'+key+'-range-percent'+a+'L" type="number" class="form-control" aria-describedby="'+key+'-p2'+a+'" step="0.1" min="0" max="10" title="Lower Percent Value"></input>' + 
        '</div>' + 

        '<div class="input-group mb-3">' +
            '<div class="input-group-prepend">' +
                '<span class="input-group-text" id="'+key+'-p3'+a+'">Upper Percent Threshold</span>' + 
            '</div>' + 
            '<input id="'+key+'-range-percent'+a+'U" type="number" class="form-control" aria-describedby="'+key+'-p3'+a+'" step="0.1" min="0" max="10" title="Upper Percent Value"></input>' + 
        '</div>' + 

    '</div>';

    return html;
}

function getSTDText() {
    return '<b>Drop Outliers by STD</b><br>' +
    'If single percent threshold, then ' +
    'any data points outside of the selected value multiplied by the standard deviation (for both the upper and lower portions of the distribution)' +
    ' will be dropped. ' +
    '<br>If a combination of lower and upper STD threshold, then each parameter controls the threshold for that portion of ' +
    'the distribution. Further, you may optionally threshold by only one of Upper or Lower if desired by simply leaving the ' +
    'other empty.';
}

function getPercentText() {
    return '<br><b>Drop Outliers by Percent</b><br>' +
    'If single percent threshold then the selected fixed percent of datapoints from either end of' +
    'the distribution will be dropped. For example, if set to 1%, then for each feature (if multiple) ' +
    'all data points with < the value of that feature at the first percentile will be dropped. Likewise, ' +
    'all values > the value of that feature at the 99th percentile will be dropped. ' +
    '<br>If instead a combination of Lower and Upper percent thresholds are selected, then a percentile threshold ' +
    'can be specified seperately for either end of the distribution. You may also choose to not performing filtering ' + 
    'on one end, e.g., the upper portion, and instead only pass a value to the lower. Note: when passing a value for the ' +
    'Upper Percent Threshold, you should pass the amount you want taken off. E.g., passing 1% will indicate that values greater ' +
    'than the 99th percentile should be dropped, and passing 99% would instead only leave the first 1% of the distribution (a bad idea)';
}

function ifFloatHTML(key) {

    var html = '' +
    '<div class="form-group col-md-6" style="display:none" id="'+key+'-if-float">' +

    '<label><span data-toggle="popover"' +
    'title="Continuous Outlier Options" data-placement="left"' +
    'data-content="' +
    getSTDText() +
    '<br>' + 
    getPercentText() +
    '"' +
    '">Outlier Options <i class="fas fa-info-circle fa-sm"></i></span></label>' +
    getFloatOutlierHTML(key) +
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
        '<br><b>Continuous to Binary:</b><br>A binary variable will be created from an originally ' +
        'continuous variable via thresholding via different thresholding options.<br>' +
        'In the case of selecting a single threshold, any value less than the threshold will be set to 0 ' +
        'and any value greater than or equal to the threshold will be set to 1.<br>' +
        'In the case of selecting a lower and upper threshold, a value must be set for both. ' +
        'For the lower threshold any value that is greater than the value will be set to 1, ' +
        'and any value <= upper and >= lower will be dropped. ' + 
        'Likewise, for the upper threshold, any value that is less than upper will be set to 0, ' +
        'and any value <= upper and >= lower will be dropped."' +
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

    html = html +
        '<label><span data-toggle="popover"' +
        'title="Categorical Encoding Choices" data-placement="left"' +
        'data-content="<b>Default:</b><br>' +
        'Default behavior for a categorical variable indicates that the variable ' +
        'should be ordinally encoded, where each unique value (be it a number or string) ' +
        'is encoded a 0 to n-1, where n is the number of unique categories.<br>' +
        'Note: If behavior like one hot encoding is desired, it should be specified when ' +
        'setting up the model pipeline, as that way it will be properly nested within cross validation.' +
        '<br> <b>Continuous to Categorical:</b><br>' +
        'The continuous to categorical option allows you to perform k-bin encoding on a ' +
        'originally continusous variable, thus transforming it into a categorical variable. ' +
        'As with the default behavior, the resulting categorical variable will be ordinally encoded after binning.' +
        '<br>If selected, there are two avaliable parameters.<br>' +
        '<b>Num. Bins</b> determines the number of k-bins in which to encode the variable.<br>' +
        '<b>Bin Strategy</b> determines the type of categorical encoding to perform, options are: ' +
        '<ul>' +
        '<li><b>Uniform</b> All bins in each feature have identical widths</li>' +
        '<li><b>Quantile</b> All bins in each feature have the same number of points</li>' +
        '<li><b>KMeans</b> Values in each bin have the same nearest center of a 1D k-means cluster</li>' +
        '</ul>' +
        '"' +
        '>Encoding Type <i class="fas fa-info-circle fa-sm"></i></span></label>' +

        '<div class="custom-control custom-radio">' +
        '<input type="radio" class="custom-control-input" ' +
        'name="'+key+'-cat-choice" ' +
        'id="'+key+'-cat-default" value="default" checked>' +
        '<label class="custom-control-label" for="'+key+'-cat-default"' +
        '>Default</label>' +
        '</div>' +

        '<div class="custom-control custom-radio">' +
        '<input type="radio" class="custom-control-input "' +
        'name="'+key+'-cat-choice" ' +
        'id="'+key+'-bins" value="bins">' +
        '<label class="custom-control-label" for="'+key+'-bins"' +
        '>Continuous to Categorical</label>' +
        '</div>' +

        '<div class="'+key+'-if-bins" style="display:none">' + 
        '<div class="input-group mb-3" style="margin-top: 10px;">' +

            '<div class="input-group-prepend">' +
                '<span class="input-group-text" id="'+key+'-n-bins-label">&nbsp;Num. Bins&nbsp;&nbsp;</span>' + 
            '</div>' + 

            '<input id="'+key+'-cat-bins" type="number" '+
            'class="form-control" aria-describedby="'+key+'-n-bins-label" step="1" min="2" value="5"></input>' + 
        
        '</div>' + 

        '<div class="input-group mb-3" style="margin-top: 10px;">' +

            '<div class="input-group-prepend">' +
                '<span class="input-group-text" id="'+key+'-bin-strat-label">Bin Strategy</span>' + 
            '</div>' +

            '<select class="form-control" id="'+key+'-cat-bin-strat" class="form-control" aria-describedby="'+key+'-bin-strat-label">' +
            '<option>Uniform</option>' +
            '<option selected="selected">Quantile</option>' +
            '<option>KMeans</option>' +
            '</select>' +

        '</div>' + 
        '</div>' + 

        '<label><span data-toggle="popover"' +
        'title="Categorical Outlier Options" data-placement="left"' +
        'data-content="<b>Drop Category by Percent</b><br>' +
        'Any categories that make up less than the selected percent ' +
        'of values will be dropped if this option is selected. For example, ' +
        'passing .1, would indicate that any category that makes up less than 10% of ' +
        'the frequency out of all categories should be dropped.' +
        '<hr>' +
        'If Cont. to Categorical is selected, these options are avaliable:<br>' +
        getSTDText() +
        getPercentText() +
        '"' +
        '>Outlier Options <i class="fas fa-info-circle fa-sm"></i></span></label>' +

        '<div class="'+key+'-if-bins" style="display:none">' + 
        getFloatOutlierHTML(key, append='-cat') + 
        '</div>' + 

        '<div class="custom-control custom-checkbox">' +
            '<input type="checkbox" class="custom-control-input" id="'+key+'-outlier-cat">' +
            '<label class="custom-control-label" for="'+key+'-outlier-cat">Drop Category by Frequency</label>' +
        '</div>' +

        '<div class="form-group col" style="display:none; padding:0px;" id="'+key+'-cat">' +
            
            '<div class="input-group mb-3" style="margin-top: 10px;">' +
                '<div class="input-group-prepend">' +
                    '<span class="input-group-text" id="'+key+'-c1">Drop Frequency Threshold</span>' + 
                '</div>' + 
                '<input id="'+key+'-range-cat" type="number" class="form-control" aria-describedby="'+key+'-c1" step="0.001" min=0 max=".95" title="Drop Frequency Value"></input>' + 
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