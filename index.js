const blessed = require('neo-blessed');
const { spawn } = require('child_process'); 
const {Subject, timer} = require('rxjs');
const {map, filter, flatMap, debounceTime, share, skipUntil, first} = require('rxjs/operators');
const Journalctl = require('journalctl');
const SpotifyWebApi = require('spotify-web-api-node');
const moment = require('moment');
const RENEW_TOKEN_MS = 3000000;
//Loading track "Jigsaw Falling Into Place" with Spotify URI "spotify:track:15ea10YpJIl3mJq75yzqsD"

var screen = blessed.screen({
    smartCSR: true,
    dockBorders: true,
    title: "spotifyd-current-track",
});


let boxStyle = {
    tags: true,
    style: {
      fg: 'black',
      bg: "white",
    },
    border: {
        type: "line",
        ch: "▒"
        // ch: "▗"
    },
    align: 'center',
    valign: 'center',
    shadow: false
}


var top = blessed.box({
    top: 'left',
    width: '100%',
    height: '100%',
    parent: screen,
    tags: true,
    dockBorders: true,
});

var track = blessed.box({
    width: "30%",
    dockBorders: true,
    label: ' {bold}Track{/bold} ',
    parent: top,
    content: 'Track',
    ...boxStyle
});

var artist = blessed.box({
    left: '30%-1',
    width: '30%',
    label: ' {bold}Artist{/bold} ',
    parent: top,
    content: 'Artist',
    ...boxStyle
});

var album = blessed.box({
    left: '60%-3',
    width: '30%',
    dockBorders: true,
    label: ' {bold}Album{/bold} ',
    parent: top,
    content: 'Album',
    ...boxStyle
});

// var releaseDate = blessed.box({
//     left: '90%-4',
//     width: '13%',
//     label: ' {bold}Year{/bold} ',
//     parent: top,
//     content: 'Year',
//     ...boxStyle
// });


const journalctl = new Journalctl({
    identifier: "Spotifyd"
});

const tracklog = (track) => `${track.artists.reduce((rr, ii, ix) => `${rr}${ix ? ',' : ''}${ii.name}`, "")} - ${track.album.name} - ${track.name}`

var spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});
const messages = new Subject();
journalctl.on('event', (event) => {
    messages.next(event);
});
let auth = timer(0, RENEW_TOKEN_MS).pipe(
    flatMap(() => spotifyApi.clientCredentialsGrant()),
    share()
);

auth.subscribe((cred) => {
    screen.render();
    spotifyApi.setAccessToken(cred.body['access_token'])
});

let tracks = messages.pipe(
    skipUntil(auth.pipe(first())),
    map(ii => ii.MESSAGE.match(/.*Loading track.*spotify:track:([A-z0-9]+)/)),
    filter(ii => ii && ii.length === 2),
    debounceTime(10),
    map(ii => ii[1]),
    flatMap(async ii =>  spotifyApi.getTracks([ii])),
    filter(ii => ii.body && ii.body.tracks),
    flatMap(ii => ii.body.tracks),
    share()
)

let albumsArt = tracks.pipe(
    map(ii => ii.album.images),
    filter(ii => ii.length > 0),
    map(ii => ii[0].url)
).subscribe(
    ii => { 
        spawn('feh', ['--bg-center', ii])
    }
)

tracks.subscribe(currentTrack => {
    let songDuration = moment.duration(currentTrack.duration_ms);
    artist.setContent(currentTrack.artists.reduce((rr, jj, ix) => `${rr}${ix ? ',' : ''}${jj.name}`, ""))
    album.setContent(currentTrack.album.name)
    track.setContent(currentTrack.name);
    // releaseDate.setContent(moment(currentTrack.album.release_date).format('YYYY'));
    screen.render();
});
