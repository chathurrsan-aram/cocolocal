#!/bin/bash
export CHROMIUM_PATH=/opt/pw-browsers/chromium
cd /root/hotfood/02-full-range
D=55; E=3300
for k in 0 1 2 3; do a=$((E*k/4)); b=$((E*(k+1)/4))
  python3 /root/coco-motion-kit/tools/render.py video --html full-range.html --w 1080 --h 1920 --dur $D --start $a --end $b --out part-$k.mp4 > part-$k.log 2>&1 &
done; wait; echo ALL DONE
