# Intentionally vulnerable demo target (SSRF + exposed .git/config). LAB USE ONLY.
from flask import Flask, request, Response
import urllib.request, urllib.parse, ipaddress, socket
app = Flask(__name__)
GIT_CONFIG = "[core]\n\trepositoryformatversion = 0\n[remote \"origin\"]\n\turl = http://git.lab:80/app.git\n\t# internal redis cache: redis.lab:6379\n"

@app.get("/")
def index(): return "SpiceHub demo app (lab)"

@app.get("/.git/config")
def git_config(): return Response(GIT_CONFIG, mimetype="text/plain")

@app.get("/fetch")
def fetch():  # SSRF by design; limited to http/https
    u = request.args.get("u", "")
    p = urllib.parse.urlparse(u)
    if p.scheme not in ("http", "https"): return "bad scheme", 400
    try:
        with urllib.request.urlopen(u, timeout=3) as r: return Response(r.read(2048), mimetype="text/plain")
    except Exception as e: return f"error: {e.__class__.__name__}", 502

if __name__ == "__main__": app.run(host="0.0.0.0", port=8080)
