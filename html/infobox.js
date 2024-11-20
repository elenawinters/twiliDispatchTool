
var infobox_sortables = []

function prepareInfoboxOrder() {
	let order_manifest_buffer = []
	for (let i = 2; i < channels.length; i++) {
		$(`#infoBoxesCh${i - 1}`).children().each((k ,v) => {
			order_manifest_buffer.push(v.id)
		})
	}

	return order_manifest_buffer

}

function infoButton(instance, chan, div) {
	let field_value = $(div).val()

	switch (instance) {
		case 'interference':
			navigator.clipboard.writeText(`/311 🛑 Interference Channel ${chan} 🛑 ${field_value}`)
			break;
		case 'bolo':
			navigator.clipboard.writeText(`/311 🕵️ BOLO Channel ${chan} 🕵️ ${field_value}`)
			break;
		case 'pbs':
			navigator.clipboard.writeText(`/311 📦 PBS Cleared Channel ${chan} 📦 ${field_value}`)
			break;
		case 'shoot':
			navigator.clipboard.writeText(`/311 🔥 Open Fire Channel ${chan} 🔥 ${field_value}`)
			break;
	}
}

function addInfoBox(chan_num, commanded_id) {
	let commanded = null;
	if (commanded_id) { commanded = true; }
	console.log(`Ch${chan_num} wants to add an info box! (remote: ${commanded})`)
	let uuid;
	if (commanded_id == null) { 
		uuid = crypto.randomUUID()
	} else {
		uuid = commanded_id;
	}

	$(`#infoBoxesCh${chan_num}`).append(`
		<div class="row py-1 background-blobs blobs-even-false infoBoxes anim-quick-slide-in" id="${uuid}" data-id="ibdid_${uuid}">
			<label class="col-1 col-form-label chan-label" style="display: flex; flex-direction: row;">Information:
				<input tabindex="-1" type="checkbox" class="form-check-input" id="check_${uuid}" checked onclick="updateCheckedInfo('${uuid}', parseInt(this.parentNode.parentNode.parentNode.id.split('infoBoxesCh')[1]));" title="This checkbox toggles whether or not this field is included in the 311 status output">
				<img class="btn info_handle" src="/assets/sort.svg" height="32" style="filter: invert(1); width: fit-content; margin: 0px; passing: 0px"></img>
			</label>
			<div class="col-6 d-grid px-1">
				<input autocomplete="off" id="info_${uuid}" class="form-control" type="text">
			</div>
			<button tabindex="-1" class="btn btn-condensed-px" type="button" onclick="deleteInfoBox(this, parseInt(this.parentNode.parentNode.id.split('infoBoxesCh')[1]))"><img src="/assets/circle_minus.svg" width="25" height="25" style="filter: invert(1)"></img></button>
			<div class="col d-grid px-1">
				<button data-btn-type='secondary' tabindex="-1" type="button" class="btn"
					onclick="infoButton('interference', parseInt(this.parentNode.parentNode.parentNode.id.split('infoBoxesCh')[1]), '#info_${uuid}');">🛑 Interference 🛑</button>
			</div>
			<div class="col d-grid px-1">
				<button data-btn-type='secondary' tabindex="-1" type="button" class="btn"
					onclick="infoButton('bolo', parseInt(this.parentNode.parentNode.parentNode.id.split('infoBoxesCh')[1]), '#info_${uuid}');">🕵️ BOLO 🕵️</button>
			</div>
			<div class="col d-grid px-1">
				<button data-btn-type='secondary' tabindex="-1" type="button" class="btn"
					onclick="infoButton('pbs', parseInt(this.parentNode.parentNode.parentNode.id.split('infoBoxesCh')[1]), '#info_${uuid}');">📦 PBS Cleared 📦</button>
			</div>
			<div class="col d-grid px-1">
				<button data-btn-type='secondary' tabindex="-1" type="button" class="btn"
					onclick="infoButton('shoot', parseInt(this.parentNode.parentNode.parentNode.id.split('infoBoxesCh')[1]), '#info_${uuid}');">🔥 Open Fire 🔥</button>
			</div>
		</div>`)

	const infoID = document.getElementById(`${uuid}`);

	infoID.addEventListener('animationend', () => {
		$(`#${uuid}`).removeClass('anim-quick-slide-in')
	});

	const infoChan = document.getElementById(`info_${uuid}`);
	infoChan.addEventListener('input', updateValueInfobox);  // swap to jquery!!
	infoChan.identifier = uuid
	// $(`#infoCh${chan_num}_${uuid}`).addEventListener('input', updateTextArea)
	console.log(`Ch${chan_num} created #${uuid}! (remote: ${commanded})`)

	updateBtnTypes()

	if (commanded_id == null) {
		sendInfoboxExistanceRequest(uuid, chan_num, 'created')
	}
}

function deleteInfoBox(div, chan_num, commanded) {
	let id;
	if (commanded) { id = div } else {
		id = $(div).parent().attr('id')
	}
	console.log(`#${id} wishes to be deleted (remote: ${commanded})`)
	$(`#${id}`).remove()
	console.log(`#${id} was yeeted into the void (remote: ${commanded})`)
	if (commanded == null) {
		sendInfoboxExistanceRequest(id, chan_num, 'deleted')
		updateTextArea()

	}
}

function sendInfoboxManifest(infobox, value, channel) {
	if (ws_open == false) { return; }
	ws.send(encoder.encode({
		...default_data,
		'infoboxes': { 
			'data': {
				[infobox]: {
					'channel': channel,
					'checked': $(`#check_${infobox}`).is(":checked"),
					'value': value ? value : $(`#info_${infobox}`).val()
				}
			},
			'order': prepareInfoboxOrder()
		}
	}));
}

function sendInfoboxExistanceRequest(infobox, channel, type) {
	if (ws_open == false) { return; }
	ws.send(encoder.encode({
		...default_data,
		[`infobox_${type}`]: { 
			'channel': channel,
			'id': infobox
		},
		'infoboxes': { 
			'order': prepareInfoboxOrder()
		}
	}));
}

function updateValueInfobox(e) {
	sendInfoboxManifest(e.target.identifier, e.target.value, parseInt(this.parentNode.parentNode.parentNode.id.split('infoBoxesCh')[1]))
	updateTextArea()

}

function updateCheckedInfo(infobox, channel) {
	sendInfoboxManifest(infobox, null, channel)
	console.log(infobox)
	console.log(channel)
	updateTextArea()
}
