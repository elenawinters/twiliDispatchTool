
function showAdminMenu(state) {
    if (is_admin == false) { return; }
    switch (state) {
        case true:
            $('#admin_btn').show()
            break;
        case false:
            $('#admin_btn').hide()
    }
}

