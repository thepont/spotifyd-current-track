
// #!/usr/bin/env node

const { spawn } = require('child_process'); 
const {Subject, timer} = require('rxjs');
const {map, filter, flatMap, debounceTime, tap, share, skipUntil, first} = require('rxjs/operators');
const Journalctl = require('journalctl');
const SpotifyWebApi = require('spotify-web-api-node');
const RENEW_TOKEN_MS = 3000000;

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
    ii => spawn('feh', ['--bg-center', ii])
)

tracks.subscribe(ii => {
    console.log(tracklog(ii));
});



// feh --bg-scale /path/to/image
// or feh --bg-center /path/to/image
