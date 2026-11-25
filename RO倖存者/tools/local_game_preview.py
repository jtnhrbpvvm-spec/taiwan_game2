"""Preview an existing crawl on loopback without changing the downloaded game."""
import argparse
import http.server
import importlib.util
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--version", help="Downloaded version folder name")
    parser.add_argument("--port", type=int, default=8381)
    args = parser.parse_args()
    crawl = Path.home() / "Desktop" / "爬蟲" / "ro-survivors-tool" / "rs-crawl"
    versions = sorted(
        p for p in crawl.glob("20*_*") if (p / "_offline_server.py").is_file()
    )
    if not versions:
        parser.error("No downloaded versions found")
    version = crawl / args.version if args.version else versions[-1]
    if version.parent.resolve() != crawl.resolve():
        parser.error("Version must be a folder name inside rs-crawl")
    spec = importlib.util.spec_from_file_location("rs_preview", version / "_offline_server.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    class MutedHandler(module.Handler):
        def _send(self, body, ctype, code=200):
            if "text/html" in ctype:
                # Silence only the test response; downloaded files stay intact.
                mute = b'''<script>for(const k of ["AudioContext","webkitAudioContext"]){const C=window[k];if(C)window[k]=class extends C{constructor(...a){super(...a);this.suspend()}resume(){return Promise.resolve()}}}document.addEventListener("play",e=>{e.target.muted=true},true)</script>'''
                body = body.replace(b"<head>", b"<head>" + mute, 1)
            return super()._send(body, ctype, code)

    with http.server.ThreadingHTTPServer(("127.0.0.1", args.port), MutedHandler) as server:
        print(f"Version: {version.name}", flush=True)
        print(f"Muted preview: http://127.0.0.1:{args.port}/?notools", flush=True)
        print("Ctrl+C stops the server. Upstream host restrictions remain in effect.", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
