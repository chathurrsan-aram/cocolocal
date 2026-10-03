#!/bin/sh
# master.sh in.wav out.m4a  — two-pass loudness normalisation to -14 LUFS, -1 dBTP (social platforms), AAC 256k
set -e
J=$(ffmpeg -hide_banner -i "$1" -af loudnorm=I=-14:TP=-1.0:LRA=9:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g(){ echo "$J" | python3 -c "import json,sys;print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i "$1" -af "loudnorm=I=-14:TP=-1.0:LRA=9:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,aresample=48000" -c:a aac -b:a 256k "$2"
