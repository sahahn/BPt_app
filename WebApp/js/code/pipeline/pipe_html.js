

//////////////////////////
// Pipeline Piece HTML //
////////////////////////

function getBaseObjHTML(key, obj_label) {

    var html = '' +
    '<div class="form-row">' +

    '<div class="form-group col-md-6">' +
    obj_label +
    '<select id="'+key+'-obj-input" class="form-control" data-width="100%"></select>' +
    '</div>' +

    getScopeHTML(key) +

    '</div>' +

    '<div id="'+key+'-if-obj" class="form-row" style="display: none">' +

    '<div class="form-group col-md-6">' +

    '<button type="button" class="btn" id="'+key+'-edit-params"' +
    'data-toggle="modal" data-target="#'+key+'-edit-popup">' +
    'Change Params <i class="fas fa-cog"></i>' + 
    '</button>' +

    '<button class="btn" style="margin-left:10px">' +
    '<a id="'+key+'-open-docs" style="color:inherit; text-decoration:none;" target="_blank" href="#">' +
    'Open Docs <img id="'+key+'-sklearn-logo" src="images/scikit-learn-logo-small.png" width="60px" style="background:transparent; display:none"></a>' +
    '</button>' +

    '</div>' + 
    '</div>';

    return html;
}

function getObjHTML(key, getBaseHTML, bold_text) {

    // Get base ensemble html
    var html = getBaseHTML(key);

    // Wrap in tab content div
    html = '<div class="tab-content" id="'+key+'-tabs">' + html + '</div>';

    // Wrap in card
    var card_text = '<span id="'+key+'-card-start-text"><b>'+bold_text+'</b></span>';
    var card_html = cardWrapHTML(card_text, key, html, false);

    return card_html;
}

function getBaseModelHTML(key, prepend='') {
    
    var model_descr = 'The choice of model. This is explicitly the pipeline piece ' +
    'responsible for making predictions given the input passed to it from the earlier ML Pipeline steps. ' +
    'The model can either be a single estimator, or can be an Ensemble, which represents different strategies ' +
    'for combining the predictions from multiple base learners. Note: In some cases the distinction between Models and Ensembles ' +
    'is not always super clear. For example, Random Forests are an ensemble based model, but are not listed under Ensembles within the ' +
    'choices here. The reason for that is that that the choice of base ensemble model is fixed as a decision tree, vs. other ensemble methods ' +
    'where the choice of a base learner is more flexible. In this sense, we consider Ensemble methods as those which require the selection of one ' +
    'or more base models, rather then its more literal and explicit meaning.<br><br>' +
    'Note: Models are sensitive to the type of the ML Pipeline, for example there may be different avaliable options ' +
    'for regression based ML Pipelines vs. binary ones.';
    var model_label = getPopLabel(key, prepend + "Model ", model_descr, '-obj-input');

    var html = getBaseObjHTML(key, model_label);

    html = html + 
    '<div id="' + key + '-ensemble-space" style="display: none;"></div>' +
    '<div id="' + key + '-show-ensemble" style="display: none;"><br>' +
    '<label style="padding-left: 5px">Add:&nbsp</label>' +
    '<button class="btn btn-outline-secondary" id="add-' + key + '-ensemble">' +
    'Ensemble Base Model <span id="' + key + '-ensemble-space-count" class="badge badge-light">0</span></button></div>';

    // Wrap in tab div
    html = '<div class="tab-pane active" role="tabpanel" id="'+key+'-tab">' + html + '</div>';
    
    return html;
}

function getModelHTML(key, prepend='') {

    var html = getBaseModelHTML(key, prepend);

    // Wrap in tab content div
    html = '<div class="tab-content" id="'+key+'-tabs">' + html + '</div>';

    var card_text = '<span id="'+key+'-card-start-text"><b>' + prepend + 'Model</b></span>';
    var card_html = cardWrapHTML(card_text, key, html, true);

    return card_html;
}

function getBaseEnsembleModelHTML(key) {

    var model_descr = 'Selection of which Base ML Model piece to use';
    var model_label = getPopLabel(key, "Base Model ", model_descr, '-obj-input');
    var html = getBaseObjHTML(key, model_label);

    // Wrap in tab div
    html = '<div class="tab-pane active" role="tabpanel" id="'+key+'-tab">' + html + '</div>';

    return html;
}

function getBaseFeatSelectorHTML(key) {

    var obj_descr = 'The, optional, selection of which feature selector to use. ' +
    'Within BPt feature selectors are any pipeline objects which perform some sort of explicit feature selection ' +
    '(conceptually different then dimensionality reduction techniques like PCA). For example, any piece ' +
    'that takes in some set of features and essentially passes on a reduced subset of those original features.<br><br>' +
    'Note: Feature Selectors are sensitive to the type of the ML Pipeline, for example there may be different avaliable options ' +
    'for regression based ML Pipelines vs. binary ones.';
    var obj_label = getPopLabel(key, "Feature Selector ", obj_descr, '-obj-input');

    var html = getBaseObjHTML(key, obj_label);
    html = html + '<div id="'+key+'-model-space"></div>';

    // Wrap in tab div
    html = '<div class="tab-pane active" role="tabpanel" id="'+key+'-tab">' + html + '</div>';

    return html;
}

function getBaseImputerHTML(key) {

    var obj_descr = 'Selection of which Imputer / imputation strategy to use. ' +
    'If there is any missing data (NaN’s) that have been kept within the loaded data, ' +
    'then an imputation strategy must be defined! ' +
    'This pipeline piece allows you to define an imputation strategy. ' +
    'One important consideration to take into account when choosing and defining Imputers is ' +
    'the associated scope of that Imputer. For example, you very well might want to treat ' +
    'Categorical and Continuous data differently! This can be achieved by setting different scopes. ' +
    'Note that is the iterative imputer is selected, then scope also controls the type (regressor vs. classifier) ' +
    'of the base model. I.e., regressors will be shown unless the scope is Categorical, then classifier options will be shown.';
    var obj_label = getPopLabel(key, "Imputer ", obj_descr, '-obj-input');

    var html = getBaseObjHTML(key, obj_label);
    html = html + '<div id="'+key+'-model-space"></div>';

    // Wrap in tab div
    html = '<div class="tab-pane active" role="tabpanel" id="'+key+'-tab">' + html + '</div>';

    return html;
}

function getBaseScalerHTML(key) {

    var obj_descr = 'This defines the optional choice of scaler object. ' +
    'Within BPt the Scaler refers to any piece within the ML Pipeline which are ' +
    'responsible for the scaling / normalizing functionality. Specifically, ' +
    'this can be thought of as any transformation upon the data which does not require information about ' +
    'the target variable, does not change the number of features and acts on each feature independently. ' +
    'For example, a common scaling procedure is to ' +
    'employ the StandardScaler option, which sets all features individually to have mean 0 and standard deviation of 1.';
    var obj_label = getPopLabel(key, "Scaler ", obj_descr, '-obj-input');
    var html = getBaseObjHTML(key, obj_label);

    // Wrap in tab div
    html = '<div class="tab-pane active" role="tabpanel" id="'+key+'-tab">' + html + '</div>';

    return html;
}

function getBaseTransformerHTML(key) {

    var obj_descr = 'This parameter controls the optional selection of a Transformer with the ML Pipeline. ' +
    'Specifically, the choice of Transformer with the BPt refers to any type of transformation to the loaded data ' +
    'which may change the number of features in a non-simple way (i.e., conceptually distinct from Feat Selectors). ' +
    'These are transformations like applying Principle Component Analysis (PCA), or on the fly One Hot Encoding. ' + 
    'As with other pipeline pieces, scopes can be set to apply these transformation on more specific subsets of the data.';

    var obj_label = getPopLabel(key, "Transformer ", obj_descr, '-obj-input');
    var html = getBaseObjHTML(key, obj_label);

    // Wrap in tab div
    html = '<div class="tab-pane active" role="tabpanel" id="'+key+'-tab">' + html + '</div>';
    return html;
}

//////////////////
// Select HTML //
////////////////

function getRemoveTabCloseHTML(key) {

    var close_btn = '&nbsp;<button type="button" class="close float-right" aria-label="Remove" id="'+key+'-remove-tab">' +
                    '<span aria-hidden="true">&times;</span></button>';

    var split_key = key.split('_');
    if (split_key.length > 1) {
        var select_split = split_key[1].split('-');
        if (select_split.length == 1) {
            return close_btn;
        }
    }

    return '';
}

function getTabHTML(key) {

    var start = '<i>Select Choice</i>';
    
    var html = '' +
    '<li class="nav-item">' +
    '<span class="nav-link fake-link" id="'+key+'-select-tab" href="#'+key+'-tab" role="tab">' + start + getRemoveTabCloseHTML(key) + '</span>' +
    '</li>';

    return html;
}

////////////////////
// Pipeline HTML //
//////////////////

function getMLPipeHTML(key) {

    // Make load structure
    var html = '';

    // For the flexible pieces add the add button
    flex_pipe_pieces.forEach(p => {
        
        var space_name = getSpaceName(key, p);
        var add_name = getDisplayFlexPieceName(p);

        // Add to the html
        html = html + '<div id="'+space_name+'"></div>' +
        '<br>' +
        '<div class="form-row">' +
        '<div class="col-md-12">' +
            '<label style="padding-left: 5px">Add New:&nbsp</label>' +
            '<button class="btn btn-outline-secondary" id="add-'+space_name+'">' +
            add_name + ' <span id="'+space_name+'-count" class="badge badge-light">0</span></button>' +
        '</div>' +
        '</div>' +
        '<br>';
    });

    // For static pieces, place at bottom, no add button
    static_pipe_pieces.forEach(piece => {
        var space_name = getSpaceName(key, piece);
        html = html + '<div id="'+space_name+'"></div>';
    });

    return html;
}