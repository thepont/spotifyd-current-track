const {Subject} = require('rxjs');
const {map, tap, filter, flatMap} = require('rxjs/operators');
const Journalctl = require('journalctl');
const SpotifyWebApi = require('spotify-web-api-node');

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


const gotGrant = spotifyApi.clientCredentialsGrant().then((data) => spotifyApi.setAccessToken(data.body['access_token']));
messages.pipe(
    map(ii => ii.MESSAGE.match(/.*Loading track.*spotify:track:([A-z0-9]+)/)),
    filter(ii => ii && ii.length === 2),
    map(ii => ii[1]),
    flatMap(async ii => {
        await gotGrant;
        return await spotifyApi.getTracks([ii]);
    }),
    filter(ii => ii.body && ii.body.tracks),
    flatMap(ii => ii.body.tracks),
    map(track => tracklog(track))
    // tap(ii => console.log(ii))
).subscribe(ii => {
    process.stdout.clearLine();
    process.stdout.cursorTo(0);
    process.stdout.write(ii)
});