
function resetChatbox() {
    $('#chat_table').empty()
}

$("#chat_typing").on('keyup', function (e) {
    if (e.key === 'Enter' || e.keyCode === 13) {
        let val = $('#chat_typing').val()
        if (val == '') return;
        addChatMessage(default_data['identifier'], val)
        $('#chat_typing').val('')

        ws.send(encoder.encode({
            ...default_data,
            'chat_new': [default_data['identifier'], val]
        }));
    }
});

$("#chat_scroll").on('mousewheel', function(e) {
    var delta = e.originalEvent.wheelDelta || e.originalEvent.deltaY || e.originalEvent.detail;
    e.preventDefault();
    var newScrollPosition = $(this).scrollTop() + delta * 0.5;

    $(this).animate({ scrollTop: newScrollPosition }, 1);
});

function addChatMessage(user, msg) {
    if (user.includes('{{REGION}}')) {
        u_region = regions_named[Settings.region]
        if (u_region == undefined) {
            u_region = Settings.region
        }
        user = user.replaceAll('{{REGION}}', u_region)
    }
    cname = connected_history[user]
    if (cname == undefined) cname = user
    $('#chat_table').append(`
        <tr>
            <td><sup>${cname}</sup><br>${msg}</td>
        </tr>
    `)
    var a = new Audio('/assets/item-equip.mp3');
    a.volume = 0.05;
    a.play();
}