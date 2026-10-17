"""A static server for QA that sends the headers in <dir>/_headers (the "/*" block) with every
response, so a sweep sees what Cloudflare would enforce, such as the Content-Security-Policy.
Usage: python3 tools/qa/serve-headers.py <dir> [port]"""
import http.server, os, sys

root = sys.argv[1]
port = int(sys.argv[2]) if len(sys.argv) > 2 else 4430
headers = []
with open(os.path.join(root, '_headers')) as f:
    block = False
    for line in f:
        if not line.startswith(' '):
            block = line.strip() == '/*'
        elif block and ':' in line:
            k, v = line.strip().split(':', 1)
            headers.append((k.strip(), v.strip()))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=root, **kw)
    def end_headers(self):
        for k, v in headers:
            self.send_header(k, v)
        super().end_headers()
    def log_message(self, *a):
        pass

class Server(http.server.ThreadingHTTPServer):
    request_queue_size = 128  # Chrome opens many connections at once; the default backlog (5) resets some

Server(('127.0.0.1', port), Handler).serve_forever()
