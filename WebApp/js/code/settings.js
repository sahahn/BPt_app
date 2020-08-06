




function getSettingsHTML() {
    var html = '<div id="settings-event-rename">' + 
    '</div>';

    return html;
}


function showUserSettings() {

    // Clear everything
    noProjectDefault();
    jQuery('#body-noproj').css('display', 'none');
    jQuery('#body-settings').empty();

    var html = getSettingsHTML();
    jQuery('#body-settings').append(html);
    jQuery('#body-settings').css('display', 'block');

    if ((all_events.length !== 1) && (all_events[0] !== 'None')) {

        all_events.forEach(event => {

            var r_html = '<div class="row form-group">' + 
            '<label for="inputPassword" class="col-sm-2 col-form-label">Password</label>' +
            '<div class="col-sm-10">' +
              '<input type="password" class="form-control" id="inputPassword" placeholder="Password">' +
            '</div>' +
            '</div>';

            jQuery('#settings-event-rename').append(r_html)
            

        });

        class="row form-group"

        
        
    }

}