// #reports-appendable-col

// format for the arrays is INPUT TYPE, LABEL, PLACEHOLDER, VALUE, (optional: ROWS, only if input type = 1)
// input type is as follows: 0 = input type text, 1 = textarea
version.revision.toString().padStart(2, '0')

function getUTCDatetime(date) {
    return `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCDate().toString().padStart(2, '0')} ${date.getUTCHours().toString().padStart(2, '0')}:${date.getUTCMinutes().toString().padStart(2, '0')}:${date.getUTCSeconds().toString().padStart(2, '0')} UTC`
}


let date = new Date();
const report_fields = {
    'reportTitle': [0, 'Report title', 'Ro Block Kidnapped & Robbed Mackenzie Hayes the Cop For Her PD Assault Rifle + PD Glock', ''],
    'dispatcherName': [0, 'Dispatcher Name', 'D-70 Jaedlyn Sawyer', ''],
    'date': [0, 'Report Date/Time', '', getUTCDatetime(date)],
    // 'time': [0, 'Report Time', '', ''],
    'Incidentdate': [0, 'Incident Date/Time', '', getUTCDatetime(date)],
    // 'Incidenttime': [0, 'Incident Time', '', `${date.getUTCHours()}:${date.getUTCMinutes()}:`],
    'reporterName': [0, 'Reporter Name', 'Firstus Lastius', ''],
    'reporterSID': [0, 'Reporter SID', '12345', ''],
    'reporterPhNo': [0, 'Reporter PH#', '420-555-555', ''],
    'Witness': [0, 'People Involved/Witnesses', 'People Involved/Witnessess Description', ''],
    'Suspect': [1, 'Suspect Description(s)', 'Suspect Description(s)', '', 3],
    'Vehicles': [1, 'Vehicles', 'Vehicles', 'Vehicles', 5],
    'location': [0, 'Incident Location', 'Alta St Apartments', ''],
    'Statement': [1, 'Statement', 'Statement', '', 5],
    'StolenItems': [1, 'Stolen Items', 'Stolen Items', '', 5]
}

function resetReports() {
    date = new Date();
    Object.keys(report_fields).forEach((report_field) => {
        if (report_field == 'date' || report_field == 'Incidentdate') {
            $(`#${report_field}`).val(getUTCDatetime(date))
        } else {
            $(`#${report_field}`).val('')
        }
    });
    updateReportOutput()
}

function updateReportOutput() {
    // report title date is a split by space at 0 index of the report date field (#date)
    // it's not smart to do it this way, but it's lazy, and if i know myself, it's that im really lazy
    let text = `Title: ${$('#reporterName').val()} | ${$('#reportTitle').val()} | ${$('#date').val().split(' ')[0]}\n`
    text += `----\n\nDispatch Report:\nReport taken by: ${$('#dispatcherName').val()}\n`
    text += `Date of Report: ${$('#date').val()}\n\n`
    text += `Date of Incident: ${$('#Incidentdate').val()}\n\n`
    text += `Reporting Person:\nName: ${$('#reporterName').val()}\nSID: ${$('#reporterSID').val()}\nPh#: ${$('#reporterPhNo').val()}\n`
    let witness_val = $('#Witness').val()
    if (witness_val != '') {
        text += `Person(s) Involved:\n${witness_val}\n\n`
    }
    let suspect_val = $('#Suspect').val()
    if (suspect_val != '') {
        text += `Suspect Description(s):\n${suspect_val}\n\n`
    }
    let vehicles_val = $('#Vehicles').val()
    if (vehicles_val != '') {
        text += `Vehicle Description(s):\n${vehicles_val}\n\n`
    }
    let location_val = $('#location').val()
    if (location_val != '') {
        text += `Locations(s) of Incident:\n${location_val}\n\n`
    }
    text += `Statement:\n${$('#Statement').val()}\n\n`
    let stolen_items_val = $('#StolenItems').val()
    if (stolen_items_val != '') {
        text += `Stolen Items:\n${stolen_items_val}\n`
    }

    $('#report').val(text)
}


Object.keys(report_fields).forEach((report_field) => {
    const field_data = report_fields[report_field]
    switch (field_data[0]) {
        case 0:
            $('#reports-appendable-col').append(`
                <div class="row">
                    <label for="${report_field}" class="form-label">${field_data[1]}</label>
                    <input autocomplete="off" type="text" class="form-control text-fx" id="${report_field}" name="${report_field}" placeholder="${field_data[2]}" value="${field_data[3]}">
                </div>
            `)
            break;
        case 1:
            $('#reports-appendable-col').append(`
                <div class="row">
                    <label for="${report_field}" class="form-label">${field_data[1]}</label>
                    <textarea autocomplete="off" id="${report_field}" name="${report_field}" class="form-control text-fx" rows="${field_data[4]}" placeholder="${field_data[2]}"></textarea>
                </div>
            `)
            break;
    }
    $(`#${report_field}`).on('input', () => {
        updateReportOutput()
    })
})

