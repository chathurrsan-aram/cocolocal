#!/bin/bash
# Build the "How to enter" wheel motion: m7-wheel/build-howto.sh [theme]
cd "$(dirname "$0")/.."; T=${1:-navy-dark}; F=m7-wheel/flow; L=m7-wheel/layers
python3 tools/build_piece.py --piece m7-wheel/howto.html --theme $T --out build/wheel-howto-$T.built.html \
  --img IMG_IG=m6-follow-v2/assets/ig-before.jpg --img IMG_FOLLOW=m6-follow-v2/assets/follow.png --img IMG_PAGE=$F/page-idle.png \
  --img IMG_SHEET0=$F/page-sheet-empty.png --img IMG_SHEET1=$F/page-sheet-name.png --img IMG_SHEET2=$F/page-sheet-filled.png --img IMG_WIN=$F/page-win.png \
  --img L_DISC=$L/disc.png --img L_RIMF=$L/rim-front.png --img L_PTR=$L/pointer.png --img L_HUB=$L/hub.png
