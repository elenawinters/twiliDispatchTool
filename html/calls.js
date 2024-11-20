// 911 calls tracker

var sortable_calls = Sortable.create(calls_sortable, {
    handle: '.calls_handle',
    animation: 150,

    onEnd: function () {
        updateCallboxOutput()
    }
})

updateCallboxOutput()
// https://stackoverflow.com/questions/12596231/can-jquery-selectors-be-used-with-dom-mutation-observers

function sendCallboxOrderManifest(order) {
    if (ws_open == false) { return; }
    ws.send(encoder.encode({
        ...default_data,
        'callTracker_order': order
    }));
}

function updateCallboxOutput(remote) {
    let call_buffer = ['/311 ', '🚑 Outstanding 911 calls:']
    $('#calls_sortable').children('.calls-item').each(function () {
        call_buffer.push($(this).find('input').val())
    });

    let text = ""
    for (let i = 0; i < call_buffer.length; i++) {
        if (call_buffer[i] == '') { continue; }
        if (i >= 2) {
            text += '➥ '
        }
        text += call_buffer[i] + '\n';
    }

    $('#calls_tracker').val(text)

    if (ws_open == false || remote == true) { return; }

    const order_manifest = prepareOrderManifest()
    sendCallboxOrderManifest(order_manifest)

}

let last_order_manifest = []
let last_data_manifest = {}

// https://stackoverflow.com/questions/1187518/how-to-get-the-difference-between-two-arrays-in-javascript
function prepareOrderManifest() {
    let order_manifest_buffer = []
    $('#calls_sortable').children('.calls-item').each(function () {
        order_manifest_buffer.push($(this).attr('id').replace('call_', ''))
    });
    return order_manifest_buffer
}


function createNewCallBox(commanded_id) {
    if (commanded_id == null) { 
        uuid = crypto.randomUUID()
    } else {
        uuid = commanded_id;
    }
    $(`#calls_sortable`).append(`
    <div data-id="call_d_${uuid}" class="row py-1 calls-item" id="call_${uuid}">
        <img class="btn calls_handle" src="https://iconmonstr.com/wp-content/g/gd/makefg.php?i=../releases/preview/2014/png/iconmonstr-sort-27.png" height="38" style="filter: invert(1); width: fit-content;"></img>
        <div class="col-10 d-grid px-1 calls-item">
            <input autocomplete="off" id="call_i_${uuid}" class="form-control calls-item" type="text"> 
        </div>
        <button tabindex="-1" class="btn btn-condensed" type="button" onclick="$('#call_${uuid}').remove(); updateCallboxOutput();"><img src="https://iconmonstr.com/wp-content/g/gd/makefg.php?i=../releases/preview/7.2.0/png/iconmonstr-minus-circle-lined.png" width="25" height="25" style="filter: invert(1)"></img></button>
    </div>`)

    $(`#call_i_${uuid}`).on('input', (e) => {
        updateCallboxOutput();

        if (ws_open == false) { return; }
        ws.send(encoder.encode({
            ...default_data,
            'callTracker_data': {
                [e.target.id.replace('call_i_', '')]: {
                    'value': e.target.value
                }
            }
        }));
    });

    if (ws_open == false || commanded_id != null) { return; }
    
    const order_manifest = prepareOrderManifest()
    sendCallboxOrderManifest(order_manifest)
}


for (let x = 0; x < 5; x++) {
    createNewCallBox(x)
}
