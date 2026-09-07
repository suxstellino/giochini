"""Server statico locale che disabilita la cache del browser, cosi' durante lo
sviluppo ogni modifica ai file e' visibile subito con un semplice refresh.
Per giocare normalmente basta invece `python -m http.server` (vedi README)."""
import http.server
import os
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        # Ignora le richieste condizionali del browser: senza questo, SimpleHTTPRequestHandler
        # puo' rispondere 304 usando una copia in cache anche dopo una modifica del file.
        for h in ('If-Modified-Since', 'If-None-Match'):
            if h in self.headers:
                del self.headers[h]
        return super().send_head()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        super().end_headers()


if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    with http.server.ThreadingHTTPServer(('', port), NoCacheHandler) as httpd:
        print(f'Serving (no-cache) on port {port}')
        httpd.serve_forever()
