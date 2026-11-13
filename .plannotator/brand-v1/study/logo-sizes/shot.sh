#!/bin/sh
# sh shot.sh <query> <out.png> [w h dpr]
set -e
export AGENT_BROWSER_SESSION=fork-b
agent-browser set viewport ${3:-1920} ${4:-1080} ${5:-2} >/dev/null
agent-browser open "https://brand.blank-agency.localhost:1355/study/logo-sizes/?$1" >/dev/null
i=0; until [ "$(agent-browser get title 2>/dev/null)" = "ready" ] || [ $i -gt 60 ]; do sleep 0.5; i=$((i+1)); done
agent-browser screenshot "$2" >/dev/null; echo "$2"
