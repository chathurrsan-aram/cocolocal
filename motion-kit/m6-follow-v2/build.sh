#!/bin/bash
# Build Follow Us v2: m6-follow-v2/build.sh [theme] → build/follow-v2-<theme>.built.html
cd "$(dirname "$0")/.."; T=${1:-navy-dark}; A=m6-follow-v2/assets
python3 tools/build_piece.py --piece m6-follow-v2/piece.html --theme $T --out build/follow-v2-$T.built.html \
  --img IMG_FOLLOW=$A/follow.png --img IMG_IG_BEFORE=$A/ig-before.jpg --img IMG_IG_AFTER=$A/ig-after.jpg \
  --img IMG_FB_BEFORE=$A/fb-before.jpg --img IMG_FB_AFTER=$A/fb-after.jpg --img IMG_IG_GLYPH=$A/ig-glyph-white.png --img IMG_FB_LOGO=$A/fb-logo-primary.png
