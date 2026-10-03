"""Inline the engine, fonts and audio into one self-contained HTML file.

  python3 build.py --template piece.html --out piece.built.html \
      --font "Geist=fonts/Geist-Variable.woff2:100 900" \
      --font "Poppins=fonts/poppins-latin-600-normal.woff2:600" \
      [--audio track.wav]

Placeholders in the template:
  __FONTFACES__   replaced with @font-face rules (fonts embedded as base64)
  /*ENGINE*/      replaced with scripts/engine.js
  __AUDIO__       replaced with a data: URI of the audio (AAC), or left empty
"""
import argparse, base64, pathlib, subprocess, tempfile

HERE = pathlib.Path(__file__).parent

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--template", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--font", action="append", default=[], help="Family=path.woff2[:weight or 'min max']")
    ap.add_argument("--audio")
    a = ap.parse_args()

    faces = []
    for spec in a.font:
        fam, rest = spec.split("=", 1)
        path, _, weight = rest.partition(":")
        b64 = base64.b64encode(pathlib.Path(path).read_bytes()).decode()
        faces.append(f'@font-face{{font-family:"{fam}";src:url(data:font/woff2;base64,{b64}) format("woff2");'
                     f'font-weight:{weight or "400"};font-display:block}}')

    audio_uri = ""
    if a.audio:
        with tempfile.TemporaryDirectory() as td:
            m4a = pathlib.Path(td) / "a.m4a"
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", a.audio, "-c:a", "aac", "-b:a", "160k", str(m4a)], check=True)
            audio_uri = "data:audio/mp4;base64," + base64.b64encode(m4a.read_bytes()).decode()

    s = pathlib.Path(a.template).read_text()
    s = s.replace("__FONTFACES__", "\n".join(faces))
    s = s.replace("/*ENGINE*/", (HERE / "engine.js").read_text())
    s = s.replace("__AUDIO__", audio_uri)
    pathlib.Path(a.out).write_text(s)
    print(f"wrote {a.out} ({len(s)//1024} KB)")

if __name__ == "__main__":
    main()
