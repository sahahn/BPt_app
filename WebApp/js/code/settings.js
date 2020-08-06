




function getSettingsHTML() {
    var html = '' +

    '<div class="row form-group">' + 
    'test' +
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

        
        
    }

}