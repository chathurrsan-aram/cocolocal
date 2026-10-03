#!/bin/bash
# Render every built variant (tools/variants.sh first) in 1:1, 4:5, 9:16 → exports/<piece>/, with sound + silent.
K=$(cd "$(dirname "$0")/.." && pwd); cd "$K"; export K
jobs=()
for f in build/*.built.html; do n=$(basename $f .built.html)
  case $n in signature-*) d=5; a=m1-signature/m1-5s.wav; p=m1-signature;;
    outro-*-tail-*) d=1.5; a=m2-outros/m2-tail-1.5s.wav; p=m2-outros;;
    outro-*) d=3; a=m2-outros/m2-3s.wav; p=m2-outros;;
    sting-*) d=2; a=m3-sting/m3-2s.wav; p=m3-sting;; esac
  for wh in 1080x1350 1080x1920 1080x1080; do jobs+=("$f|$wh|$d|$a|exports/$p/coco-$n-$wh"); done
done
run(){ IFS='|' read html wh d a out <<< "$1"; w=${wh%x*}; h=${wh#*x}; mkdir -p $(dirname $out)
  [ -f $out.mp4 ] && return
  python3 tools/render.py video --html $html --w $w --h $h --dur $d --out $out.raw.mp4 > $out.log 2>&1 || { echo "FAIL $out" >> exports/progress.txt; return; }
  ffmpeg -v error -y -i $out.raw.mp4 -i $a -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart $out.mp4
  ffmpeg -v error -y -i $out.raw.mp4 -c:v copy -an -movflags +faststart $out-silent.mp4 && rm $out.raw.mp4 $out.log
  echo "done $out" >> exports/progress.txt; }
export -f run
mkdir -p exports; printf '%s\n' "${jobs[@]}" | xargs -P 3 -I{} bash -c 'run "{}"'
echo ALLDONE >> exports/progress.txt
