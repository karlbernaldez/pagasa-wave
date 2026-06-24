#!/usr/bin/env python3
"""Serve generated XYZ tiles locally with CORS headers for frontend development.

Usage from repository root:
  python wavetiles/scripts/serve_tiles.py

Usage from wavetiles/tiles:
  python ../scripts/serve_tiles.py --root . --port 8081
"""

from __future__ import annotations

import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class CorsTileRequestHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".png": "image/png",
        ".json": "application/json",
        ".tif": "image/tiff",
        ".tiff": "image/tiff",
    }

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Origin, Range, Accept, Content-Type")
        self.send_header("Access-Control-Expose-Headers", "Content-Length, Content-Range")
        self.send_header("Cross-Origin-Resource-Policy", "cross-origin")
        super().end_headers()

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.end_headers()


def parse_args() -> argparse.Namespace:
    default_root = Path(__file__).resolve().parents[1] / "tiles"
    parser = argparse.ArgumentParser(description="Serve Wavelab tiles with CORS headers.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8081)
    parser.add_argument("--root", default=str(default_root), help="Tile root directory to serve.")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    root = Path(args.root).resolve()
    if not root.exists():
        raise SystemExit(f"Tile root does not exist: {root}")

    handler = partial(CorsTileRequestHandler, directory=str(root))
    server = ThreadingHTTPServer((args.host, args.port), handler)
    print(f"Serving tiles from {root}")
    print(f"URL root: http://{args.host}:{args.port}/")
    print("CORS: Access-Control-Allow-Origin: *")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping tile server.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
