"""Contact sheet: python3 sheet.py out.jpg cols thumbW file1 file2 ...  (labels each frame with its time)"""
import sys, re
from PIL import Image, ImageDraw
out, cols, tw_ = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]); fs = sys.argv[4:]
ims = [Image.open(f).convert('RGB') for f in fs]; th = int(tw_ * ims[0].height / ims[0].width)
rows = (len(ims) + cols - 1) // cols; S = Image.new('RGB', (cols * (tw_ + 12) + 12, rows * (th + 40) + 12), (235, 230, 220)); d = ImageDraw.Draw(S)
for i, (f, im) in enumerate(zip(fs, ims)):
    X, Y = 12 + (i % cols) * (tw_ + 12), 12 + (i // cols) * (th + 40)
    S.paste(im.resize((tw_, th), Image.LANCZOS), (X, Y + 28)); m = re.search(r't_(\d+)', f)
    d.text((X, Y + 8), (f'{int(m.group(1))/1000:.2f} s' if m else f.split('/')[-1]), fill=(16, 16, 57))
S.save(out, quality=88); print('sheet', out, S.size)
