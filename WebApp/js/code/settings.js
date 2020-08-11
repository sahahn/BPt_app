function getSettingsHTML() {
    var html = '<div id="settings-event-rename">' + 
    '</div>';

    return html;
}

function showUserSettings() {

    // Clear everything
    noProjectDefault();
    jQuery('#body-noproj').css('display', 'none');

    var html = getSettingsHTML();
    jQuery('#body-settings').append(html);
    jQuery('#body-settings').css('display', 'block');

    // If more than one event
    if (all_events.length !== 1) {
        ifEvents();
    }

    // If only one event
    else {

        var single_event = all_events[0];

        if (settings['event_mapping'] == undefined) {
            settings['event_mapping'] = {single_event: ''}
        }
    
        if (settings['event_default'] == undefined) {
            settings['default'] = 'None';
        }

    }

}

function ifEvents() {
    
    if (settings['event_mapping'] == undefined) {
        settings['event_mapping'] = { 'None': '' };
    }

    if (settings['event_default'] == undefined) {
        settings['default'] = 'None';
    }

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
            '<label for="' + r_id + '" class="col-sm-5 col-form-label">' + event + '</label>' +
            '<div class="col-sm-5">' +
            '<input data-eventname="' + event + '" type="text" class="form-control short-name" id="' + r_id + '">' +
            '</div>' +

            '<div class="form-group col-md-2 text-center">' +
            '<div class="custom-control custom-checkbox">' +
            '<input data-eventname="' + event + '" type="checkbox" class="custom-control-input default-box" id="' + r_id + '-default">' +
            '<label for="' + r_id + '-default" class="custom-control-label"></label>' +
            '</div>' +
            '</div>' +
            '</div>';

        jQuery('#settings-event-rename').append(r_html);
    });

    // Proc save short name changes
    jQuery('.short-name').on('change', function () {
        var event = $(this).data()['eventname'];
        settings['event_mapping'][event] = $(this).val();
    });

    // Apply any saved names
    jQuery('.short-name').each(function () {
        var event = $(this).data()['eventname'];
        if (settings['event_mapping'][event] == undefined) {
            $(this).val(event).trigger('change');
        }
        else {
            $(this).val(settings['event_mapping'][event]).trigger('change');
        }
    });

    // Proc default event name option
    jQuery('.default-box').on('click', function () {
        jQuery('.default-box').prop('checked', false);
        $(this).prop('checked', true);
        settings['event-default'] = $(this).data()['eventname'];
    });
}
