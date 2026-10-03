#!/bin/bash
# render.sh page.html W H seconds out.mp4 [audio.m4a]  — 4 parallel workers at 60 fps, then joined; muxes audio if given
set -e
export CHROMIUM_PATH=/opt/pw-browsers/chromium
HTML=$1; RW=$2; RH=$3; D=$4; OUT=$5; AUD=$6
E=$(python3 -c "print(round($D*60))"); TMP=$(mktemp -d -p /root/hotfood .r-XXXX)
for k in 0 1 2 3; do a=$((E*k/4)); b=$((E*(k+1)/4))
  python3 /root/coco-motion-kit/tools/render.py video --html "$HTML" --w $RW --h $RH --dur $D --start $a --end $b --out $TMP/p$k.mp4 > $TMP/p$k.log 2>&1 &
done; wait
printf "file '%s/p%d.mp4'\n" $TMP 0 $TMP 1 $TMP 2 $TMP 3 > $TMP/list.txt
ffmpeg -v error -y -f concat -safe 0 -i $TMP/list.txt -c copy $TMP/v.mp4
if [ -n "$AUD" ]; then ffmpeg -v error -y -i $TMP/v.mp4 -i "$AUD" -map 0:v -map 1:a -c copy -shortest "$OUT"; else cp $TMP/v.mp4 "$OUT"; fi
rm -rf $TMP; echo "rendered $OUT"
