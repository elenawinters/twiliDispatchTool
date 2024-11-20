// Blah blah this isn't used blah blah
const heists = ['Maze Bank', 'Art Asylum', 'Ammunation Container', 'Laundromat', 'Innocence Cash Exchange', 'Jamestown Cash Exchange'];
$('#trackerMessage').attr('rows', heists.length + 2);
let heist_status = {}  // this object doesn't need to be in order
Object.entries(heists).reverse().forEach((heist) => {
    let heist_id = `heist_status_${heist[1].replaceAll(' ', '_')}`
    heist_status[heist_id] = '❌'
    $(`<tr>
    <th scope="row">${heist[1]}</th>
    <fieldset id="${heist_id}">
        <td>
        <input type="radio" value="❌" name="${heist_id}" style="width: 100%" onclick="updateHeistStatus(this.name, this.value);" checked></imput> 
        </td>
        <td>
        <input type="radio" value="⚠️" name="${heist_id}" style="width: 100%" onclick="updateHeistStatus(this.name, this.value);"></imput> 
        </td>
        <td>
        <input type="radio" value="🚓" name="${heist_id}" style="width: 100%" onclick="updateHeistStatus(this.name, this.value);"></imput> 
        </td>
        <td>
        <input type="radio" value="✔️" name="${heist_id}" style="width: 100%" onclick="updateHeistStatus(this.name, this.value);"></imput> 
        </td>
    </fieldset>
    </tr>`).insertAfter('#heist_column_headers')
})

function resetHeists() {
  heists.forEach((heist) => {
    let heist_id = `heist_status_${heist.replaceAll(' ', '_')}`
    heist_status[heist_id] = '❌'
    $(`input[name="${heist_id}"][value="❌"]`).prop('checked', true);
  })
  generate1090Message()
}

function updateHeistStatus(field, value) {
  heist_status[field] = value
  generate1090Message()
}

generate1090Message(true)
function generate1090Message(remote) {
  if (remote != true && ws_open != false) {
    ws.send(encoder.encode({
        ...default_data,
        'heistTracker': heist_status
    }));
  }

  let heist_buffer = ['/311 ', "⏰ 10-90 o'Clock Tracker ⏰"]
  heists.forEach((heist) => {
    let heist_id = `heist_status_${heist.replaceAll(' ', '_')}`
    heist_buffer.push(`${heist_status[heist_id]}: ${heist}`)
  })

  let text = ""
  for (let i = 0; i < heist_buffer.length; i++) {
    if (i == heist_buffer.length - 1) {
      text += heist_buffer[i];
    } else {
      text += heist_buffer[i] + '\n';
    }
  }

  $('#trackerMessage').val(text)
}
