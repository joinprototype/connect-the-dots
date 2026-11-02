"""A static server for QA that sends the headers in <dir>/_headers with each response whose path a
block matches ("/*" every one, "/data/*" those under /data/), so a sweep sees what Cloudflare would
enforce, such as the Content-Security-Policy.
Usage: python3 tools/qa/serve-headers.py <dir> [port]"""
import re
import http.server, os, sys

root = sys.argv[1]
port = int(sys.argv[2]) if len(sys.argv) > 2 else 4430
rules = []  # (path prefix, [(header, value)])
with open(os.path.join(root, '_headers')) as f:
    for line in f:
        if line.strip() and not line.startswith(' '):
            rules.append((line.strip().rstrip('*'), []))
        elif rules and ':' in line:
            k, v = line.strip().split(':', 1)
            rules[-1][1].append((k.strip(), v.strip()))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=root, **kw)
    def translate_path(self, path):
        # the host's rewrite in _redirects: every entry's generated story is one page
        return super().translate_path(re.sub(r'^/e/[^/]+/story/?$', '/e/_life/', path.split('?')[0]))
    def end_headers(self):
        for prefix, headers in rules:
            if self.path.startswith(prefix):
                for k, v in headers:
                    self.send_header(k, v)
        super().end_headers()
    def log_message(self, *a):
        pass

class Server(http.server.ThreadingHTTPServer):
    request_queue_size = 128  # Chrome opens many connections at once; the default backlog (5) resets some

Server(('127.0.0.1', port), Handler).serve_forever()
