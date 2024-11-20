// https://getbootstrap.com/docs/5.3/components/buttons/

// https://stackoverflow.com/a/58944651
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

const regions_named = {
    'dt-np-wl': 'NoPixel WL',
    'dt-np-pg': 'NoPixel Public Green',
    'dt-np-pb': 'NoPixel Public Blue',
    'dt-np-br': 'NoPixel Brazil'
}

// const regions_inverted = Object.fromEntries(Object.entries(regions_named).map(([k, v]) => [v, k]))

// original was hosted on https://dispatchtool.w3spaces.com/
// I'm rewriting it cuz I want to, and I think I can do it better
// Does this tool even resemble the original anymore? I don't think so personally...

const default_emotes = ['🚓', '🚑', '🎧', '🚙', '🏍️', '🏎️', '🚗', '🤡', '🚁', '🔎', '👮', '🧼', '👟', '🏡', '🍃', '🛑', '🏦', '🔫', '⛑️', '🕵️', '💼', '⚖️', '🤠', '🩳', '👻', '🎣', '💥', '💣', '🔥', '🛎️', '🚨', '📢'];

// THIS WILL BE CONFIGURABLE SOON IN THE NEW SETTINGS
// Soon was generous... remains sortable if beta is enabled currently.
const emotes = default_emotes
Object.entries(emotes).forEach((emote) => {
    $('#emote_buttons').append(`<button data-id="emote_d_${emote[1]}" type="button" class="btn btn-circle-emote" onclick="navigator.clipboard.writeText(this.innerHTML);">${emote[1]}</button>`)
})

if (beta) {
    var sortable_emotes = Sortable.create(emote_buttons, {
        // handle: '.btn-circle-emote',
        animation: 150,

        // onEnd: function () {
        //     updateCallboxOutput()
        // }
    })
}

function showRegionSelector(state) {
    if (valid_regions.length == 1) { return; }
    switch (state) {
        case true:
            $('#region_btn').show()
            break;
        case false:
            $('#region_btn').hide()
    }
}

function regionSelectorState(state) {
    if (valid_regions.length == 1) { return; }
    switch (state) {
        case true:
            $('#region-selector').show()
            break;
        case false:
            $('#region-selector').hide()
    }
}

function regionOnClick(region) {
    if (Settings.region == region) {
        if (!ws_open) { syncConnect() }; 
        return;
    }; 
    if (ws_open) {
        syncConnect();        
    };
    updateSettingString('region', region); 
    setTimeout(() => {
        syncConnect();
    }, 100);
}

valid_regions.forEach((region) => {
    $('#region_table').append(`
        <tr>
            <td style="text-align: center;">
                <button class="btn" onclick="regionOnClick('${region}')">${regions_named[region] ? regions_named[region] : region}</button>
            </td>
        </tr>
    `)
})

function updateResize() {
    let height = document.getElementById("sticky-div").offsetHeight
    document.getElementById("sticky-spacer").style = `height: ${height + 4}px`
}

window.addEventListener("resize", (event) => {
    updateResize();
});
window.addEventListener("DOMContentLoaded", (event) => {
    updateResize();
});

function hoverDivToggle(state, div) {
    if (state == false) {
        document.getElementById('floating-page').hidden = true;
        document.getElementById('changelog_div').hidden = true;
        document.getElementById('announcement_div').hidden = true;
        document.getElementById('settings_div').hidden = true;
        // document.getElementById('vehicles_div').hidden = true;
        document.getElementById('timeclock_div').hidden = true;
        document.getElementById('heist_div').hidden = true;
        document.getElementById('reports_div').hidden = true;
        // document.getElementById('notepad_div').hidden = true;
        document.getElementById('calls_div').hidden = true;
        document.getElementById('about_div').hidden = true;
        document.getElementById('admin_div').hidden = true;
    } else {
        document.getElementById('floating-page').hidden = false;
        switch (div) {
            case 'changelog':
                refreshHoverDiv('changelog')
                document.getElementById('changelog_div').hidden = false;
                break;
            case 'announcements':
            case 'news':
                refreshHoverDiv('news')
                document.getElementById('announcement_div').hidden = false;
                break;
            case 'settings':
                document.getElementById('settings_div').hidden = false;
                break;
            // case 'vehicles':
            //     document.getElementById('vehicles_div').hidden = false;
            //     break;
            case 'timeclock':
                document.getElementById('timeclock_div').hidden = false;
                break;
            case 'heist':
                document.getElementById('heist_div').hidden = false;
                break;
            case 'reports':
                document.getElementById('reports_div').hidden = false;
                updateReportOutput()
                break;
            // case 'notepad':
            //     document.getElementById('notepad_div').hidden = false;
            //     break;
            case 'calls':
                document.getElementById('calls_div').hidden = false;
                break;
            case 'about':
                document.getElementById('about_div').hidden = false;
                break;
            case 'admin':
                document.getElementById('admin_div').hidden = false;
                break;
        }

    }
}

function refreshHoverDiv(div) {
    if (div == 'changelog') {
        $.get('/changelog.html', function (responseText) {
            $('#changelog_div').empty()
            $('#changelog_div').append(responseText)
        });
    } else if (div == 'news') {
        $.get('/news.html', function (responseText) {
            $('#announcement_div').empty()
            $('#announcement_div').append(responseText)
        });
    }
}

const channels = ["/311 ", "Current Radio channels:"];

for (let i = 0; i < channel_count; i++) {
    const chan_num = i + 1 // I could change the loop starting val but I just wrote all the code around this so I'll do it later
    let placeholder = ''
    switch (chan_num) {
        case 1:
            placeholder = 'Main Frequency'
            break;
        case 10:
            placeholder = 'Doctors (Reserved)'
            break;
        // case 15:  // DoC disbanded
        //     placeholder = 'DoC (Reserved)'
        //     break;
    }

    channels.push('') // if the default value is not set, it resorts to undefined

    let default_value = ''
    if (chan_num == 1) {
        default_value = 'Normal Patrol 🎧'
        channels[chan_num + 1] = `📢 Ch 1: ${default_value}` // set val in array
    }

    $('#input_fields').append(`
        <div class="row py-1 background-blobs">
        <label for="channel${chan_num}" class="col-md-1 col-form-label chan-label">Channel ${chan_num}:
            <input tabindex="-1" type="checkbox" class="form-check-input" id="check_ch${chan_num}" checked onclick="updateCheckedCh(${chan_num});" title="This checkbox toggles whether or not this field is included in the 311 status output">
        </label>
        <button tabindex="-1" class="btn btn-condensed-px" type="button" onclick="addInfoBox(${chan_num})"><img src="https://iconmonstr.com/wp-content/g/gd/makefg.php?i=../releases/preview/7.0.0/png/iconmonstr-plus-circle-lined.png" width="24" height="24" style="filter: invert(1)"></img></button>
        <div class="col-5 d-grid px-1">
            <input autocomplete="off" id="channel${chan_num}" class="form-control" type="text" name="channel_text" placeholder="${placeholder}" value="${default_value}" >
        </div>
        <div class="col-1 d-grid px-1">
            <button data-btn-type='blue' tabindex="-1" type="button" class="btn"
            onclick="navigator.clipboard.writeText('/311 🛎️ 77s Channel ${chan_num} 🛎️');">🛎️ 77s 🛎️</button>
        </div>
        <div class="col d-grid px-1">
            <button data-btn-type='danger' tabindex="-1" type="button" class="btn"
            onclick="navigator.clipboard.writeText('/311 🚨 13A Channel ${chan_num} 🚨');">🚨 13a 🚨</button>
        </div>
        <div class="col d-grid px-1">
            <button data-btn-type='danger' tabindex="-1" type="button" class="btn"
            onclick="navigator.clipboard.writeText('/311 📢 78s Channel ${chan_num} 📢');">📢 78s 📢</button>
        </div>
        <div class="animated" id="infoBoxesCh${chan_num}"></div>
        </div>`
    )

    var infoboxCh_el = document.getElementById(`infoBoxesCh${chan_num}`)
    var sortable_infobox = Sortable.create(infoboxCh_el, {
        handle: '.info_handle',
        animation: 150,

        group: {
            name: 'infobox_shared'
        },

        onEnd: function (evt) {
            updateTextArea()
            try {
                sendInfoboxManifest(evt.item.id, $(`#info_${evt.item.id}`).val(), parseInt(evt.to.id.split('infoBoxesCh')[1]))
                // sendInfoboxOrderManifest(prepareInfoboxOrder())
                // prepareInfoboxOrder()
                // sendChannelManifest(channel, null)
            } catch (error) {}
        }
    })

    infobox_sortables.push(sortable_infobox)

    const chan = document.getElementById(`channel${chan_num}`);
    chan.addEventListener('input', updateValue); // swap to jquery!!
    chan.identifier = chan_num

    updateTextArea() // force update to text area
}

window.scrollTo(0, 0);

// function attemptSync() {
//   // console.log('attemptSync called')
//   try { twiliBuildWSDataObject() } catch (error) { }
// }
const subchannel_regex = /^(\.[1-9]) \| (.+)/gm;

function fetchInfoboxData(channel) {}

function updateTextArea() {
    // console.log(infobox_sortables)
    // if (blockSync != true) { attemptSync() }
    let text = ""
        // if (Settings.replymsg) {
    for (let i = 0; i < channels.length; i++) {
        if (i > 1) {
            let is_ch_checked = $(`#check_ch${i - 1}`).is(":checked")
            if (!is_ch_checked) {
                continue;
            }
        }
        if (channels[i] === "") {
            continue;
        }
        // console.log(channels[i][0])
        // console.log(i)
        // console.log(Settings.replymsg)

        text += channels[i];
        if (Settings.replymsg || i != 0) {
            text += '\n'
        }

        // text += channels[i][0] + '\n';

        // $(`#infoBoxesCh${i}`).find("div[id=").each((k, v) => {
        //   // let is_checked =
        //   console.log(`${k}: ${v}`)
        //   console.log(v)
        // })

        $(`#infoBoxesCh${i - 1}`).children().each((k, v) => {
            // let is_checked =
            // console.log(`${k}: ${v}`)
            // console.log(v)
            // console.log(v.id)

            let is_checked = $(`#check_${v.id}`).is(":checked")
            if (!is_checked) {
                return;
            }
            let field_value = $(`#info_${v.id}`).val()
            if (field_value == '' || field_value == undefined) {
                return;
            }

            let subchannel = {}
            for (const match of field_value.matchAll(subchannel_regex)) {
                subchannel = match
            }
            if (Object.keys(subchannel).length === 0) {
                text += '➥ ' + field_value + '\n';
            } else {
                text += `📢 Ch ${i - 1}${subchannel[1]}: ` + subchannel[2] + '\n';
            }

            // if (Object.keys(subchannel).length === 0) {
            //   text += '➥ ' + field_value + '\n';

            // text += '➥ ' + field_value + '\n';
            // $(`#check_${channels[i][1][j]}`).is(":checked")
        })

    }

    let bolo_msg_added = false
    $('#bolo_active_div').children().each((k, v) => {
        let bolo_val = $(`#bolo_i_${$(v).data("id")}`).val()
        if (bolo_val == '') {
            return;
        }

        if (bolo_msg_added == false) {
            text += '\nActive BOLOs:\n'
            bolo_msg_added = true
        }

        // console.log($(v).data("id") )

        if (bolo_val == '' || bolo_val == undefined) {
            console.log('?')
            return;
        }
        
        text += '➥ 🕵️ ' + bolo_val + '\n'

    })

    // if (bolo_msg_added == true) {
    //     text += boloVal + '\n'
    // }

    // // bolo code here
    // let boloVal = $('#bolo_area').val()
    // // console.log(boloVal)
    // // console.log(consistsOnlyOfSubstring(boloVal, '\n'))
    // if (boloVal != '' && !consistsOnlyOfSubstring(boloVal, '\n')) {
    //     text += '\nActive BOLOs:\n'
    //     boloVal.split('\n').forEach((bolo_entry) => {
    //         if (bolo_entry == '') {
    //             return;
    //         }
    //         text += '➥ 🕵️ ' + bolo_entry + '\n'
    //         // console.log(bolo_entry)
    //     })
    //     // text += boloVal + '\n'
    // }

    if (Settings.replymsg) {
        text += '\n' + $('#footer_msg_area').val()
        // text += ' Radio may be compromised. Refrain from relaying any sensitive information.';
    }

    $('#radioChannels').text(text)
    // log.textContent = text
    // attemptSync(null, null, null, true)
}

// from Phind
function consistsOnlyOfSubstring(mainString, substring) {
    const regex = new RegExp(`^${substring}+$`);
    return regex.test(mainString);
}

$('#footer_msg_area').on('input', (e) => {
    updateTextArea()
    if (ws_open == false) { return; }
    ws.send(encoder.encode({
        ...default_data,
        'footerMsg': e.target.value
    }));
})

$('#bolo_area').on('input', (e) => {
    updateTextArea()
    if (ws_open == false) { return; }
    ws.send(encoder.encode({
        ...default_data,
        'boloField': e.target.value
    }));
    // console.log(ve.target.value)
})

function sendChannelManifest(channel, value) {
    if (ws_open == false) { return; }
    ws.send(encoder.encode({
        ...default_data,
        'channels': {
            [channel]: {
                'checked': $(`#check_ch${channel}`).is(":checked"),
                'value': value ? value : $(`#channel${channel}`).val()
            }
        }
    }));
}

function updateCheckedCh(channel) {
    sendChannelManifest(channel, null)
    updateTextArea()
}

function updateValueNamed(channel, value, remote) {
    if (remote != true) {
        sendChannelManifest(channel, value)
    }
    if (value !== "") {
        channels[channel + 1] = `📢 Ch ${channel}: ` + value;
    } else {
        channels[channel + 1] = "";
    }
    updateTextArea()
}

function updateValue(e) {
    updateValueNamed(e.target.identifier, e.target.value)
}

// anime({
//   targets: '#bank-svg',
//   keyframes: [
//     {rotate: '0deg'},
//     {rotate: '15deg'},
//     {rotate: '-15deg'},
//     {rotate: '0deg'}
//   ],
//   duration: 2000,
//   easing: 'easeOutElastic',
//   // direction: 'alternate',
//   loop: true
// });

// postAlert('Powered by headpats and hugs', 'warning')
function postAlert(message, type) {
    $('#alertTests').append(`
  <div class="alert alert-${type} alert-dismissible" role="alert">
      <span>${message}</span>
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  </div>
  `)
}

// postNewsAlert('Powered by headpats and hugs')
// postNewsAlert('Hi! Welcome to the dispatch tool! Take a look around!')
// postNewsAlert('A new style has appeared! Check it out in the settings menu!')
// postNewsAlert('A new widget?! Keep track of outstanding 911s!')
// postNewsAlert('Post the status frequently!')
// postNewsAlert('Check out the latest announcement!', 'News')
// postNewsAlert('Include the 🎧 emote at the end of any given channel field if a dispatcher is on that frequency! Post the status frequently!', 'Guide')
// postNewsAlert("I'm currently moving. This tool may have downtimes outside of my control.", 'OOC Alert')
function postNewsAlert(message, type = 'News') {
    uuid = crypto.randomUUID()

    $(`
        <div class="animated-right">
        <span class="text-muted container-fluid" id="text-news-top-${uuid}">
        <button tabindex="-1" class="btn btn-circle-news" type="button" onclick="$('#text-news-top-${uuid}').remove()" style="transform: translate(0, -5%);">
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/bc/Icon-Megaphone.svg" width="18" height="18" style="filter: invert(1); margin-left: 4px; transform: translate(0, -10%);"></img>
            <span style="margin-right: 4px;">Hide ${type}<span>
        </button>
        ${message}
        </span></div>`
    ).insertAfter('#alertTests')
}

$('#shared_notes_textarea').on('input', (e) => {
    if (ws_open == false) { return; }
    ws.send(encoder.encode({
        ...default_data,
        'sharedNotes': e.target.value
    }));
})

$('#notes').text(window.localStorage.getItem('local_notes'))
$('#notes').on('input', (e) => {
    window.localStorage.setItem('local_notes', e.target.value)
})

// this is temporary
// lol i like this tho

function generateNewsHash() {
    refreshHoverDiv('news')
    // $('#changelog_div').text()
    const text = $('#announcement_div').text()

    // $.get('/np/dispatch/news.html', function(responseText) {
    //   $('#announcement_div').empty()
    //   $('#announcement_div').append(responseText)
    // });
    // console.log(text)
    const hash = String(text).hashCode()
    // console.log(hash)
    return hash;
}

refreshHoverDiv('news')
const last_checked_news = window.localStorage.getItem('news_last_checked')
setTimeout(() => {
    if (last_checked_news == null || last_checked_news != generateNewsHash()) {
        anime({
            targets: '#news-svg',
            keyframes: [{
                    rotate: '0deg'
                }, {
                    rotate: '15deg'
                }, {
                    rotate: '0deg'
                },
            ],
            duration: 2000,
            easing: 'easeOutElastic',
            // direction: 'alternate',
            loop: true
        });
    }
}, 1000);

function storeLastNewsChecked() {
    setTimeout(() => {
        window.localStorage.setItem('news_last_checked', generateNewsHash())
    }, 500);
}

// this shit is so bad lol
const last_checked_changelog = window.localStorage.getItem('changelog_last_checked')
if (last_checked_changelog == null || last_checked_changelog != JSON.stringify(version)) {
    anime({
        targets: '#changelog-svg',
        keyframes: [{
                rotate: '0deg'
            }, {
                rotate: '360deg'
            },
        ],
        duration: 4000,
        easing: 'easeOutElastic',
        loop: true
    });
}

function storeLastVersionChecked() {
    window.localStorage.setItem('changelog_last_checked', JSON.stringify(version))
}

// window.localStorage.setItem(`setting_${setting}`, state)
