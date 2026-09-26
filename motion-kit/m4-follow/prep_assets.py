"""Crop the social screenshots to the page column and paint out owner/admin-only UI.
Inputs: inputs/ (from Drive, git-ignored). Outputs: assets/ (git-ignored)."""
from PIL import Image, ImageDraw
import pathlib
H = pathlib.Path(__file__).parent; I = H / "inputs"; O = H / "assets"; O.mkdir(exist_ok=True)

def fill(im, box, src=None, colour=None):
    """Paint box with the colour sampled just outside it (or copy the strip above it when src='above')."""
    x0, y0, x1, y1 = box
    if src == "above":
        h = y1 - y0; im.paste(im.crop((x0, y0 - h, x1, y0)), (x0, y0)); return
    c = colour or im.getpixel((x0 - 4 if x0 >= 4 else x1 + 4, y0))
    ImageDraw.Draw(im).rectangle(box, fill=c)

ig = Image.open(I / "instagram-profile.jpg").convert("RGB")
fill(ig, (425, 50, 492, 100))       # "Note..." bubble (owner), then restore the avatar edge under it
navy = ig.getpixel((470, 128)); m = Image.new("L", ig.size, 0); ImageDraw.Draw(m).ellipse((395, 85, 545, 235), fill=255)
box = Image.new("L", ig.size, 0); ImageDraw.Draw(box).rectangle((425, 50, 492, 100), fill=255)
from PIL import ImageChops; ig.paste(navy, (0, 0), ImageChops.multiply(m, box))
fill(ig, (388, 278, 1080, 334))     # Edit profile / View archive (owner) → our Follow pill sits here
fill(ig, (400, 364, 506, 496))      # "New" highlight (owner)
ig = ig.crop((190, 20, 1006, 1290)); ig.save(O / "ig.jpg", quality=90)

fb = Image.open(I / "facebook-page.jpg").convert("RGB")
fill(fb, (1084, 406, 1254, 452), "above")   # Edit cover photo
fill(fb, (204, 452, 340, 496), colour=(255, 255, 255))              # "Share a thought" bubble
fill(fb, (824, 500, 1254, 548))             # Professional dashboard / Edit / Advertise → our Follow pill
for y in (780, 976, 1074): fill(fb, (596, y, 640, y + 36))   # edit pencils
fill(fb, (656, 762, 1256, 896))             # "What's on your mind?" composer (admin)
fill(fb, (1150, 918, 1240, 958))            # Featured "Manage"
fill(fb, (208, 1308, 610, 1356), colour=(255, 255, 255))   # Add highlights (admin)
fill(fb, (955, 1376, 1236, 1422), colour=(255, 255, 255))  # Filters / Manage posts (admin)
fb = fb.crop((188, 56, 1282, 1700)); fb.save(O / "fb.jpg", quality=90)
print(ig.size, fb.size)
