import sys, pathlib
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(executable_path='/opt/pw-browsers/chromium'); pg = b.new_page(viewport={'width': 1080, 'height': 1920})
    pg.on('pageerror', lambda e: print('PAGEERROR', e)); pg.on('console', lambda m: print('CONSOLE', m.type, m.text[:300]))
    pg.goto(pathlib.Path(sys.argv[1]).resolve().as_uri() + '?render'); pg.wait_for_timeout(8000); print('READY', pg.evaluate('window.READY')); b.close()
