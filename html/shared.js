// This converts the shared JSON to something the client can use. This is purely a client file despite the name.

// The shared stuff used to be here, and the server sided file would load it. Due to my updates, this approach no longer works
// The server now loads the JSON as a config file, so the client now has to do the same.

let shared = {}
$.ajaxSetup({ async: false });  // make this synchronous so that everything loads correctly.
$.getJSON( "shared.json" , function ( result ) { shared = result });
$.ajaxSetup({ async: true });  // revert it back

const version = shared.version
const valid_regions = shared.valid_regions
const channel_count = shared.channel_count

// alert(JSON.stringify(shared));

$('#version').text(`v${version.year.toString().slice(-2)}.${version.month}.${version.day}_${version.revision.toString().padStart(2, '0')}`);
$('#version-date').text(`${version.month}/${version.day}/${version.year.toString().slice(-2)}`);
const beta = window.location.pathname.includes('beta') ? true : false;
