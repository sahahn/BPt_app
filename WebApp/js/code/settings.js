var settings;


function getSettingsHTML() {
    var html = '<div id="settings-event-rename">' + 
    '</div>';

    return html;
}


function showUserSettings() {

    // Load settings
    settings = {};

    // Clear everything
    noProjectDefault();
    jQuery('#body-noproj').css('display', 'none');

    var html = getSettingsHTML();
    jQuery('#body-settings').append(html);
    jQuery('#body-settings').css('display', 'block');

    if ((all_events.length !== 1) && (all_events[0] !== 'None')) {

        var cnt = 0;

        all_events.forEach(event => {

            var r_id = 'event-' + cnt.toString();

            var r_html = '<div class="row form-group">' + 
            '<label for="'+r_id+'" class="col-sm-2 col-form-label">' + event + '</label>' +
            '<div class="col-sm-10">' +
              '<input type="password" class="form-control" id="inputPassword" placeholder="Password">' +
            '</div>' +
            '</div>';

            jQuery('#settings-event-rename').append(r_html)
            

        });

    }

}