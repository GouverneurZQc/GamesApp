#!/usr/bin/env python3
"""DevPortals — serveur de la plateforme (Python 3.9+, bibliothèque standard uniquement).

Pages :
  /              catalogue public de tous les portails de jeux (+ connexion / inscription)
  /g/<slug>/     portail d'un jeu (public une fois validé par l'administration)
  /studio/       le studio (données accessibles seulement une fois connecté)

Données (dossier « donnees ») :
  utilisateurs.json, sessions.json, portails.json, config.json
  comptes/<id>/projets/*.json, comptes/<id>/medias/*, comptes/<id>/versions/...
  portails/<slug>/site.json (en ligne), pending.json (en attente), media/

Usage : python3 serveur/server.py [--port 8765] [--no-browser] [--reset-password NOM]
"""
import argparse
import errno
import getpass
import hashlib
import hmac
import http.server
import ipaddress
import json
import os
import re
import secrets
import shutil
import socket
import subprocess
import sys
import threading
import time
import urllib.parse
import urllib.request
import webbrowser
from datetime import datetime
from http import cookies

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STUDIO = os.path.join(ROOT, "studio")
VIEWER = os.path.join(ROOT, "portail")
HUB = os.path.join(ROOT, "hub")
DATA = os.environ.get("DEVPORTALS_DATA") or os.path.join(ROOT, "donnees")
ACCOUNTS = os.path.join(DATA, "comptes")
PORTALS = os.path.join(DATA, "portails")
TRASH = os.path.join(DATA, "corbeille")
F_USERS = os.path.join(DATA, "utilisateurs.json")
F_SESS = os.path.join(DATA, "sessions.json")
F_PORTALS = os.path.join(DATA, "portails.json")
F_CONFIG = os.path.join(DATA, "config.json")

MIME = {
    ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".ico": "image/x-icon", ".mp3": "audio/mpeg",
    ".ogg": "audio/ogg", ".wav": "audio/wav", ".m4a": "audio/mp4", ".flac": "audio/flac", ".webm": "audio/webm",
    ".txt": "text/plain; charset=utf-8", ".woff2": "font/woff2",
}
EXT_BY_MIME = {
    "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg",
    "audio/mpeg": "mp3", "audio/mp3": "mp3", "audio/ogg": "ogg", "audio/wav": "wav", "audio/x-wav": "wav", "audio/wave": "wav",
    "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/aac": "m4a", "audio/flac": "flac", "audio/x-flac": "flac", "audio/webm": "webm",
}
MEDIA_EXT = {"jpg", "png", "webp", "gif", "svg", "mp3", "ogg", "wav", "m4a", "flac", "webm"}
RE_USER = re.compile(r"^[A-Za-z0-9_.\-]{3,32}$")
RE_UID = re.compile(r"^usr_[a-f0-9]{8,32}$")
RE_PID = re.compile(r"^prj_[a-z0-9]{4,60}$")
RE_MID = re.compile(r"^(img|aud)_[a-z0-9]{4,60}$")
RE_SLUG = re.compile(r"^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$")
RE_FILE = re.compile(r"^[A-Za-z0-9_.\-]{1,160}$")
RE_VERSION = re.compile(r"^[0-9_\-]{10,40}\.json$")
RE_MEDIA_PATH = re.compile(r"^data/media/[A-Za-z0-9_.\-]{1,160}$")
# Les médias viennent des créateurs : même ouverts directement, ils ne peuvent exécuter aucun script
MEDIA_CSP = "default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'; sandbox"
MAX_JSON = 60 * 1024 * 1024
MAX_UPLOAD = 400 * 1024 * 1024
MAX_SMALL = 256 * 1024
SESSION_MS = 30 * 24 * 3600 * 1000
PBKDF2_ITER = 200_000
KEEP_VERSIONS = 30
VERSION_EVERY = 600  # secondes entre deux versions automatiques d'un projet
DEFAULT_CONFIG = {"hubName": "DevPortals", "hubTagline": "", "allowRegistration": True, "requireApproval": True}
PORT = 8765
LOCK = threading.RLock()
FAILS = {}


def now_ms():
    return int(time.time() * 1000)


def read_json(path, default):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, ValueError):
        return default


def write_bytes(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = f"{path}.{threading.get_ident()}.tmp"
    with open(tmp, "wb") as f:
        f.write(data)
    os.replace(tmp, path)


def write_json(path, obj):
    write_bytes(path, json.dumps(obj, ensure_ascii=False, indent=1).encode("utf-8"))


class State:
    """Petites bases JSON gardées en mémoire (toute modification se fait sous LOCK)."""

    def __init__(self):
        self.config = {**DEFAULT_CONFIG, **read_json(F_CONFIG, {})}
        self.users = read_json(F_USERS, {}).get("users", [])
        self.sessions = read_json(F_SESS, {})
        self.portals = read_json(F_PORTALS, {}).get("portals", [])
        t = now_ms()
        self.sessions = {k: v for k, v in self.sessions.items() if v.get("exp", 0) > t}

    def save_config(self):
        write_json(F_CONFIG, self.config)

    def save_users(self):
        write_json(F_USERS, {"users": self.users})

    def save_sessions(self):
        write_json(F_SESS, self.sessions)

    def save_portals(self):
        write_json(F_PORTALS, {"portals": self.portals})

    def user(self, uid):
        return next((u for u in self.users if u["id"] == uid), None)

    def user_by_name(self, name):
        n = (name or "").lower()
        return next((u for u in self.users if u["usernameLower"] == n), None)

    def portal(self, slug):
        return next((p for p in self.portals if p["slug"] == slug), None)

    def portal_of(self, uid, pid):
        return next((p for p in self.portals if p["ownerId"] == uid and p["projectId"] == pid), None)


ST = None


# ---------------- Comptes ----------------
def hash_password(pw, salt=None, iterations=PBKDF2_ITER):
    salt = salt or secrets.token_bytes(16)
    dk = hashlib.pbkdf2_hmac("sha256", pw.encode("utf-8"), salt, iterations)
    return {"alg": "pbkdf2-sha256", "iter": iterations, "salt": salt.hex(), "hash": dk.hex()}


def check_password(pw, rec):
    dk = hashlib.pbkdf2_hmac("sha256", pw.encode("utf-8"), bytes.fromhex(rec["salt"]), int(rec["iter"]))
    return hmac.compare_digest(dk.hex(), rec["hash"])


_DUMMY = None


def dummy_check():
    """Même temps de calcul quand le compte n'existe pas (évite de deviner les noms)."""
    global _DUMMY
    if _DUMMY is None:
        _DUMMY = hash_password("x")
    check_password("y", _DUMMY)


def public_user(u, self_view=False):
    if not u:
        return None
    out = {"id": u["id"], "username": u["username"], "displayName": u.get("displayName") or u["username"], "role": u["role"],
           "createdAt": u.get("createdAt"), "bio": u.get("bio", "")}
    if self_view:
        out["settings"] = u.get("settings", {})
    return out


def validate_account(body, need_password=True):
    username = str(body.get("username", "")).strip()
    display = str(body.get("displayName", "")).strip()[:40] or username
    password = str(body.get("password", ""))
    if not RE_USER.match(username):
        return None, "invalid_username"
    if need_password and not (6 <= len(password) <= 200):
        return None, "weak_password"
    return {"username": username, "displayName": display, "password": password}, None


def new_user(username, display, password, role):
    return {"id": "usr_" + secrets.token_hex(8), "username": username, "usernameLower": username.lower(), "displayName": display,
            "role": role, "password": hash_password(password), "createdAt": now_ms(), "lastLogin": None, "disabled": False, "bio": "", "settings": {}}


def user_dir(uid, *parts):
    return os.path.join(ACCOUNTS, uid, *parts)


# ---------------- Portails ----------------
def slugify(text):
    import unicodedata
    s = unicodedata.normalize("NFD", str(text or "")).encode("ascii", "ignore").decode()
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s).strip("-").lower()[:50].strip("-")
    return s or "jeu"


def unique_slug(title):
    base = slugify(title)
    slug, i = base, 2
    while ST.portal(slug) or slug in ("api", "studio", "hub", "g", "shared"):
        slug = f"{base}-{i}"
        i += 1
    return slug


def portal_dir(slug, *parts):
    return os.path.join(PORTALS, slug, *parts)


def extract_meta(site):
    s = site.get("site") or {}
    pr = site.get("project") or {}
    cat = site.get("catalog") or {}
    ents = site.get("entities") or {}

    def strs(v, n, ln=40):
        return [str(x)[:ln] for x in (v if isinstance(v, list) else [])][:n]
    hero = str(s.get("hero") or "")
    counts = {k: len(v) for k, v in ents.items() if isinstance(v, list)}
    for k in ("news", "patches", "maps", "gallery"):
        if isinstance(site.get(k), list):
            counts[k] = len(site[k])
    return {
        "title": str(s.get("title") or pr.get("name") or "Sans titre")[:120],
        "tagline": str(s.get("tagline") or "")[:300],
        "genres": strs(cat.get("genres"), 10), "styles": strs(cat.get("styles"), 12), "tags": strs(cat.get("tags"), 15),
        "modes": strs(cat.get("modes"), 6), "platformList": strs(cat.get("platforms"), 10),
        "stage": str(pr.get("stage") or "")[:20], "platforms": str(pr.get("platforms") or "")[:120], "genreText": str(pr.get("genre") or "")[:80],
        "cover": hero if RE_MEDIA_PATH.match(hero) else "", "counts": counts, "lang": str(site.get("lang") or "fr")[:5],
    }


def portal_status(p):
    if p.get("hasPending"):
        return "pending"
    if p.get("live"):
        return "live"
    r = p.get("review") or {}
    return r.get("decision") or "draft"


def portal_view(p):
    owner = ST.user(p["ownerId"])
    return {**{k: p.get(k) for k in ("slug", "projectId", "ownerId", "live", "hasPending", "review", "featured", "meta", "pendingMeta",
                                     "createdAt", "submittedAt", "approvedAt", "updatedAt")},
            "status": portal_status(p), "ownerName": (owner.get("displayName") or owner["username"]) if owner else "?", "url": f"/g/{p['slug']}/"}


def referenced_media(*paths):
    names = set()
    for path in paths:
        try:
            with open(path, "r", encoding="utf-8") as f:
                names.update(re.findall(r"data/media/([A-Za-z0-9_.\-]+)", f.read()))
        except FileNotFoundError:
            pass
    return names


def prune_portal_media(slug):
    keep = referenced_media(portal_dir(slug, "site.json"), portal_dir(slug, "pending.json"))
    mdir = portal_dir(slug, "media")
    if os.path.isdir(mdir):
        for n in os.listdir(mdir):
            if n not in keep:
                os.remove(os.path.join(mdir, n))


def approve_portal(p, by, note=""):
    pend = portal_dir(p["slug"], "pending.json")
    if os.path.exists(pend):
        os.replace(pend, portal_dir(p["slug"], "site.json"))
    p.update({"live": True, "hasPending": False, "meta": p.get("pendingMeta") or p.get("meta") or {}, "approvedAt": now_ms(), "updatedAt": now_ms(),
              "review": {"decision": "approved", "note": note, "at": now_ms(), "by": by}})
    prune_portal_media(p["slug"])


def remove_portal_files(p, keep_media=False):
    for n in ("site.json", "pending.json"):
        f = portal_dir(p["slug"], n)
        if os.path.exists(f):
            os.remove(f)
    if not keep_media:
        prune_portal_media(p["slug"])


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


class ApiError(Exception):
    def __init__(self, status, code):
        super().__init__(code)
        self.status = status
        self.code = code


# ======================================================================
class Handler(http.server.BaseHTTPRequestHandler):
    server_version = "DevPortals/2.0"

    def log_message(self, fmt, *args):
        st = int(getattr(self, "_status", 200) or 200)
        if (self.command != "GET" and "/api/" in self.path) or st >= 500:
            sys.stdout.write("  %s %s %s\n" % (self.command, self.path.split("?")[0], st))

    # ---------- réponses ----------
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
        self.send_header("Referrer-Policy", "same-origin")
        for k, v in (extra or {}).items():
            if isinstance(v, list):
                for x in v:
                    self.send_header(k, x)
            else:
                self.send_header(k, v)
        if getattr(self, "_cookie", None):
            self.send_header("Set-Cookie", self._cookie)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def send_json(self, obj, status=200):
        self.send_bytes(status, json.dumps(obj, ensure_ascii=False).encode("utf-8"), "application/json; charset=utf-8", {"Cache-Control": "no-store"})

    def send_text(self, status, text):
        self.send_bytes(status, text.encode("utf-8"))

    def serve_file(self, path, cache="no-cache", ctype=None, csp=None):
        ext = os.path.splitext(path)[1].lower()
        ctype = ctype or MIME.get(ext, "application/octet-stream")
        size = os.path.getsize(path)
        extra = {"Accept-Ranges": "bytes", "Cache-Control": cache}
        if csp:
            extra["Content-Security-Policy"] = csp
        m = re.match(r"^bytes=(\d*)-(\d*)$", self.headers.get("Range") or "")
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
                extra["Content-Range"] = f"bytes {start}-{end}/{size}"
                return self.send_bytes(206, f.read(end - start + 1), ctype, extra)
            return self.send_bytes(200, f.read(), ctype, extra)

    def read_body(self, limit):
        length = int(self.headers.get("Content-Length") or 0)
        if length > limit:
            raise ApiError(413, "too_large")
        return self.rfile.read(length) if length > 0 else b""

    def json_body(self, limit=MAX_SMALL):
        raw = self.read_body(limit)
        try:
            obj = json.loads(raw.decode("utf-8") or "{}")
        except (ValueError, UnicodeDecodeError):
            raise ApiError(400, "invalid_json")
        if not isinstance(obj, dict):
            raise ApiError(400, "invalid_json")
        return obj

    # ---------- session ----------
    def load_user(self):
        self.user = None
        self._sess_key = None
        self._cookie = None
        try:
            c = cookies.SimpleCookie()
            c.load(self.headers.get("Cookie") or "")
            tok = c.get("dp_session")
        except cookies.CookieError:
            return
        if not tok or not tok.value:
            return
        key = hashlib.sha256(tok.value.encode()).hexdigest()
        with LOCK:
            s = ST.sessions.get(key)
            if not s or s.get("exp", 0) < now_ms():
                return
            u = ST.user(s["uid"])
            if not u or u.get("disabled"):
                return
            if s["exp"] - now_ms() < SESSION_MS // 2:  # prolongation glissante
                s["exp"] = now_ms() + SESSION_MS
                ST.save_sessions()
        self.user = u
        self._sess_key = key

    def start_session(self, u):
        tok = secrets.token_urlsafe(32)
        with LOCK:
            ST.sessions[hashlib.sha256(tok.encode()).hexdigest()] = {"uid": u["id"], "exp": now_ms() + SESSION_MS, "at": now_ms()}
            u["lastLogin"] = now_ms()
            ST.save_sessions()
            ST.save_users()
        self._cookie = f"dp_session={tok}; Path=/; HttpOnly; SameSite=Lax; Max-Age={SESSION_MS // 1000}"

    def require(self, role="user"):
        if not self.user:
            raise ApiError(401, "login_required")
        if role == "admin" and self.user["role"] != "admin":
            raise ApiError(403, "forbidden")

    def too_many_fails(self):
        ip = self.client_address[0]
        t = time.time()
        FAILS[ip] = [x for x in FAILS.get(ip, []) if t - x < 600]
        return len(FAILS[ip]) >= 10

    def add_fail(self):
        FAILS.setdefault(self.client_address[0], []).append(time.time())

    # ---------- entrée ----------
    def do_HEAD(self):
        self.dispatch("GET")

    def do_GET(self):
        self.dispatch("GET")

    def do_POST(self):
        self.dispatch("POST")

    def do_PUT(self):
        self.dispatch("PUT")

    def do_DELETE(self):
        self.dispatch("DELETE")

    def dispatch(self, method):
        try:
            self.load_user()
            url = urllib.parse.urlsplit(self.path)
            path = urllib.parse.unquote(url.path)
            query = {k: v[0] for k, v in urllib.parse.parse_qs(url.query).items()}
            if path.startswith("/api/"):
                if method != "GET" and self.headers.get("X-DP") != "1":
                    raise ApiError(403, "csrf")
                return self.api(method, path, query)
            if method != "GET":
                raise ApiError(405, "method")
            return self.static(path, query)
        except ApiError as e:
            self.send_json({"error": e.code}, e.status)
        except (BrokenPipeError, ConnectionResetError):
            pass
        except Exception as e:  # noqa: BLE001
            sys.stdout.write(f"  ! {method} {self.path} : {e!r}\n")
            try:
                self.send_json({"error": "server_error", "detail": str(e)}, 500)
            except OSError:
                pass

    # ---------- fichiers statiques ----------
    def static(self, path, query):
        if path in ("/", "/index.html"):
            return self.serve_file(os.path.join(HUB, "index.html"))
        if path.startswith("/hub/"):
            f = safe_path(HUB, path[5:])
            return self.serve_file(f) if f else self.send_text(404, "Not found")
        if path == "/studio":
            return self.send_bytes(302, b"", extra={"Location": "/studio/"})
        if path.startswith("/studio/"):
            f = safe_path(STUDIO, path[8:])
            return self.serve_file(f) if f else self.send_text(404, "Not found")
        if path in ("/shared/md.js", "/shared/catalog.js"):
            return self.serve_file(os.path.join(STUDIO, "assets", "js", path[8:]))
        if path in ("/favicon.ico", "/icon.svg"):
            return self.serve_file(os.path.join(VIEWER, "icon.svg"))
        m = re.match(r"^/g/([^/]+)(/.*)?$", path)
        if m:
            slug, rest = m.group(1), m.group(2)
            if not RE_SLUG.match(slug):
                return self.send_text(404, "Not found")
            if rest is None:
                return self.send_bytes(302, b"", extra={"Location": f"/g/{slug}/"})
            return self.portal_static(slug, rest, query)
        return self.send_text(404, "Not found")

    def portal_static(self, slug, rest, query):
        if rest == "/data/site.json":
            with LOCK:
                p = ST.portal(slug)
            if not p:
                return self.send_json({"error": "not_found"}, 404)
            can_preview = self.user and (self.user["id"] == p["ownerId"] or self.user["role"] == "admin")
            live, pend = portal_dir(slug, "site.json"), portal_dir(slug, "pending.json")
            if query.get("preview") and can_preview:
                for f in (pend, live):
                    if os.path.exists(f):
                        return self.serve_file(f, "no-store")
            if p.get("live") and os.path.exists(live):
                return self.serve_file(live, "no-cache")
            return self.send_json({"error": "not_found"}, 404)
        if rest.startswith("/data/media/"):
            name = rest[len("/data/media/"):]
            f = portal_dir(slug, "media", name)
            if RE_FILE.match(name) and os.path.isfile(f):
                return self.serve_file(f, "public, max-age=31536000, immutable", csp=MEDIA_CSP)
            return self.send_text(404, "Not found")
        f = safe_path(VIEWER, rest)
        return self.serve_file(f) if f else self.send_text(404, "Not found")

    # ---------- API ----------
    def api(self, method, path, q):
        for m_, pattern, fn in ROUTES:
            if m_ != method:
                continue
            mt = re.match(pattern + "$", path)
            if mt:
                return fn(self, *mt.groups(), q=q)
        raise ApiError(404, "unknown_api")

    # --- authentification
    def a_ping(self, q):
        self.send_text(200, "devportals")

    def a_state(self, q):
        with LOCK:
            setup = not ST.users
            cfg = dict(ST.config)
        self.send_json({"user": public_user(self.user, True), "setupNeeded": setup, "canSetup": setup and self.is_local(),
                        "allowRegistration": cfg["allowRegistration"], "requireApproval": cfg["requireApproval"], "hubName": cfg["hubName"]})

    def a_setup(self, q):
        body = self.json_body()
        with LOCK:
            if ST.users:
                raise ApiError(409, "setup_done")
            if not self.is_local():
                raise ApiError(403, "setup_local_only")
            acc, err = validate_account(body)
            if err:
                raise ApiError(400, err)
            u = new_user(acc["username"], acc["displayName"], acc["password"], "admin")
            ST.users.append(u)
            if body.get("hubName"):
                ST.config["hubName"] = str(body["hubName"])[:60]
                ST.save_config()
            ST.save_users()
        self.start_session(u)
        self.send_json({"user": public_user(u, True)})

    def a_register(self, q):
        body = self.json_body()
        if self.too_many_fails():
            raise ApiError(429, "too_many_attempts")
        with LOCK:
            if not ST.users:
                raise ApiError(409, "setup_needed")
            if not ST.config["allowRegistration"]:
                raise ApiError(403, "registration_closed")
            acc, err = validate_account(body)
            if err:
                raise ApiError(400, err)
            if ST.user_by_name(acc["username"]):
                self.add_fail()
                raise ApiError(409, "username_taken")
            u = new_user(acc["username"], acc["displayName"], acc["password"], "user")
            ST.users.append(u)
            ST.save_users()
        self.start_session(u)
        self.send_json({"user": public_user(u, True)})

    def a_login(self, q):
        body = self.json_body()
        if self.too_many_fails():
            raise ApiError(429, "too_many_attempts")
        with LOCK:
            u = ST.user_by_name(str(body.get("username", "")).strip())
        if not u:
            dummy_check()
            self.add_fail()
            raise ApiError(401, "bad_credentials")
        if not check_password(str(body.get("password", "")), u["password"]):
            self.add_fail()
            raise ApiError(401, "bad_credentials")
        if u.get("disabled"):
            raise ApiError(403, "account_disabled")
        self.start_session(u)
        self.send_json({"user": public_user(u, True)})

    def a_logout(self, q):
        if self._sess_key:
            with LOCK:
                ST.sessions.pop(self._sess_key, None)
                ST.save_sessions()
        self._cookie = "dp_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
        self.send_json({"ok": True})

    def a_me(self, q):
        self.require()
        self.send_json({"user": public_user(self.user, True)})

    def a_me_settings(self, q):
        self.require()
        body = self.json_body(64 * 1024)
        with LOCK:
            self.user["settings"] = body
            ST.save_users()
        self.send_json({"ok": True})

    def a_me_profile(self, q):
        self.require()
        body = self.json_body()
        with LOCK:
            if "displayName" in body:
                self.user["displayName"] = str(body["displayName"]).strip()[:40] or self.user["username"]
            if "bio" in body:
                self.user["bio"] = str(body["bio"])[:500]
            ST.save_users()
        self.send_json({"user": public_user(self.user, True)})

    def a_me_password(self, q):
        self.require()
        body = self.json_body()
        if not check_password(str(body.get("current", "")), self.user["password"]):
            raise ApiError(401, "bad_credentials")
        pw = str(body.get("password", ""))
        if not 6 <= len(pw) <= 200:
            raise ApiError(400, "weak_password")
        with LOCK:
            self.user["password"] = hash_password(pw)
            # déconnecte les autres sessions
            ST.sessions = {k: v for k, v in ST.sessions.items() if v["uid"] != self.user["id"] or k == self._sess_key}
            ST.save_users()
            ST.save_sessions()
        self.send_json({"ok": True})

    def a_info(self, q):
        self.require()
        self.send_json({"port": PORT, "urls": lan_urls(PORT), "local": self.is_local()})

    # --- projets
    def proj_path(self, pid):
        if not RE_PID.match(pid):
            raise ApiError(400, "invalid_id")
        return user_dir(self.user["id"], "projets", f"{pid}.json")

    def a_projects(self, q):
        self.require()
        d = user_dir(self.user["id"], "projets")
        out = []
        if os.path.isdir(d):
            for n in os.listdir(d):
                if not n.endswith(".json"):
                    continue
                p = read_json(os.path.join(d, n), None)
                if isinstance(p, dict) and p.get("id"):
                    out.append({"id": p["id"], "name": p.get("name", "?"), "updatedAt": p.get("updatedAt", 0), "createdAt": p.get("createdAt", 0)})
        self.send_json(sorted(out, key=lambda x: -(x["updatedAt"] or 0)))

    def a_project_get(self, pid, q):
        self.require()
        f = self.proj_path(pid)
        if not os.path.isfile(f):
            raise ApiError(404, "not_found")
        self.serve_file(f, "no-store", "application/json; charset=utf-8")

    def a_project_put(self, pid, q):
        self.require()
        f = self.proj_path(pid)
        raw = self.read_body(MAX_JSON)
        try:
            obj = json.loads(raw.decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            raise ApiError(400, "invalid_json")
        if not isinstance(obj, dict) or obj.get("id") != pid:
            raise ApiError(400, "invalid_project")
        if os.path.exists(f):
            vdir = user_dir(self.user["id"], "versions", pid)
            os.makedirs(vdir, exist_ok=True)
            vers = sorted(os.listdir(vdir))
            last = os.path.getmtime(os.path.join(vdir, vers[-1])) if vers else 0
            if time.time() - last > VERSION_EVERY:
                shutil.copy2(f, os.path.join(vdir, datetime.now().strftime("%Y-%m-%d_%H-%M-%S") + ".json"))
                for old in sorted(os.listdir(vdir))[:-KEEP_VERSIONS]:
                    os.remove(os.path.join(vdir, old))
        write_bytes(f, raw)
        self.send_json({"ok": True})

    def a_project_delete(self, pid, q):
        self.require()
        f = self.proj_path(pid)
        uid = self.user["id"]
        dest = os.path.join(TRASH, uid, f"{pid}-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
        os.makedirs(os.path.join(dest, "medias"), exist_ok=True)
        with LOCK:
            if os.path.exists(f):
                shutil.move(f, os.path.join(dest, "projet.json"))
            idx = read_json(user_dir(uid, "medias.json"), {})
            gone = {k: v for k, v in idx.items() if v.get("projectId") == pid}
            for mid, meta in gone.items():
                src = user_dir(uid, "medias", f"{mid}.{meta['ext']}")
                if os.path.exists(src):
                    shutil.move(src, os.path.join(dest, "medias", os.path.basename(src)))
                idx.pop(mid, None)
            write_json(os.path.join(dest, "medias.json"), gone)
            write_json(user_dir(uid, "medias.json"), idx)
            p = ST.portal_of(uid, pid)
            if p:
                remove_portal_files(p)
                p.update({"live": False, "hasPending": False, "review": {"decision": "withdrawn", "note": "", "at": now_ms(), "by": uid}})
                ST.save_portals()
        self.send_json({"ok": True})

    def a_versions(self, pid, q):
        self.require()
        self.proj_path(pid)
        vdir = user_dir(self.user["id"], "versions", pid)
        items = []
        if os.path.isdir(vdir):
            for n in os.listdir(vdir):
                fp = os.path.join(vdir, n)
                items.append({"name": n, "size": os.path.getsize(fp), "time": int(os.path.getmtime(fp) * 1000)})
        self.send_json(sorted(items, key=lambda x: -x["time"]))

    def a_version_restore(self, pid, name, q):
        self.require()
        f = self.proj_path(pid)
        src = user_dir(self.user["id"], "versions", pid, name)
        if not RE_VERSION.match(name) or not os.path.isfile(src):
            raise ApiError(404, "not_found")
        if os.path.exists(f):  # garde l'état actuel avant de le remplacer
            shutil.copy2(f, user_dir(self.user["id"], "versions", pid, datetime.now().strftime("%Y-%m-%d_%H-%M-%S") + "-0.json"))
        shutil.copy2(src, f)
        self.send_json({"ok": True})

    # --- médias
    def a_media_upload(self, q):
        self.require()
        mid, pid = q.get("id", ""), q.get("project", "")
        if not RE_MID.match(mid) or not RE_PID.match(pid):
            raise ApiError(400, "invalid_id")
        ctype = (self.headers.get("Content-Type") or "").split(";")[0].strip().lower()
        ext = EXT_BY_MIME.get(ctype)
        if not ext:
            guess = os.path.splitext(q.get("name", ""))[1].lower().lstrip(".")
            ext = guess if guess in MEDIA_EXT else None
            ctype = MIME.get("." + ext, "application/octet-stream") if ext else ctype
        if not ext:
            raise ApiError(415, "unsupported_media")
        data = self.read_body(MAX_UPLOAD)
        uid = self.user["id"]
        write_bytes(user_dir(uid, "medias", f"{mid}.{ext}"), data)
        meta = {"id": mid, "ext": ext, "type": ctype, "kind": "audio" if ctype.startswith("audio/") else "image",
                "name": q.get("name", "")[:120], "size": len(data), "w": int(q.get("w") or 0), "h": int(q.get("h") or 0),
                "projectId": pid, "createdAt": now_ms()}
        with LOCK:
            idx = read_json(user_dir(uid, "medias.json"), {})
            idx[mid] = meta
            write_json(user_dir(uid, "medias.json"), idx)
        self.send_json(meta)

    def a_media_list(self, q):
        self.require()
        pid = q.get("project")
        idx = read_json(user_dir(self.user["id"], "medias.json"), {})
        self.send_json([m for m in idx.values() if not pid or m.get("projectId") == pid])

    def a_media_get(self, mid, q):
        self.require()
        if not RE_MID.match(mid):
            raise ApiError(404, "not_found")
        meta = read_json(user_dir(self.user["id"], "medias.json"), {}).get(mid)
        f = user_dir(self.user["id"], "medias", f"{mid}.{meta['ext']}") if meta else None
        if not f or not os.path.isfile(f):
            raise ApiError(404, "not_found")
        self.serve_file(f, "private, max-age=31536000, immutable", meta["type"], csp=MEDIA_CSP)

    def a_media_delete(self, mid, q):
        self.require()
        if not RE_MID.match(mid):
            raise ApiError(404, "not_found")
        uid = self.user["id"]
        with LOCK:
            idx = read_json(user_dir(uid, "medias.json"), {})
            meta = idx.pop(mid, None)
            if meta:
                f = user_dir(uid, "medias", f"{mid}.{meta['ext']}")
                if os.path.exists(f):
                    os.remove(f)
                write_json(user_dir(uid, "medias.json"), idx)
        self.send_json({"ok": True})

    # --- portails (propriétaire)
    def my_portal(self, pid, create_title=None):
        if not RE_PID.match(pid):
            raise ApiError(400, "invalid_id")
        with LOCK:
            p = ST.portal_of(self.user["id"], pid)
            if not p and create_title is not None:
                if not os.path.exists(self.proj_path(pid)):
                    raise ApiError(404, "not_found")
                p = {"slug": unique_slug(create_title), "projectId": pid, "ownerId": self.user["id"], "live": False, "hasPending": False,
                     "review": None, "featured": False, "meta": {}, "pendingMeta": {}, "createdAt": now_ms(), "updatedAt": now_ms(),
                     "submittedAt": None, "approvedAt": None}
                ST.portals.append(p)
                ST.save_portals()
                os.makedirs(portal_dir(p["slug"], "media"), exist_ok=True)
        return p

    def a_portals_mine(self, q):
        self.require()
        with LOCK:
            self.send_json([portal_view(p) for p in ST.portals if p["ownerId"] == self.user["id"]])

    def a_portal_get(self, pid, q):
        self.require()
        p = self.my_portal(pid)
        with LOCK:
            cfg = dict(ST.config)
        self.send_json({"portal": portal_view(p) if p else None, "requireApproval": cfg["requireApproval"] and self.user["role"] != "admin"})

    def a_portal_prepare(self, pid, q):
        self.require()
        body = self.json_body()
        p = self.my_portal(pid, create_title=str(body.get("title") or "jeu"))
        mdir = portal_dir(p["slug"], "media")
        os.makedirs(mdir, exist_ok=True)
        self.send_json({"portal": portal_view(p), "files": sorted(os.listdir(mdir))})

    def a_portal_file(self, pid, q):
        self.require()
        p = self.my_portal(pid)
        name = q.get("name", "")
        if not p:
            raise ApiError(404, "not_found")
        if not RE_FILE.match(name) or os.path.splitext(name)[1].lower().lstrip(".") not in MEDIA_EXT:
            raise ApiError(400, "invalid_name")
        write_bytes(portal_dir(p["slug"], "media", name), self.read_body(MAX_UPLOAD))
        self.send_json({"ok": True})

    def a_portal_submit(self, pid, q):
        self.require()
        p = self.my_portal(pid)
        if not p:
            raise ApiError(404, "not_found")
        raw = self.read_body(MAX_JSON)
        try:
            site = json.loads(raw.decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            raise ApiError(400, "invalid_json")
        if not isinstance(site, dict) or not isinstance(site.get("site"), dict):
            raise ApiError(400, "invalid_site")
        write_bytes(portal_dir(p["slug"], "pending.json"), raw)
        with LOCK:
            p.update({"pendingMeta": extract_meta(site), "hasPending": True, "submittedAt": now_ms(), "updatedAt": now_ms()})
            auto = self.user["role"] == "admin" or not ST.config["requireApproval"]
            if auto:
                approve_portal(p, self.user["id"], "")
            ST.save_portals()
            out = portal_view(p)
        self.send_json({"portal": out, "published": auto})

    def a_portal_cancel(self, pid, q):
        self.require()
        p = self.my_portal(pid)
        if not p:
            raise ApiError(404, "not_found")
        with LOCK:
            f = portal_dir(p["slug"], "pending.json")
            if os.path.exists(f):
                os.remove(f)
            p.update({"hasPending": False, "updatedAt": now_ms()})
            prune_portal_media(p["slug"])
            ST.save_portals()
            self.send_json({"portal": portal_view(p)})

    def a_portal_unpublish(self, pid, q):
        self.require()
        p = self.my_portal(pid)
        if not p:
            raise ApiError(404, "not_found")
        with LOCK:
            remove_portal_files(p)
            p.update({"live": False, "hasPending": False, "updatedAt": now_ms(), "review": {"decision": "withdrawn", "note": "", "at": now_ms(), "by": self.user["id"]}})
            ST.save_portals()
            self.send_json({"portal": portal_view(p)})

    # --- catalogue public
    def a_hub(self, q):
        with LOCK:
            cfg = dict(ST.config)
            items, creators = [], {}
            for p in ST.portals:
                if not p.get("live"):
                    continue
                owner = ST.user(p["ownerId"])
                if not owner or owner.get("disabled"):
                    continue
                m = p.get("meta") or {}
                items.append({"slug": p["slug"], "url": f"/g/{p['slug']}/", "title": m.get("title", p["slug"]), "tagline": m.get("tagline", ""),
                              "genres": m.get("genres", []), "styles": m.get("styles", []), "tags": m.get("tags", []), "stage": m.get("stage", ""),
                              "modes": m.get("modes", []), "platformList": m.get("platformList", []), "ownerUser": owner["username"],
                              "platforms": m.get("platforms", ""), "genreText": m.get("genreText", ""), "counts": m.get("counts", {}),
                              "cover": f"/g/{p['slug']}/{m['cover']}" if m.get("cover") else "", "owner": owner.get("displayName") or owner["username"],
                              "featured": bool(p.get("featured")), "approvedAt": p.get("approvedAt"), "updatedAt": p.get("approvedAt") or p.get("updatedAt")})
                creators[owner["username"]] = {"displayName": owner.get("displayName") or owner["username"], "bio": owner.get("bio", ""),
                                                "since": owner.get("createdAt")}
        self.send_json({"hubName": cfg["hubName"], "hubTagline": cfg["hubTagline"], "allowRegistration": cfg["allowRegistration"],
                        "portals": sorted(items, key=lambda x: -(x["updatedAt"] or 0)), "creators": creators})

    # --- administration
    def admin_portal(self, slug):
        p = ST.portal(slug) if RE_SLUG.match(slug) else None
        if not p:
            raise ApiError(404, "not_found")
        return p

    def a_admin_portals(self, q):
        self.require("admin")
        with LOCK:
            out = [portal_view(p) for p in ST.portals]
        order = {"pending": 0, "live": 1}
        self.send_json(sorted(out, key=lambda x: (order.get(x["status"], 2), -(x["submittedAt"] or x["updatedAt"] or 0))))

    def a_admin_approve(self, slug, q):
        self.require("admin")
        body = self.json_body()
        with LOCK:
            p = self.admin_portal(slug)
            if not p.get("hasPending"):
                raise ApiError(409, "nothing_pending")
            approve_portal(p, self.user["id"], str(body.get("note", ""))[:1000])
            ST.save_portals()
            self.send_json({"portal": portal_view(p)})

    def a_admin_reject(self, slug, q):
        self.require("admin")
        body = self.json_body()
        with LOCK:
            p = self.admin_portal(slug)
            f = portal_dir(slug, "pending.json")
            if os.path.exists(f):
                os.remove(f)
            p.update({"hasPending": False, "updatedAt": now_ms(), "review": {"decision": "rejected", "note": str(body.get("note", ""))[:1000], "at": now_ms(), "by": self.user["id"]}})
            prune_portal_media(slug)
            ST.save_portals()
            self.send_json({"portal": portal_view(p)})

    def a_admin_unpublish(self, slug, q):
        self.require("admin")
        body = self.json_body()
        with LOCK:
            p = self.admin_portal(slug)
            remove_portal_files(p)
            p.update({"live": False, "hasPending": False, "updatedAt": now_ms(), "review": {"decision": "removed", "note": str(body.get("note", ""))[:1000], "at": now_ms(), "by": self.user["id"]}})
            ST.save_portals()
            self.send_json({"portal": portal_view(p)})

    def a_admin_feature(self, slug, q):
        self.require("admin")
        body = self.json_body()
        with LOCK:
            p = self.admin_portal(slug)
            p["featured"] = bool(body.get("featured"))
            ST.save_portals()
            self.send_json({"portal": portal_view(p)})

    def a_admin_users(self, q):
        self.require("admin")
        with LOCK:
            out = []
            for u in ST.users:
                d = user_dir(u["id"], "projets")
                n = len([x for x in os.listdir(d) if x.endswith(".json")]) if os.path.isdir(d) else 0
                out.append({**public_user(u), "disabled": bool(u.get("disabled")), "lastLogin": u.get("lastLogin"), "projects": n,
                            "portals": len([p for p in ST.portals if p["ownerId"] == u["id"] and p.get("live")])})
        self.send_json(out)

    def a_admin_user_create(self, q):
        self.require("admin")
        body = self.json_body()
        acc, err = validate_account(body)
        if err:
            raise ApiError(400, err)
        with LOCK:
            if ST.user_by_name(acc["username"]):
                raise ApiError(409, "username_taken")
            u = new_user(acc["username"], acc["displayName"], acc["password"], "admin" if body.get("role") == "admin" else "user")
            ST.users.append(u)
            ST.save_users()
        self.send_json({"user": public_user(u)})

    def a_admin_user_update(self, uid, q):
        self.require("admin")
        body = self.json_body()
        with LOCK:
            u = ST.user(uid)
            if not u:
                raise ApiError(404, "not_found")
            admins = [x for x in ST.users if x["role"] == "admin" and not x.get("disabled")]
            if "role" in body and body["role"] in ("admin", "user"):
                if u["role"] == "admin" and body["role"] == "user" and len(admins) <= 1:
                    raise ApiError(409, "last_admin")
                u["role"] = body["role"]
            if "disabled" in body:
                if u["id"] == self.user["id"]:
                    raise ApiError(409, "cannot_disable_self")
                u["disabled"] = bool(body["disabled"])
                if u["disabled"]:
                    ST.sessions = {k: v for k, v in ST.sessions.items() if v["uid"] != uid}
                    ST.save_sessions()
            if body.get("displayName"):
                u["displayName"] = str(body["displayName"]).strip()[:40]
            if body.get("password"):
                pw = str(body["password"])
                if not 6 <= len(pw) <= 200:
                    raise ApiError(400, "weak_password")
                u["password"] = hash_password(pw)
            ST.save_users()
            self.send_json({"user": public_user(u)})

    def a_admin_user_delete(self, uid, q):
        self.require("admin")
        with LOCK:
            u = ST.user(uid)
            if not u:
                raise ApiError(404, "not_found")
            if u["id"] == self.user["id"]:
                raise ApiError(409, "cannot_delete_self")
            stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
            dest = os.path.join(TRASH, f"compte-{u['username']}-{stamp}")
            os.makedirs(dest, exist_ok=True)
            if os.path.isdir(user_dir(uid)):
                shutil.move(user_dir(uid), os.path.join(dest, "compte"))
            for p in [p for p in ST.portals if p["ownerId"] == uid]:
                if os.path.isdir(portal_dir(p["slug"])):
                    shutil.move(portal_dir(p["slug"]), os.path.join(dest, f"portail-{p['slug']}"))
                ST.portals.remove(p)
            write_json(os.path.join(dest, "utilisateur.json"), u)
            ST.users.remove(u)
            ST.sessions = {k: v for k, v in ST.sessions.items() if v["uid"] != uid}
            ST.save_users()
            ST.save_portals()
            ST.save_sessions()
        self.send_json({"ok": True})

    def a_admin_config(self, q):
        self.require("admin")
        with LOCK:
            self.send_json({**ST.config, "dataDir": DATA})

    def a_admin_config_set(self, q):
        self.require("admin")
        body = self.json_body()
        with LOCK:
            if "hubName" in body:
                ST.config["hubName"] = str(body["hubName"]).strip()[:60] or "DevPortals"
            if "hubTagline" in body:
                ST.config["hubTagline"] = str(body["hubTagline"])[:300]
            for k in ("allowRegistration", "requireApproval"):
                if k in body:
                    ST.config[k] = bool(body[k])
            ST.save_config()
            self.send_json(dict(ST.config))

    def a_admin_open(self, q):
        self.require("admin")
        if not self.is_local():
            raise ApiError(403, "local_only")
        try:
            if sys.platform.startswith("win"):
                os.startfile(DATA)  # type: ignore[attr-defined]
            elif sys.platform == "darwin":
                subprocess.Popen(["open", DATA])
            else:
                subprocess.Popen(["xdg-open", DATA])
        except OSError as e:
            raise ApiError(500, str(e))
        self.send_json({"ok": True})


P_PID = r"(prj_[a-z0-9]{4,60})"
ROUTES = [
    ("GET", r"/api/ping", Handler.a_ping),
    ("GET", r"/api/auth/state", Handler.a_state),
    ("POST", r"/api/auth/setup", Handler.a_setup),
    ("POST", r"/api/auth/register", Handler.a_register),
    ("POST", r"/api/auth/login", Handler.a_login),
    ("POST", r"/api/auth/logout", Handler.a_logout),
    ("GET", r"/api/me", Handler.a_me),
    ("PUT", r"/api/me/settings", Handler.a_me_settings),
    ("POST", r"/api/me/profile", Handler.a_me_profile),
    ("POST", r"/api/me/password", Handler.a_me_password),
    ("GET", r"/api/info", Handler.a_info),
    ("GET", r"/api/projects", Handler.a_projects),
    ("GET", rf"/api/projects/{P_PID}", Handler.a_project_get),
    ("PUT", rf"/api/projects/{P_PID}", Handler.a_project_put),
    ("DELETE", rf"/api/projects/{P_PID}", Handler.a_project_delete),
    ("GET", rf"/api/projects/{P_PID}/versions", Handler.a_versions),
    ("POST", rf"/api/projects/{P_PID}/versions/([0-9_\-]+\.json)/restore", Handler.a_version_restore),
    ("POST", r"/api/media", Handler.a_media_upload),
    ("GET", r"/api/media", Handler.a_media_list),
    ("GET", r"/api/media/([a-z0-9_]+)", Handler.a_media_get),
    ("DELETE", r"/api/media/([a-z0-9_]+)", Handler.a_media_delete),
    ("GET", r"/api/portals/mine", Handler.a_portals_mine),
    ("GET", rf"/api/portals/{P_PID}", Handler.a_portal_get),
    ("POST", rf"/api/portals/{P_PID}/prepare", Handler.a_portal_prepare),
    ("POST", rf"/api/portals/{P_PID}/files", Handler.a_portal_file),
    ("POST", rf"/api/portals/{P_PID}/submit", Handler.a_portal_submit),
    ("POST", rf"/api/portals/{P_PID}/cancel", Handler.a_portal_cancel),
    ("POST", rf"/api/portals/{P_PID}/unpublish", Handler.a_portal_unpublish),
    ("GET", r"/api/hub", Handler.a_hub),
    ("GET", r"/api/admin/portals", Handler.a_admin_portals),
    ("POST", r"/api/admin/portals/([a-z0-9-]+)/approve", Handler.a_admin_approve),
    ("POST", r"/api/admin/portals/([a-z0-9-]+)/reject", Handler.a_admin_reject),
    ("POST", r"/api/admin/portals/([a-z0-9-]+)/unpublish", Handler.a_admin_unpublish),
    ("POST", r"/api/admin/portals/([a-z0-9-]+)/feature", Handler.a_admin_feature),
    ("GET", r"/api/admin/users", Handler.a_admin_users),
    ("POST", r"/api/admin/users", Handler.a_admin_user_create),
    ("POST", r"/api/admin/users/(usr_[a-f0-9]{8,32})", Handler.a_admin_user_update),
    ("DELETE", r"/api/admin/users/(usr_[a-f0-9]{8,32})", Handler.a_admin_user_delete),
    ("GET", r"/api/admin/config", Handler.a_admin_config),
    ("POST", r"/api/admin/config", Handler.a_admin_config_set),
    ("POST", r"/api/admin/open-folder", Handler.a_admin_open),
]


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


def reset_password(username):
    global ST
    ST = State()
    u = ST.user_by_name(username)
    if not u:
        print(f"Compte « {username} » introuvable. Comptes existants : {', '.join(x['username'] for x in ST.users) or '(aucun)'}")
        sys.exit(1)
    pw = getpass.getpass(f"Nouveau mot de passe pour {u['username']} : ")
    if len(pw) < 6:
        print("Mot de passe trop court (6 caractères minimum).")
        sys.exit(1)
    u["password"] = hash_password(pw)
    u["disabled"] = False
    ST.save_users()
    print("Mot de passe modifié.")


def main():
    global PORT, ST
    ap = argparse.ArgumentParser(description="DevPortals — serveur de la plateforme")
    ap.add_argument("--port", type=int, default=int(os.environ.get("DEVPORTALS_PORT", "8765")))
    ap.add_argument("--no-browser", action="store_true")
    ap.add_argument("--reset-password", metavar="NOM", help="réinitialise le mot de passe d'un compte")
    args = ap.parse_args()
    for d in (DATA, ACCOUNTS, PORTALS, TRASH):
        os.makedirs(d, exist_ok=True)
    if args.reset_password:
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{args.port}/api/ping", timeout=2) as r:
                if r.read().decode() == "devportals":
                    print("Ferme d'abord la fenêtre du serveur DevPortals, puis relance cette commande.")
                    sys.exit(1)
        except OSError:
            pass
        return reset_password(args.reset_password)
    PORT = args.port
    ST = State()
    home = f"http://localhost:{PORT}/"
    try:
        httpd = make_server(PORT)
    except OSError:
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/api/ping", timeout=2) as r:
                if r.read().decode() == "devportals":
                    print(f"DevPortals est déjà lancé. Ouverture de {home}")
                    if not args.no_browser:
                        webbrowser.open(home)
                    return
        except Exception:  # noqa: BLE001
            pass
        print(f"[ERREUR] Le port {PORT} est déjà utilisé par un autre programme. Relance avec --port 8766 (garde ensuite toujours le même port).")
        sys.exit(1)

    print("")
    print("  ==============================================")
    print(f"   DevPortals — serveur actif ({ST.config['hubName']})")
    print("  ==============================================")
    print(f"   Sur ce PC        : {home}")
    for u in lan_urls(PORT):
        print(f"   Sur le réseau    : {u}")
    print(f"   Données          : {DATA}")
    if not ST.users:
        print("   Première utilisation : crée ton compte administrateur dans le navigateur.")
    print("   Laisse cette fenêtre ouverte. Ctrl+C pour arrêter.")
    print("")
    if not args.no_browser:
        webbrowser.open(home)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nArrêt du serveur.")


if __name__ == "__main__":
    main()
