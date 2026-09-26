#!/bin/bash
S=/mnt/skills/plugins/code-motion-design/scripts
cd /home/claude/m1
jobs_list=()
for v in "B_navy_proud|#0F1A33|Proudly serving South Benfleet|128" "D_indigo_proud|#161A5C|Proudly serving South Benfleet|128" "A_navy_more|#0F1A33|A little more local.|150" "C_indigo_more|#161A5C|A little more local.|150"; do
 IFS='|' read name navy tag ts <<< "$v"
 for theme in dark light; do
  if [ $theme = dark ]; then fin=$navy; ink="#FFFFFF"; pe="#FEC091"; else fin="#ECEAE7"; ink=$navy; pe="#E89A5C"; fi
  f=full/${name}-${theme}.html
  sed -e "s/__BG__/#ECEAE7/; s/__NAVY__/$navy/; s/__FINAL__/$fin/; s/__INK__/$ink/; s/__PEACH__/$pe/; s/__TAGLINE__/$tag/; s/__TAGSIZE__/$ts/; s/__GCY__/560/; s/__RULEW__/470/g" piece.html > $f
  python3 $S/build.py --template $f --out ${f%.html}.built.html --font "Poppins=fonts/poppins-latin-600-normal.woff2:600" >/dev/null
  for wh in 1080x1350 1080x1920 1080x1080; do jobs_list+=("${f%.html}.built.html|$wh|full/coco-signature-${name}-${theme}-${wh}"); done
 done
done
run(){ IFS='|' read html wh out <<< "$1"; w=${wh%x*}; h=${wh#*x}
  python3 $S/render.py video --html $html --w $w --h $h --dur 5 --out $out.raw.mp4 > $out.log 2>&1
  ffmpeg -v error -y -i $out.raw.mp4 -i m1-5s.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart $out.mp4
  ffmpeg -v error -y -i $out.raw.mp4 -c:v copy -an -movflags +faststart $out-silent.mp4 && rm $out.raw.mp4
  echo "done $out" >> full/progress.txt; }
export -f run; export S
printf '%s\n' "${jobs_list[@]}" | xargs -P 4 -I{} bash -c 'run "{}"'
echo ALLDONE >> full/progress.txt
