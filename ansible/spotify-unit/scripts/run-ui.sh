#!/usr/bin/env bash
pidof spotifyd >/dev/null && echo "Service is running" || spotifyd
xterm -e "cava" &
xterm -fa 'Monospace' -fs 10 -e "cd ~/git/spotifyd-current-track/ && ./spotifyd-current-track.sh" &
# Turn off power saving so the monitor doesn't always turn off
xset s off &
xset -dpms &
# Remove mouse cursor
unclutter -idle 10 &
# enable transparency
compton &
# Wait for our terminals
sleep 10
# Setup our layout.
i3-msg 'workspace 1; layout splitv'
i3-msg "workspace 1; [title=^cava$] resize set height 87ppt"
