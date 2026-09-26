#!/bin/bash
# Build every variant HTML for M1–M3 into build/. Usage: tools/variants.sh
set -e; K=$(cd "$(dirname "$0")/.." && pwd); cd "$K"; mkdir -p build
FONT="Poppins=$K/brand/fonts/poppins-latin-600-normal.woff2:600"
# theme: name|navy|final|ink|peach
THEMES=("navy-dark|#0F1A33|#0F1A33|#FFFFFF|#FEC091" "indigo-dark|#161A5C|#161A5C|#FFFFFF|#FEC091" "light|#0F1A33|#ECEAE7|#0F1A33|#E89A5C")
mk(){ # src out tag tagsize tail
  IFS='|' read tn navy fin ink pe <<< "$TH"
  sed -e "s/__BG__/#ECEAE7/; s/__NAVY__/$navy/; s/__FINAL__/$fin/; s/__INK__/$ink/; s/__PEACH__/$pe/; s|__TAGLINE__|$3|; s/__TAGSIZE__/$4/; s/__GCY__/560/; s/__RULEW__/470/g; s/__TAIL__/$5/" "$1" > build/$2.html
  python3 tools/build.py --template build/$2.html --out build/$2.built.html --font "$FONT" >/dev/null; rm build/$2.html; }
for TH in "${THEMES[@]}"; do tn=${TH%%|*}
  # M1 signature (light theme only in navy ink)
  mk m1-signature/piece.html "signature-proud-$tn" "Proudly serving South Benfleet" 128 0
  mk m1-signature/piece.html "signature-more-$tn" "A little more local." 150 0
  # M2 outros + 1.5 s tails
  for v in "address|210 High Road, South Benfleet · Parking on site|112" "website|cocolocal.co.uk|150" "wheel|Spin the Coco Wheel · cocolocal.co.uk/wheel|118" "follow|Follow us · cocolocal.co.uk/follow|126"; do
    IFS='|' read vn tag ts <<< "$v"
    mk m2-outros/piece.html "outro-$vn-$tn" "$tag" $ts 0
    mk m2-outros/piece.html "outro-$vn-tail-$tn" "$tag" $ts 1
  done
  # M3 sting (no tagline by design)
  mk m3-sting/piece.html "sting-$tn" "" 128 0
done
ls build | wc -l
