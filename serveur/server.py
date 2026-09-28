#!/usr/bin/env python3
"""DevPortals — serveur local (Python 3, aucune dépendance).

Sert :
  /studio/   l'application DevPortals (accessible uniquement depuis ce PC)
  /          le portail joueurs (accessible depuis le réseau local)
  /data/     le contenu publié du portail (site.json + médias)
  /api/...   publication, médias, sauvegardes (uniquement depuis ce PC)

Usage : python3 serveur/server.py [--port 8765] [--no-browser]
"""
import argparse
import errno
import http.server
import ipaddress
import json
import os
import re
import socket
import subprocess
import sys
import time
import urllib.parse
import urllib.request
import webbrowser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STUDIO = os.path.join(ROOT, "studio")
PORTAL = os.path.join(ROOT, "portail")
DATA = os.path.join(ROOT, "portail-data")
MEDIA = os.path.join(DATA, "media")
BACKUPS = os.path.join(ROOT, "sauvegardes")
MDJS = os.path.join(STUDIO, "assets", "js", "md.js")

MIME = {
    ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".ico": "image/x-icon", ".mp3": "audio/mpeg",
    ".ogg": "audio/ogg", ".wav": "audio/wav", ".m4a": "audio/mp4", ".flac": "audio/flac", ".webm": "audio/webm",
    ".txt": "text/plain; charset=utf-8", ".woff2": "font/woff2", ".bin": "application/octet-stream",
}
NAME_RE = re.compile(r"^[A-Za-z0-9_.\-]{1,160}$")
MEDIA_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".mp3", ".ogg", ".wav", ".m4a", ".flac", ".webm", ".bin"}
MAX_BODY = 500 * 1024 * 1024
KEEP_BACKUPS = 30
PORT = 8765


def lan_urls(port):
    ips = set()
    try:
        for ip in socket.gethostbyname_ex(socket.gethostname())[2]:
            ips.add(ip)
    except OSError:
        pass
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("10.255.255.255", 1))  # aucun paquet envoyé : sert à trouver l'interface principale
        ips.add(s.getsockname()[0])
        s.close()
    except OSError:
        pass
    return [f"http://{ip}:{port}/" for ip in sorted(ips) if not ip.startswith("127.") and not ip.startswith("169.254.")]


def safe_path(base, rel):
    rel = urllib.parse.unquote(rel).lstrip("/").replace("\\", "/")
    full = os.path.realpath(os.path.join(base, rel or "index.html"))
    base_real = os.path.realpath(base)
    if full != base_real and not full.startswith(base_real + os.sep):
        return None
    if os.path.isdir(full):
        full = os.path.join(full, "index.html")
    return full if os.path.isfile(full) else None


class Handler(http.server.BaseHTTPRequestHandler):
    server_version = "DevPortals/1.0"

    def log_message(self, fmt, *args):  # journal discret
        if "/api/" in self.path or int(getattr(self, "_status", 200)) >= 400:
            sys.stdout.write("  %s %s %s\n" % (self.command, self.path.split("?")[0], getattr(self, "_status", "")))

    # --- utilitaires de réponse ---
    def is_local(self):
        try:
            ip = ipaddress.ip_address(self.client_address[0].split("%")[0])
            if ip.version == 6 and ip.ipv4_mapped:
                ip = ip.ipv4_mapped
            return ip.is_loopback
        except ValueError:
            return False

    def send_bytes(self, status, body, ctype="text/plain; charset=utf-8", extra=None):
        self._status = status
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("X-Content-Type-Options", "nosniff")
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def send_text(self, status, text):
        self.send_bytes(status, text.encode("utf-8"))

    def send_json(self, obj, status=200):
        self.send_bytes(status, json.dumps(obj).encode("utf-8"), "application/json; charset=utf-8", {"Cache-Control": "no-store"})

    def serve_file(self, path, cache="no-cache"):
        ext = os.path.splitext(path)[1].lower()
        ctype = MIME.get(ext, "application/octet-stream")
        size = os.path.getsize(path)
        extra = {"Accept-Ranges": "bytes", "Cache-Control": cache}
        rng = self.headers.get("Range")
        m = re.match(r"^bytes=(\d*)-(\d*)$", rng or "")
        with open(path, "rb") as f:
            if m and size > 0 and (m.group(1) or m.group(2)):
                if m.group(1):
                    start = int(m.group(1))
                    end = int(m.group(2)) if m.group(2) else size - 1
                else:
                    start = max(0, size - int(m.group(2)))
                    end = size - 1
                end = min(end, size - 1)
                if start > end:
                    return self.send_bytes(416, b"", ctype, {"Content-Range": f"bytes */{size}"})
                f.seek(start)
                body = f.read(end - start + 1)
                extra["Content-Range"] = f"bytes {start}-{end}/{size}"
                return self.send_bytes(206, body, ctype, extra)
            return self.send_bytes(200, f.read(), ctype, extra)

    def read_body(self):
        length = int(self.headers.get("Content-Length") or 0)
        if length > MAX_BODY:
            raise ValueError("body too large")
        return self.rfile.read(length) if length > 0 else b""

    def forbidden_remote(self):
        self.send_bytes(403, "<!doctype html><meta charset=utf-8><body style='font-family:sans-serif;background:#111;color:#eee;padding:40px'>"
                             "<h2>DevPortals</h2><p>Le studio n'est accessible que sur l'ordinateur du développeur.<br>"
                             "The studio is only available on the developer's computer.</p><p><a style='color:#a78bfa' href='/'>Portail / Portal →</a></p>".encode("utf-8"),
                        "text/html; charset=utf-8")

    # --- routes ---
    def do_HEAD(self):
        self.do_GET()

    def do_GET(self):
        try:
            self.route("GET")
        except (BrokenPipeError, ConnectionResetError):
            pass
        except Exception as e:  # noqa: BLE001
            self.send_text(500, f"Erreur serveur : {e}")

    def do_POST(self):
        try:
            self.route("POST")
        except (BrokenPipeError, ConnectionResetError):
            pass
        except Exception as e:  # noqa: BLE001
            self.send_text(500, f"Erreur serveur : {e}")

    def route(self, method):
        url = urllib.parse.urlsplit(self.path)
        path = urllib.parse.unquote(url.path)
        query = urllib.parse.parse_qs(url.query)

        if path == "/api/ping":
            return self.send_text(200, "devportals")
        if path.startswith("/api/"):
            if not self.is_local():
                return self.send_text(403, "forbidden")
            return self.api(method, path, query)
        if path in ("/studio", "/studio/index.htm"):
            return self.send_bytes(302, b"", extra={"Location": "/studio/"})
        if path.startswith("/studio/"):
            if not self.is_local():
                return self.forbidden_remote()
            f = safe_path(STUDIO, path[len("/studio/"):])
            return self.serve_file(f) if f else self.send_text(404, "Not found")
        if path == "/shared/md.js":
            return self.serve_file(MDJS)
        if path.startswith("/data/"):
            f = safe_path(DATA, path[len("/data/"):])
            if not f:
                return self.send_text(404, "Not found")
            return self.serve_file(f, "no-cache" if f.endswith(".json") else "public, max-age=31536000, immutable")
        f = safe_path(PORTAL, path)
        return self.serve_file(f) if f else self.send_text(404, "Not found")

    def api(self, method, path, query):
        if path == "/api/info":
            site = os.path.join(DATA, "site.json")
            return self.send_json({"app": "DevPortals", "port": PORT, "urls": lan_urls(PORT),
                                   "published": int(os.path.getmtime(site) * 1000) if os.path.exists(site) else None,
                                   "root": ROOT, "server": "python"})
        if path == "/api/media" and method == "GET":
            return self.send_json(sorted(n for n in os.listdir(MEDIA) if os.path.isfile(os.path.join(MEDIA, n))))
        if path == "/api/media" and method == "POST":
            name = (query.get("name") or [""])[0]
            if not NAME_RE.match(name) or os.path.splitext(name)[1].lower() not in MEDIA_EXT:
                return self.send_text(400, "invalid name")
            with open(os.path.join(MEDIA, name), "wb") as f:
                f.write(self.read_body())
            return self.send_json({"ok": True})
        if path == "/api/publish" and method == "POST":
            body = self.read_body()
            try:
                json.loads(body.decode("utf-8"))
            except (ValueError, UnicodeDecodeError):
                return self.send_text(400, "invalid json")
            tmp = os.path.join(DATA, "site.json.tmp")
            with open(tmp, "wb") as f:
                f.write(body)
            os.replace(tmp, os.path.join(DATA, "site.json"))
            return self.send_json({"ok": True})
        if path == "/api/prune" and method == "POST":
            keep = set(x.strip() for x in self.read_body().decode("utf-8").splitlines() if x.strip())
            removed = 0
            for n in os.listdir(MEDIA):
                if n not in keep and NAME_RE.match(n):
                    os.remove(os.path.join(MEDIA, n))
                    removed += 1
            return self.send_json({"ok": True, "removed": removed})
        if path == "/api/unpublish" and method == "POST":
            site = os.path.join(DATA, "site.json")
            if os.path.exists(site):
                os.remove(site)
            return self.send_json({"ok": True})
        if path == "/api/backup" and method == "POST":
            name = (query.get("name") or [""])[0]
            if not NAME_RE.match(name) or not name.endswith(".json"):
                return self.send_text(400, "invalid name")
            with open(os.path.join(BACKUPS, name), "wb") as f:
                f.write(self.read_body())
            prefix = name.split("__")[0] + "__"
            olds = sorted((n for n in os.listdir(BACKUPS) if n.startswith(prefix)), key=lambda n: os.path.getmtime(os.path.join(BACKUPS, n)), reverse=True)
            for n in olds[KEEP_BACKUPS:]:
                os.remove(os.path.join(BACKUPS, n))
            return self.send_json({"ok": True})
        if path == "/api/backups" and method == "GET":
            items = []
            for n in os.listdir(BACKUPS):
                fp = os.path.join(BACKUPS, n)
                if n.endswith(".json") and os.path.isfile(fp):
                    items.append({"name": n, "size": os.path.getsize(fp), "time": int(os.path.getmtime(fp) * 1000)})
            return self.send_json(sorted(items, key=lambda x: x["time"], reverse=True))
        if path.startswith("/api/backups/") and method == "GET":
            name = path[len("/api/backups/"):]
            fp = os.path.join(BACKUPS, name)
            if not NAME_RE.match(name) or not os.path.isfile(fp):
                return self.send_text(404, "Not found")
            return self.serve_file(fp)
        if path == "/api/open-folder" and method == "POST":
            which = (query.get("which") or ["backups"])[0]
            folder = BACKUPS if which == "backups" else DATA
            try:
                if sys.platform.startswith("win"):
                    os.startfile(folder)  # type: ignore[attr-defined]
                elif sys.platform == "darwin":
                    subprocess.Popen(["open", folder])
                else:
                    subprocess.Popen(["xdg-open", folder])
            except OSError as e:
                return self.send_text(500, str(e))
            return self.send_json({"ok": True, "folder": folder})
        return self.send_text(404, "unknown api")


class Server(http.server.ThreadingHTTPServer):
    daemon_threads = True
    # sous Windows, SO_REUSEADDR permettrait de « voler » un port déjà utilisé
    allow_reuse_address = not sys.platform.startswith("win")

    def server_bind(self):
        if self.address_family == socket.AF_INET6:
            try:
                self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)  # IPv4 + IPv6
            except (OSError, AttributeError):
                pass
        super().server_bind()


class Server6(Server):
    address_family = socket.AF_INET6


def make_server(port):
    try:
        return Server6(("::", port), Handler)
    except OSError as e:
        if e.errno in (errno.EADDRINUSE, 10048):
            raise
        return Server(("", port), Handler)


def main():
    global PORT
    ap = argparse.ArgumentParser(description="DevPortals — serveur local")
    ap.add_argument("--port", type=int, default=int(os.environ.get("DEVPORTALS_PORT", "8765")))
    ap.add_argument("--no-browser", action="store_true")
    args = ap.parse_args()
    PORT = args.port
    for d in (DATA, MEDIA, BACKUPS):
        os.makedirs(d, exist_ok=True)
    studio_url = f"http://localhost:{PORT}/studio/"
    try:
        httpd = make_server(PORT)
    except OSError:
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/api/ping", timeout=2) as r:
                if r.read().decode() == "devportals":
                    print(f"DevPortals est déjà lancé. Ouverture de {studio_url}")
                    if not args.no_browser:
                        webbrowser.open(studio_url)
                    return
        except Exception:  # noqa: BLE001
            pass
        print(f"[ERREUR] Le port {PORT} est déjà utilisé par un autre programme. Relance avec --port 8766 (garde toujours le même port pour retrouver tes projets).")
        sys.exit(1)

    print("")
    print("  ==============================================")
    print("   DevPortals — serveur local actif")
    print("  ==============================================")
    print(f"   Studio (ce PC)     : {studio_url}")
    print(f"   Portail (ce PC)    : http://localhost:{PORT}/")
    for u in lan_urls(PORT):
        print(f"   Portail (réseau)   : {u}")
    print("   Laisse cette fenêtre ouverte. Ctrl+C pour arrêter.")
    print("")
    if not args.no_browser:
        webbrowser.open(studio_url)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nArrêt du serveur.")


if __name__ == "__main__":
    main()
