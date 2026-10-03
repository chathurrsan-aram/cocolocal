"""Fetch a brand font as woff2 from npm (the sandbox can reach npm but not Google Fonts).

  python3 get_font.py geist                 -> fonts/Geist-Variable.woff2
  python3 get_font.py poppins 500 600 700   -> fonts/poppins-latin-600-normal.woff2 ...
  python3 get_font.py "inter" 400 700       (any Fontsource family, lowercase, dashes for spaces)

Prints the --font arguments to pass to build.py.
"""
import glob, pathlib, shutil, subprocess, sys, tarfile, tempfile

def main():
    fam = sys.argv[1].lower().replace(" ", "-")
    weights = sys.argv[2:] or ["400", "600"]
    out = pathlib.Path("fonts"); out.mkdir(exist_ok=True)
    pkg = "geist" if fam == "geist" else f"@fontsource/{fam}"
    with tempfile.TemporaryDirectory() as td:
        subprocess.run(["npm", "pack", pkg, "--userconfig", "/dev/null", "--silent"], cwd=td, check=True,
                       stdout=subprocess.DEVNULL)
        tgz = glob.glob(f"{td}/*.tgz")[0]
        tarfile.open(tgz).extractall(td)
        args = []
        if fam == "geist":
            src = pathlib.Path(td) / "package/dist/fonts/geist-sans/Geist-Variable.woff2"
            shutil.copy(src, out / src.name)
            args.append(f'--font "Geist={out / src.name}:100 900"')
        else:
            name = fam.replace("-", " ").title()
            for w in weights:
                m = glob.glob(f"{td}/package/files/{fam}-latin-{w}-normal.woff2")
                if not m:
                    print(f"weight {w} not found for {fam}", file=sys.stderr); continue
                dst = out / pathlib.Path(m[0]).name
                shutil.copy(m[0], dst)
                args.append(f'--font "{name}={dst}:{w}"')
    print(" ".join(args))

if __name__ == "__main__":
    main()
