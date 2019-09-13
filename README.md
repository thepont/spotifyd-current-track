# spotifyd-current-track

Simple node js application that reads the current track running on spotifyd using the system log then outputs it on the console.

## Install

Clone the repository then run the standard

`yarn` or `npm install`

run `node index` to have a console updated with the current running track on spotifyd.

## Setup

Also you need to make a client and client secret for the spotify api and export them to your environment.

```
export SPOTIFY_CLIENT_ID="the_id_spotify_gives_you"
export SPOTIFY_CLIENT_SECRET="the_secret_spotify_gives_you"
```

