var settings;


function getSettingsHTML() {
    var html = '<div id="settings-event-rename">' + 
    '</div>';

    return html;
}


function showUserSettings() {

    // Load settings
    settings = {};

    if (settings['event_mapping'] == undefined) {
        settings['event_mapping'] = {'None': ''};
    }

    // Clear everything
    noProjectDefault();
    jQuery('#body-noproj').css('display', 'none');

    var html = getSettingsHTML();
    jQuery('#body-settings').append(html);
    jQuery('#body-settings').css('display', 'block');

    if ((all_events.length !== 1) && (all_events[0] !== 'None')) {

        var header_html = '<div class="row form-group">' + 
        '<div class="col-sm-5">' +
        '<b>Eventname</b>' +
        '</div>' +
        '<div class="col-sm-5">' +
        '<b>Append Short Name</b>' +
        '</div>' +
        '<div class="col-sm-2">' +
        '<b>Default</b>' +
        '</div>' +
        '</div><hr>';
        jQuery('#settings-event-rename').append(header_html);
        

        var cnt = 0;
        all_events.forEach(event => {

            var r_id = 'event-' + cnt.toString();
            cnt += 1;

            var r_html = '<div class="row form-group">' + 
            '<label for="'+r_id+'" class="col-sm-5 col-form-label">' + event + '</label>' +
            '<div class="col-sm-5">' +
              '<input type="text" class="form-control" id="'+r_id+'">' +
            '</div>' +
            
            '<div class="form-group col-md-2 text-center">' + 
            '<div class="custom-control custom-checkbox">' +
            '<input type="checkbox" class="custom-control-input" id="'+r_id+'-default">' +
            '<label for="'+r_id+'-default" class="custom-control-label"></label>' +
            '</div>' +
            '</div>' +
            '</div>';

            jQuery('#settings-event-rename').append(r_html);
            
            

        });

    }

}