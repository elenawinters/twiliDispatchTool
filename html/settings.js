// This basically manages all settings in the settings div. if this isn't here, none of them will work.
// This file also serves at the clients global definition file. Extra required.

let ws_open = false;

// This is the settings object. Anything that can be changed will be defined here.
// These are also the default settings.
let Settings = {
    style_version: 2,
    auto_ws_connect: true,
    replymsg: true,
    region: 'dt-np-wl'
}

let DefaultSettings = {...Settings}

// This is scuffed and I hate it but hacky stuff requires hacky stuff
const style_system_version = 1;
const saved_style_system_version = window.localStorage.getItem(`style_system_version`)
if (saved_style_system_version == null || saved_style_system_version != style_system_version) {
    window.localStorage.setItem('style_system_version', style_system_version)
    window.localStorage.removeItem('setting_style_version')
}

Object.keys(Settings).forEach((setting) => {
    // console.log('Setting settings')
    const retrieved_setting = window.localStorage.getItem(`setting_${setting}`)
    if (retrieved_setting != null) {
        if (retrieved_setting == 'true' || retrieved_setting == 'false') {
            Settings[setting] = (retrieved_setting === 'true')
        }
        else if (!isNaN(retrieved_setting)) {
            Settings[setting] = parseInt(retrieved_setting)
        }
        else {
            Settings[setting] = retrieved_setting
        }
    }
})

function updateSettingSelect(setting) {
    const state = $(`#setting_${setting}`).find(":selected").val();
    if (state == 'none') {
        state = '-1'
    }

    if (state != DefaultSettings[setting]) {
        window.localStorage.setItem(`setting_${setting}`, state)
        Settings[setting] = state
    } else {
        window.localStorage.removeItem(`setting_${setting}`)
        Settings[setting] = DefaultSettings[setting]
    }


    if (setting == 'style_version') {
        if (state == -1) {
            $('#dt-style').attr('href', '')
        }
        else {
            $('#dt-style').attr('href', `./styles/dispatch${Settings[setting]}.css`)
        }
    }

    updateBtnTypes()
}


function updateSettingString(setting, value) {
    if (value != DefaultSettings[setting]) {
        window.localStorage.setItem(`setting_${setting}`, value)
        Settings[setting] = value
    } else {
        window.localStorage.removeItem(`setting_${setting}`)
        Settings[setting] = DefaultSettings[setting]
    }
}


function updateSettingCheck(setting) {
    const state = $(`#setting_${setting}`).is(":checked")

    if (state != DefaultSettings[setting]) {
        window.localStorage.setItem(`setting_${setting}`, state)
        Settings[setting] = state
    } else {
        window.localStorage.removeItem(`setting_${setting}`)
        Settings[setting] = DefaultSettings[setting]
    }

    if (setting == 'replymsg') {
        updateTextArea()
    }
}

function updateBtnTypes() {
    // console.log($('[data-btn-type]'))
    $('[data-btn-type]').each(function() {
        switch (Number(Settings.style_version)) {
            case 2:
                $(this).removeClass('btn-' + $(this).data('btn-type'))
                if ($(this).data('ignore-btn-default') != true) {
                    $(this).addClass('btn-default')
                }
                break;
            default:
                $(this).addClass('btn-' + $(this).data('btn-type')).removeClass('btn-default')
        }
    });
    // console.log(Settings)
    // if (Settings.style_version != 2) {
    //     $('[data-btn-type]').each(function() {
    //         console.log($(this).addClass('btn-' + $(this).data('btn-type')))
    //         // $(this).addClass()
    //     });
    // } else {
    //     $('[data-btn-type]').each(function() {
    //         console.log($(this).removeClass('btn-' + $(this).data('btn-type')))
    //         // $(this).addClass()
    //     });
    // }
}

// once the page finishes loading, set the settings :)
window.addEventListener("DOMContentLoaded", (event) => {
    console.log(Settings)
    Object.keys(Settings).forEach((setting) => {
        // console.log('Setting settings')
        // const retrieved_setting = window.localStorage.getItem(`setting_${setting}`)
        // if (retrieved_setting != null) {
        //     if (retrieved_setting == 'true' || retrieved_setting == 'false') {
        //         Settings[setting] = (retrieved_setting === 'true')
        //     }
        //     else if (!isNaN(retrieved_setting)) {
        //         Settings[setting] = parseInt(retrieved_setting)
        //     }
        // }

        updateBtnTypes()

        switch (typeof Settings[setting]) {
            case "boolean":
                $(`#setting_${setting}`).prop('checked', Settings[setting]);
                break;
            case "number":
                // console.log(Settings[setting])
                $(`#setting_${setting}`).val(Settings[setting]).change();
                break;
        }

    });
});



// $('head').append('<link href="/np/dispatch/beta/dispatching.css" rel="stylesheet">');