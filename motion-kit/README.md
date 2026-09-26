# Coco Local motion kit

Code-made brand motion (logo reveal, outros, sting, follow-us, offer template). Every frame is a pure function of time in one HTML file, rendered to 60 fps MP4 with Playwright + ffmpeg.

- Start with `CLAUDE-CODE-HANDOVER.md` (master brief and status table), then `KIT.md` and `ANALYSIS.md`.
- Renders are not kept in git. Finished videos go to Drive: `Coco Local / 05 — Marketing & Content / 05 — Brand Motion Kit`.
- `m4-follow/inputs/` is git-ignored (Meta logos, admin-view screenshots). Re-fetch it from Drive: `05 — Marketing & Content / 01 — Photos & Brand / Social Profiles & Official Meta Icons — 2026-09-26/`.

## Render everything (Linux cloud session or Mac)
```bash
pip install playwright numpy pillow scipy soundfile imageio-ffmpeg
# Linux cloud session: ffmpeg from imageio-ffmpeg, browser already installed
ln -sf "$(python3 -c 'import imageio_ffmpeg as i; print(i.get_ffmpeg_exe())')" /usr/local/bin/ffmpeg
export CHROMIUM_PATH=/opt/pw-browsers/chromium   # Mac: omit and run `python3 -m playwright install chromium`
tools/variants.sh      # builds every variant HTML into build/
tools/render_all.sh    # renders 1:1, 4:5, 9:16 (sound + silent) into exports/<piece>/
```
