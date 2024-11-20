function updateBOLOSystem(evt) {
    updateTextArea()

    const id = $(`#${evt.item.id}`).data("id")
    sendBOLOManifest(id, $('#bolo_i_' + id).val(), bolo_bucket_named.invert()[evt.to.id])
}

var bolo_actives = Sortable.create(bolo_active_div, {
    handle: '.bolo_handle',
    animation: 150,

    group: {
        name: 'bolo_shared'
    },

    onAdd: function (evt) {
        updateBOLOSystem(evt)
    }
})

var bolo_reserves = Sortable.create(bolo_inactive_div, {
    handle: '.bolo_handle',
    animation: 150,

    group: {
        name: 'bolo_shared'
    },

    onAdd: function (evt) {
        updateBOLOSystem(evt)
    }
})

var bolo_delete = Sortable.create(bolo_delete_sortable, {
    handle: '.bolo_handle',
    animation: 150,

    group: {
        name: 'bolo_shared'
    },

    onAdd: function (evt) {
        $('#bolo_delete_sortable').children().each((k, v) => {
            deleteBOLO($(`#${v.id}`).data('id'), null, null)
        })
    }
})

const bolo_sortables = [bolo_actives, bolo_reserves]

function prepareOrderBOLO() {
	let order_manifest_buffer = []
	for (let i = 0; i < bolo_sortables.length; i++) {
		$('#' + bolo_bucket_named[i]).children().each((k ,v) => {
			order_manifest_buffer.push($(`#${v.id}`).data('id'))
		})
	}

	return order_manifest_buffer

}

// $(`#${id}`).remove()

const bolo_bucket_named = {
    0: 'bolo_active_div',
    1: 'bolo_inactive_div',
    invert() { 
        var retobj = {}; 
        for(var key in this){ 
            retobj[this[key]] = key; 
        } 
        return retobj;
    } // https://www.geeksforgeeks.org/how-to-invert-key-value-in-javascript-object/
}


for (let x = 0; x < 4; x++) {
    createBOLO(0, '0' + x)
    createBOLO(1, '1' + x)
}

function createBOLO(bucket, commanded_id) {
    if (commanded_id == null) { 
        uuid = crypto.randomUUID()
    } else {
        uuid = commanded_id;
    }

    $('#' + bolo_bucket_named[bucket]).append(`
    <div data-id="${uuid}" class="row py-1 bolo-item" id="bolo_${uuid}">
        <img class="btn bolo_handle" src="https://iconmonstr.com/wp-content/g/gd/makefg.php?i=../releases/preview/2014/png/iconmonstr-sort-27.png" height="38" style="filter: invert(1); width: fit-content;"></img>
        <div class="d-grid px-1 bolo-item bolo_item_div">
            <input autocomplete="off" id="bolo_i_${uuid}" class="form-control bolo-item" type="text"> 
        </div>
        
    </div>`)

    if (commanded_id == null) {
        sendBOLOExistanceRequest(uuid, bucket, 'created')
    }

    $(`#bolo_i_${uuid}`).on('input', (e) => {
        const origin = e.target.id.replace('bolo_i_', '')
        const bucket_named = $('#bolo_' + origin).parent().attr('id')
        sendBOLOManifest(origin, e.target.value, bolo_bucket_named.invert()[bucket_named])
        updateTextArea();

    });
}


function deleteBOLO(id, bucket, commanded) {
	console.log(`BOLO #${id} wishes to be deleted (remote: ${commanded})`)
	$(`#bolo_${id}`).remove()
	console.log(`BOLO #${id} was yeeted into the void (remote: ${commanded})`)
	if (commanded == null) {
		sendBOLOExistanceRequest(id, bucket, 'deleted')
	}
    updateTextArea()
}

function sendBOLOManifest(bolo, value, bucket) {
	if (ws_open == false) { return; }
	ws.send(encoder.encode({
		...default_data,
		'boloSystem': { 
			'data': {
				[bolo]: {
					'bucket': bucket,
					'value': value ? value : $(`#bolo_${bolo}`).val()
				}
			},
			'order': prepareOrderBOLO()
		}
	}));
}

function sendBOLOExistanceRequest(bolo, bucket, type) {
	if (ws_open == false) { return; }
	ws.send(encoder.encode({
		...default_data,
		[`boloSystem_${type}`]: { 
			'bucket': bucket,
			'id': bolo
		},
		'boloSystem': { 
			'order': prepareOrderBOLO()
		}
	}));
}