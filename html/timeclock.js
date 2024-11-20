// https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_client_applications
// https://stackoverflow.com/questions/13364243/websocketserver-node-js-how-to-differentiate-clients
// https://developer.mozilla.org/en-US/docs/Web/Events/Creating_and_triggering_events

const encoder = new MessagePack.Encoder()
const decoder = new MessagePack.Decoder()

let ws_version = 'ws'
if (window.location.protocol.includes('https')) {
    ws_version = 'wss'
}

let ws = null
// let ws_open = false; // located in settings.js now
let do_login = false;  // redirects to login if connection failed when set to true
let conn_rejected = false;
let last_connection_rejected = false
let default_data = {'type': 'sync', 'sender': '', 'version': version }
let connected_history = {}
let is_admin = false;

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

// console.log(Settings.auto_ws_connect)
if (Settings.auto_ws_connect) {
    runWSClient()
}

async function decodeFromBlob(blob) {
    if (blob.stream) {
      return await decoder.decodeAsync(blob.stream());
    } else {
      return decoder.decode(await blob.arrayBuffer());
    }
}

function syncConnect() {
    if (!ws_open) {
        do_login = true
        runWSClient()
    } else {
        conn_rejected = true
        ws.close()
    }
}

function runWSClient() {
    console.log('Starting WebSocket')
    if (ws_open == true) {
        postAlert("You bozo! You can't connect while you're already connected. That would cause issues!", 'warning')
        console.log("The WebSocket client is already running. You shouldn't be calling this function again until the client has been shut down.")
        return;
    }
    $("#timeclock_btn_text").text('Connecting...')
    ws = new WebSocket(`${ws_version}://${window.location.hostname}:${window.location.port}${window.location.pathname}api/ws?region=${Settings.region}`);
    // ws = new WebSocket(`${ws_version}://${window.location.hostname}:${window.location.port}${window.location.pathname}api/radiows`);
    conn_rejected = false;

    ws.onclose = (e) => {
        // console.log(e)
        ws_open = false

        console.log(`Client has been disconnected from server. Was this intended?: ${conn_rejected}`)
        if (conn_rejected == false) {
            postAlert("Something happened, and your connection was lost! Please check your internet connection or the status of the server.", 'warning')
        }
        $("#timeclock-btn-units").text('')
        $("#timeclock_btn_text").text('Connect')
        anime({
            targets: '#timeclock-btn-units',
            backgroundColor: '#e53f59',
            duration: 2000,
            easing: 'easeOutElastic',
        });
        $('#notes_div').attr('style', '')
        $('#chat_div').hide()

        $('#name_columns').html('<tr><th scope="row" style="padding-left: 8px; padding-right: 16px;">No current users</th></tr>');
        
        delete ws
    }

    // ws.onerror = (event) => {
    //     console.log(event)
    // }

    ws.onopen = () => {
        ws_open = true
        $("#timeclock_btn_text").text('Disconnect')
        // perform cleanup of any previous connection so that, for example, switching of regions in relation to infoboxes, is clean
        infobox_sortables.forEach((e) => { Object.values(e.el.children).forEach((f) => { deleteInfoBox(f.id, null, true) }) })

        setTimeout(() => {
            const on_join_msgs = [['Server - {{REGION}}', 'Connection established.']]
            Object.values(on_join_msgs).forEach(async (c) => { addChatMessage(c[0], c[1]) })
        }, 250)
    }

    ws.onmessage = async (event) => {
        const data = await decodeFromBlob(event.data)
        // the keepAlive signal is sent every 5 seconds by the server to all clients.
        // 2024-07-23: This now just prevents useless processing. The keepAlive is now a silent websocket ping.
        if ($.isEmptyObject(data)) { return; }
        console.log(data)

        if (data['type'] == 'auth') {
            Object.keys(data).forEach(async (dataKey) => {
                switch (dataKey) {
                    case 'status':
                        switch (data[dataKey]) {
                            case 'reject':
                                conn_rejected = true;
                                console.log('The WS Server rejected our connection')
                                if (do_login) {
                                    console.log('Detected that this failed connection attempt was from the connect button, redirecting to login')
                                    window.location.href = '/login'
                                }
                                break;
                            case 'reject-region':
                                conn_rejected = true;
                                updateSettingString('region', DefaultSettings.region)
                                console.log('The WS Server rejected us from the specified region. Perhaps the client is out of date?')
                                postAlert(`The requested region is invalid, and the server rejected it. Region set to fallback: ${regions_named[Settings.region]}. Please reconnect.`, 'warning')
                                break;
                            case 'reject-region-no-perms':
                                conn_rejected = true;
                                console.log('The WS Server rejected us from the specified region. We don\'t have permission!')
                                postAlert(`You lack permission to connect to ${regions_named[Settings.region]}, and the server rejected it. Region set to fallback: ${regions_named[DefaultSettings.region]}. Please reconnect.`, 'warning')
                                updateSettingString('region', DefaultSettings.region)
                                break;
                        }
                        break;
                    case 'sender':
                        if (data['version']['protocol'] != version.protocol) {
                            ws.close()
                            const mismatch = window.localStorage.getItem('protocolMismatchReload')
                            if (mismatch == null) {
                                window.localStorage.setItem('protocolMismatchReload', true)
                                window.location.reload()
                            } else {
                                window.localStorage.removeItem('protocolMismatchReload')
                                postAlert("There is a protocol mismatch, and you were unable to connect. Please talk to the developer if the issue persists.", 'warning')
                                conn_rejected = true
                                return;
                            }
                            // window.location.reload()
                        } else {
                            window.localStorage.removeItem('protocolMismatchReload')
                        }
                        // identifier = data['identifier']
                        // console.log('set this thing to smth')
                        // default_data = {'type': 'sync', 'sender': data['sender'], 'identifier': data['identifier']}
                        default_data = {'type': 'sync', 'sender': data['sender']}
                        anime({
                            targets: '#timeclock-btn-units',
                            backgroundColor: '#a9ff82',
                            duration: 2000,
                            easing: 'easeOutElastic',
                        });
                        resetChatbox()
                        $('#notes_div').attr('style', 'width: 54%;')
                        $('#chat_div').show()
                        break;
                }
            })
            do_login = false
        } else if (data['type'] == 'updateConnected') {
            connected_history = data['connected_history']
            $("#timeclock-btn-units").text(data['connections'].length)
            $('#name_columns').html('');
            console.log(data['connections'])
            data['connections'].forEach((name) => {
                $('#name_columns').append(`<tr><th scope="row" style="padding-left: 8px; padding-right: 16px;">${name}</th></tr>`)
            })
        } else if (data['type'] == 'enableAdmin') {
            // This feature is not yet implemented. This will give those permitted the ability to add users to the Dispatch Tool.
            console.log('Server says we are an admin!')
            is_admin = true
            // $('#region-selector').show()
        } else if (data['type'] == 'sync') {
            Object.keys(data).forEach(async (dataKey) => {
                switch (dataKey) {
                    case 'channels':
                        for (const [channel, information] of Object.entries(data[dataKey])) {
                            $(`#check_ch${channel}`).prop('checked', information['checked'])
                            $(`#channel${channel}`).val(information['value'])
                            updateValueNamed(parseInt(channel), information['value'], true);
                        }
                        break;
                    case 'infobox':
                    case 'infoboxes':
                        if (data[dataKey].hasOwnProperty('data')) {
                            for (const [infobox, information] of Object.entries(data[dataKey]['data'])) {
                                if ($(`#${infobox}`).length == 0) { 
                                    addInfoBox(information['channel'], infobox)
                                } else {
                                    var old_chan = $(`#${infobox}`).parent().attr('id').split('infoBoxesCh')[1]
        
                                    if (information['channel'] != old_chan) {
                                        console.warn('Fun stuff is about to happen! The boundaries between channel fields is being CROSSED!!!!')
                                        deleteInfoBox(infobox, old_chan, true)
                                        addInfoBox(information['channel'], infobox)
                                    }
                                }

                                $(`#check_${infobox}`).prop('checked', information['checked'])
                                $(`#info_${infobox}`).val(information['value'])
                                updateTextArea();
                            }
                        }
        
                        if (data[dataKey].hasOwnProperty('order')) {
                            new_sort = []
                            data[dataKey]['order'].forEach(uuid => {
                                new_sort.push(`ibdid_${uuid}`)
                            })
        
                            bolo_sortables.forEach((e) => {
                                e.sort(new_sort, true)
                                updateTextArea()
                            })
                        }
                        break;
                    case 'infobox_created':
                        addInfoBox(data[dataKey]['channel'], data[dataKey]['id'])
                        updateTextArea();
                        break;
                    case 'infobox_deleted':
                        deleteInfoBox(data[dataKey]['id'], data[dataKey]['channel'], true)
                        updateTextArea();
                        break;
                    case 'heistTracker':
                        for (const [heist, status] of Object.entries(data[dataKey])) {
                            $(`input[name="${heist}"][value="${status}"]`).prop('checked', true);
                            heist_status[heist] = status
                        }   
                        generate1090Message(true)
                        break;
                    case 'sharedNotes':
                        $('#shared_notes_textarea').val(data[dataKey])
                        break;
                    case 'callTracker':
                        onMessageUpdateCallboxOrder(data[dataKey]['order'], false)
                        onMessageUpdateCallboxData(data[dataKey]['data'], false)
                        updateCallboxOutput(true);
                        break;
                    case 'callTracker_order':
                        onMessageUpdateCallboxOrder(data[dataKey])
                        break;
                    case 'callTracker_data':
                        onMessageUpdateCallboxData(data[dataKey])
                        break;
                    case 'boloSystem':
                        if (data[dataKey].hasOwnProperty('data')) {
                            for (const [bolo, information] of Object.entries(data[dataKey]['data'])) {
                                if ($(`#bolo_${bolo}`).length == 0) {
                                    createBOLO(information['bucket'], bolo)
                                } else {
                                    var old_bucket = bolo_bucket_named.invert()[$(`#bolo_${bolo}`).parent().attr('id')]

                                    if (information['bucket'] != old_bucket) {
                                        console.warn('Transfering a BOLO from one bucket to another.')
                                        deleteBOLO(bolo, old_bucket, true)
                                        createBOLO(information['bucket'], bolo)
                                    }
                                }

                                $(`#bolo_i_${bolo}`).val(information['value'])
                                updateTextArea();
                            }
                        }
        
                        if (data[dataKey].hasOwnProperty('order')) {
                            new_sort = []
                            data[dataKey]['order'].forEach(uuid => {
                                new_sort.push(String(uuid))
                            })
        
                            bolo_sortables.forEach((e) => {
                                e.sort(new_sort, true)
                                
                                // cleanup old bolo boxes
                                $(e.el).children().each((k ,v) => {
                                    const id = String($(v).data('id'))
                                    if (!new_sort.includes(id)) {
                                        console.log(id)
                                        console.log("There are elements present on the client that aren't on the server! Cleaning up.")
                                        deleteBOLO(id, null, true)
                                    }
                                })
                                updateTextArea()
                            })
                        }
                        break;
                    case 'boloSystem_created':
                        createBOLO(data[dataKey]['bucket'], data[dataKey]['id'])
                        updateTextArea();
                        break;
                    case 'boloSystem_deleted':
                        deleteBOLO(data[dataKey]['id'], data[dataKey]['bucket'], true)
                        updateTextArea();
                        break;
                    // case 'boloField':
                    //     $('#bolo_area').val(data[dataKey])
                    //     updateTextArea();
                    //     break;
                    case 'footerMsg':
                        $('#footer_msg_area').val(data[dataKey])
                        updateTextArea();
                        break;
                    case 'chat_history':
                        data[dataKey].forEach((entry) => {
                            addChatMessage(entry[0], entry[1])
                        })
                        break;
                    case 'chat_new':
                        addChatMessage(data[dataKey][0], data[dataKey][1])
                        break;
                }
            })
        }
    }
}

function onMessageUpdateCallboxData(manifest, do_update) {
    for (const [callbox, information] of Object.entries(manifest)) {
        // $(`#check_${infobox}`).prop('checked', information['checked'])
        $(`#call_i_${callbox}`).val(information['value'])
    }

    if (do_update != false) {
        updateCallboxOutput(true);
    }
}

function onMessageUpdateCallboxOrder(manifest, do_update) {
    const order_manifest = prepareOrderManifest()
    let del_diff = order_manifest.diff(manifest)
    del_diff.forEach((uuid) => {
        $(`#call_${uuid}`).remove();
    })

    let add_diff = manifest.diff(order_manifest)
    add_diff.forEach((uuid) => {
        createNewCallBox(uuid)
    })

    new_sort = []
    manifest.forEach(uuid => {
        new_sort.push(`call_d_${uuid}`)
    })
    sortable_calls.sort(new_sort, true)

    if (do_update != false) {
        updateCallboxOutput(true);
    }
}

