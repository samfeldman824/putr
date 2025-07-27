import json
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, unquote
from pathlib import Path

from database import init_db, load_all, load_player


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith('/api/players'):
            data = load_all()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps(data).encode('utf-8'))
        elif self.path.startswith('/api/player'):
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query)
            name = params.get('name', [None])[0]
            if name:
                player = load_player(unquote(name))
                if player is not None:
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps(player).encode('utf-8'))
                    return
            self.send_response(404)
            self.end_headers()
        else:
            super().do_GET()


def run(host='0.0.0.0', port=8000):
    init_db()
    server = HTTPServer((host, port), Handler)
    print(f'Serving on {host}:{port}...')
    server.serve_forever()


if __name__ == '__main__':
    run()
