

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
    
    var model_descr = 'Selection of which ML Model to use';
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

    var obj_descr = 'Selection of Feature Selector to use';
    var obj_label = getPopLabel(key, "Feature Selector ", obj_descr, '-obj-input');

    var html = getBaseObjHTML(key, obj_label);
    html = html + '<div id="'+key+'-model-space"></div>';

    // Wrap in tab div
    html = '<div class="tab-pane active" role="tabpanel" id="'+key+'-tab">' + html + '</div>';

    return html;
}

function getBaseImputerHTML(key) {

    var obj_descr = 'Selection of Imputer to use';
    var obj_label = getPopLabel(key, "Imputer ", obj_descr, '-obj-input');

    var html = getBaseObjHTML(key, obj_label);
    html = html + '<div id="'+key+'-model-space"></div>';

    // Wrap in tab div
    html = '<div class="tab-pane active" role="tabpanel" id="'+key+'-tab">' + html + '</div>';

    return html;
}

function getBaseScalerHTML(key) {

    var obj_descr = 'Selection of Scaler to use';
    var obj_label = getPopLabel(key, "Scaler ", obj_descr, '-obj-input');
    var html = getBaseObjHTML(key, obj_label);

    // Wrap in tab div
    html = '<div class="tab-pane active" role="tabpanel" id="'+key+'-tab">' + html + '</div>';

    return html;
}

function getBaseTransformerHTML(key) {

    var obj_descr = 'Selection of Transformer to use';
    var obj_label = getPopLabel(key, "Transformer ", obj_descr, '-obj-input');
    var html = getBaseObjHTML(key, obj_label);

    // Wrap in tab div
    html = '<div class="tab-pane active" role="tabpanel" id="'+key+'-tab">' + html + '</div>';
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