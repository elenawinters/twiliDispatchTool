// This is a server file.

// import { app } from "../../../express";

// const shared = require('html/shared.json');
const shared = require('./html/shared.json');
const channel_count = shared.channel_count
const valid_regions = shared.valid_regions
const version = shared.version

const path = require('node:path');
const express = require('express');
const app = express();
const port = 8005;
var expressWs = require('express-ws')(app);

import { Encoder, Decoder } from "@msgpack/msgpack";

import expressWsTypes from 'express-ws';
import expressTypes = require('express');

app.ws('/echo', function(ws: any, req: expressTypes.Request) {
	ws.on('message', function(msg: string) {
		ws.send(`I am echoing whatever you sent to me back to you:\n➥ ${msg}`);
		// ws.send(msg);
	});
});

app.listen(port, () => {
	console.log(`Server is running on port ${port}!`);
})

app.use('/', express.static(path.join(__dirname, 'html')));
export const np_dispatch_router = express.Router();
app.use('/api', np_dispatch_router);

app.use('/assets', express.static(path.join(__dirname, 'assets')));

interface RegionSync {
    'channels': {
        [key: string]: {
            checked: boolean,
            value: string
        }
    },
    'infoboxes': {
        'order': Array<string>,
        'data': { [key: string]: object },
    },
    'heistTracker': object,
    'callTracker': {
        'order': Array<string>,
        'data': { [key: string]: object },
    },
    'sharedNotes': string,
    'boloSystem': {
        'order': Array<string>,
        'data': { [key: string]: object },
    },
    // 'boloField': string,
    'footerMsg': string,
}

interface Regional {
    'sync': RegionSync,
    'chat': Array<Array<string>>,
    'connected_history': { [key: string]: string },
    'connections': { [key: string]: expressWsTypes.RouterLike }
}

const encoder = new Encoder()
const decoder = new Decoder()

// console.log(`> Loading Dispatch API (Beta: ${is_beta})`)

// This is scuffed but I like the cleaner code.
// console.log(`> MODULE: Dispatch API (Beta: ${is_beta}) is now running`)

const default_regional: Regional = {
    'sync': {
        'channels': {
            '1': {
                checked: true,
                value: 'Normal Patrol 🎧'
            }
        },
        'infoboxes': {
            'order': [],
            'data': {}
        },
        'heistTracker': {},
        'callTracker': {
            'order': ['1', '2', '3', '4', '5'],
            'data': { '1': { 'value': ''}, '2': { 'value': ''}, '3': { 'value': ''}, '4': { 'value': ''}, '5': { 'value': ''} }
        },
        'sharedNotes': 'Dispatch Unit Card:\n🎧 Dispatch / Reception 🖥️\n\n',
        'boloSystem': {
            'order': ['00', '01', '02', '03', '10', '11', '12', '13'],
            'data': {
                '00': { 'bucket': '0', 'value': '' }, '01': { 'bucket': '0', 'value': '' }, '02': { 'bucket': '0', 'value': '' }, '03': { 'bucket': '0', 'value': '' },
                '10': { 'bucket': '1', 'value': '' }, '11': { 'bucket': '1', 'value': '' }, '12': { 'bucket': '1', 'value': '' }, '13': { 'bucket': '1', 'value': '' }}
        },
        // 'boloField': '',
        'footerMsg': 'Please let dispatch know of opened or collapsed channels.',
    },

    'chat': [['Server', 'Start of chat log.'], ['Administrator', 'Please, keep an eye out for any bugs or issues.']],
    'connected_history': {},
    'connections': {},
}

let regional: {[k: string]: Regional}  = {}
valid_regions.forEach((region: string) => {
    regional[region] = structuredClone(default_regional)
})

// 'chat': [['Server', 'Start of chat log.'], ['Server', 'Due to a bunch of backend changes, stuff may be broken. Please, keep an eye out for any bugs or issues.']],
// let chat = [['Server', 'Start of chat log.'], ['227161120069124096', 'This is a new feature.'], ['227161120069124096', 'Primarily used when looking at dashcams.']],
// let chat = [['Server', 'Start of chat log.'], ['Server', 'Due to a bunch of backend changes, stuff may be broken. Please, keep an eye out for any bugs or issues.']],

// let file_sync = {...sync}

// let connections = {}
// let connected_history = {}

// code so that it doesn't show the snowflake id :zaqDerp
async function preliminaryConnectionHistory() {
    valid_regions.forEach(async (region: string) => {
        for (const entry of regional[region].chat) {
            if (!/^\d+$/.test(entry[0])) { continue; }  // is this a text user, such as the Server?
            regional[region].connected_history[entry[0]] = 'User'
        }
    })
}

preliminaryConnectionHistory().then()

function broadcastConnections(region: string) {
    let names: string[] = []
    for (const [sender, _] of Object.entries(regional[region].connections)) {
        names.push(sender)
    }
    broadcast(region, null, {'type': 'updateConnected', 'connections': names, 'connected_history': regional[region].connected_history})
}

function broadcast(region: string, ignoreThisSender: string | null, customSync: object | null) {
    let new_sync = customSync
    if (customSync == null) {
        new_sync = structuredClone(regional[region].sync)
    }
    for (const [sender, _] of Object.entries(regional[region].connections)) { 
        if (sender == ignoreThisSender || sender == 'nickname') { continue; }
        regional[region].connections[sender].send(encoder.encode(new_sync))
    }
    // for (const [snowflake, senders] of Object.entries(regional[region].connections)) {
    //     for (const [sender, _] of Object.entries(Object(senders))) { 
    //         if (sender == ignoreThisSender || sender == 'nickname') { continue; }
    //         regional[region].connections[snowflake][sender].send(encoder.encode(new_sync))
    //     }
    // }
}

function decodeMessage(msg: any) {
    try { return decoder.decode(msg) } catch (e) { }
    try { return JSON.parse(msg) } catch (e) { }
    return 'FormatError'
}

setInterval(() => {
    valid_regions.forEach((region: string) => {
        broadcast(region, null, {'type': 'sync', ...regional[region].sync})
    })
}, 1000 * 60 * 5)  // Do a full sync every 5 minutes. Also saves the shared notes

setInterval(() => {
    valid_regions.forEach((region: string) => {
        for (const [sender, _] of Object.entries(regional[region].connections)) {
            regional[region].connections[sender].ping();
        }
        // broadcast(region, null, {})
    })
}, 1000 * 5)  // Sync connections every few seconds. this is an effort to keep the connection alive

np_dispatch_router.ws('/ws', async function(ws: any, req: expressTypes.Request) {
    const region = String(req.query.region)
    if (!valid_regions.includes(region)) {
        ws.send(encoder.encode({'type': 'auth', 'status': 'reject-region'}))
        setTimeout(() => {
            ws.close();
        }, 250);
        return;
    }

    let has_region_access: any = []
	// console.log(dt_shared_config.valid_regions)
	for (let i = 0; i < valid_regions.length; i++) {
		let is_whitelisted = true
		// console.log(is_whitelisted)
		has_region_access.push(is_whitelisted)
	}

	// let is_whitelisted = await ifHasGateAccess(req.session.snowflake, region)
	// // let is_whitelisted = await isWhitelisted(req.session.snowflake)
    // if (!has_region_access.some((x: any) => x === true)) {
	// 	// res.sendFile(path.join(__dirname, 'src', 'misc', 'R2V0VGhlRnVja09mZk15VG9vbA.html'))
    //     return;
    // }

    // If user has not logged in, do not even attempt to continue the authentication.
    let is_whitelisted = true

    if (!is_whitelisted && has_region_access.some((x: any) => x === true)) {
        ws.send(encoder.encode({'type': 'auth', 'status': 'reject-region-no-perms'}))
        setTimeout(() => {
            ws.close();
        }, 250);
        return;
    }

    // console.log(`is_whitelisted? ${is_whitelisted}`)
    if (!is_whitelisted && !has_region_access.some((x: any) => x === true)) {
        // console.log('A session was closed because they did not meet the requirements to use this tool.')
        ws.send(encoder.encode({'type': 'auth', 'status': 'reject'}))
        setTimeout(() => {
            ws.close();
        }, 250);
        return;
    }

    const is_admin = true

    let sender = crypto.randomUUID()
    // console.log(sender)
    let nickname = sender
    // if (!regional[region].connections.hasOwnProperty(sender)) { // @ts-ignore
    //     regional[region].connections[sender] = ws
    //     // regional[region].connected_history[sender] = nickname
    // }
    regional[region].connections[sender] = ws
    regional[region].connected_history[sender] = nickname

    console.log(`Connection fully established (${nickname} | ${region})`)
    ws.send(encoder.encode({'type': 'auth', 'status': 'success', 'sender': sender, 'version': version}))
    broadcastConnections(region)
    ws.send(encoder.encode({'type': 'sync', ...createFullSyncManifest(region), 'chat_history': regional[region].chat}))
    if (is_admin) { ws.send(encoder.encode({ 'type': 'enableAdmin' })) }

    ws.on('message', function(msg: any) {
        const data = decodeMessage(msg)
        if (data == 'FormatError') {
            ws.send("This websocket only accepts valid MsgPack or JSON, and outputs MsgPack. No format could be deduced.");
            return;
        }

        if (typeof data !== 'object' || data === null || data['type'] != 'sync') { return; }
        Object.keys(data).forEach(async (dataKey) => {
            switch (dataKey) {
                case 'channels':
                    for (const [channel, information] of Object.entries(data[dataKey])) {
                        if (Object(information)['value'] == '' && Object(information)['checked'] == true) {
                            delete regional[region].sync['channels'][channel]
                        } else {
                            regional[region].sync['channels'][channel] = Object(information)
                        }
                    }
                    break;
                case 'infobox':
                case 'infoboxes':
                    if (data[dataKey].hasOwnProperty('data')) {
                        for (const [infobox, information] of Object.entries(data[dataKey]['data'])) {
                            regional[region].sync['infoboxes']['data'][infobox] = Object(information)
                        }
                    }

                    if (data[dataKey].hasOwnProperty('order')) {
                        regional[region].sync['infoboxes']['order'] = data[dataKey]['order']
                    }
                    break;
                case 'infobox_created':
                    regional[region].sync['infoboxes']['data'][data[dataKey]['id']] = {channel: data[dataKey]['channel'], checked: true, value: ''}
                    break;
                case 'infobox_deleted':
                    delete regional[region].sync['infoboxes']['data'][data[dataKey]['id']]

                    regional[region].sync['infoboxes']['order'].splice(regional[region].sync['infoboxes']['order'].indexOf(data[dataKey]['id']), 1)
                    break;
                case 'heistTracker':
                    regional[region].sync['heistTracker'] = data[dataKey]
                    break;
                case 'sharedNotes':
                    regional[region].sync['sharedNotes'] = data[dataKey]
                    break;
                case 'callTracker_order':
                    let difference = regional[region].sync['callTracker']['order'].filter(x => !data[dataKey].includes(x));
                    for (let i = 0; i < difference.length; i++) {
                        delete regional[region].sync['callTracker']['data'][difference[i]]
                    }
                    regional[region].sync['callTracker']['order'] = data[dataKey]
                    break;
                case 'callTracker_data':
                    for (const [callbox, information] of Object.entries(data[dataKey])) {
                        regional[region].sync['callTracker']['data'][callbox] = Object(information)
                    }
                    break;
                case 'boloSystem': // basically copy the infobox system for this
                    if (data[dataKey].hasOwnProperty('data')) {
                        for (const [bolo, information] of Object.entries(data[dataKey]['data'])) {
                            regional[region].sync['boloSystem']['data'][bolo] = Object(information)
                        }
                    }

                    if (data[dataKey].hasOwnProperty('order')) {
                        regional[region].sync['boloSystem']['order'] = data[dataKey]['order']
                    }
                    // console.log(data[dataKey])
                    break;
                case 'boloSystem_created':
                    regional[region].sync['boloSystem']['data'][data[dataKey]['id']] = {bucket: data[dataKey]['bucket'], value: ''}
                    // console.log(data[dataKey])
                    break;
                case 'boloSystem_deleted':
                    delete regional[region].sync['boloSystem']['data'][data[dataKey]['id']]

                    regional[region].sync['boloSystem']['order'].splice(regional[region].sync['boloSystem']['order'].indexOf(data[dataKey]['id']), 1)
                    // console.log(data[dataKey])
                    break;
                // case 'boloField':
                //     regional[region].sync['boloField'] = data[dataKey]
                //     break;
                case 'footerMsg':
                    regional[region].sync['footerMsg'] = data[dataKey]
                    break;
                case 'chat_new':
                    regional[region].chat.push(data[dataKey])
                    if (regional[region].chat.length > 50) {
                        regional[region].chat.shift()
                    }
                    break;

            }
        })

        broadcast(region, data['sender'], data)
        console.dir(data, { depth: null })
        // console.dir(regional[region].sync, { depth: null })
        // console.dir(regional[region].sync['boloSystem'])
        // console.dir( { ...regional[req.query.region].sync, 'region': req.query.region }, { depth: null })
        // console.log(`There are ${regional[region].chat.length} chat messages saved for ${req.query.region}`)

    });

    ws.on('close', function() {
        delete regional[region].connections[sender]
        broadcastConnections(region)
        console.log(`Connection closed (${nickname} | ${region})`)
    });

});


function createFullSyncManifest(region: string) {
    let c_sync = structuredClone(regional[region].sync)
    for(let i = 0; i < channel_count; i++) {
        if (c_sync['channels'].hasOwnProperty(i + 1)) { continue; }
        c_sync['channels'][i + 1] = { checked: true, value: '' }
    }
    return c_sync
}
