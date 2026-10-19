"""
Markdown to HTML Preview Generator & Dev Server
Usage:
    uv run --with markdown --with python-frontmatter python __noe-shiftica/Post/preview.py
"""

import sys
import os
import re
import socket
from pathlib import Path
import frontmatter
import markdown
import http.server
import socketserver
import webbrowser

POST_DIR = Path(__file__).parent.resolve()
MD_FILE = POST_DIR / "how-to-make-ai-your-best-counsel.md"
HTML_FILE = POST_DIR / "how-to-make-ai-your-best-counsel.preview.html"

def convert_tables_in_divs(content: str) -> str:
    """
    HTMLブロックタグ（<div class="table-scroll__inner">など）の中に
    生のMarkdownテーブルが書かれている場合、標準のmarkdownパーサーが無視してしまうため、
    該当するテーブル部分をあらかじめHTMLの<table>に変換する。
    """
    def replace_table_match(match):
        inner_content = match.group(1)
        converted = markdown.markdown(inner_content.strip(), extensions=['tables'])
        return f'<div class="table-scroll__inner">\n{converted}\n</div>'

    pattern = re.compile(
        r'<div\s+class=["\']table-scroll__inner["\']\s*>(.*?)</div>',
        re.DOTALL | re.IGNORECASE
    )
    return pattern.sub(replace_table_match, content)

def build_html():
    if not MD_FILE.exists():
        print(f"Error: {MD_FILE} not found")
        return None
    
    post = frontmatter.load(str(MD_FILE))
    raw_content = post.content

    # 1. 冒頭の <svg> ... </svg> 定義ブロック（シンボル定義）を抽出
    svg_defs = ""
    svg_match = re.search(r'<svg[\s\S]*?</svg>', raw_content, flags=re.IGNORECASE)
    if svg_match:
        svg_defs = svg_match.group(0)
        # Markdown本文からは除去して、HTMLの<body>直下にクリーンに配置する
        raw_content = raw_content[:svg_match.start()] + raw_content[svg_match.end():]

    # 2. <div> 内のMarkdownテーブルを先行してHTML変換
    content_with_tables = convert_tables_in_divs(raw_content)

    # 3. Markdown全体をHTML変換
    md = markdown.Markdown(extensions=['tables', 'fenced_code', 'attr_list'])
    body = md.convert(content_with_tables)

    # 4. <body>の先頭にSVGシンボル定義を完全な生HTMLとして挿入
    if svg_defs:
        body = f"{svg_defs}\n{body}"
    
    title = post.get('title', 'Markdown Preview')
    
    html_template = f"""<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
</head>
<body>
{body}
</body>
</html>"""

    HTML_FILE.write_text(html_template, encoding='utf-8')
    print(f"✅ HTML generated: {HTML_FILE.name}")
    return HTML_FILE

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(POST_DIR.parent.parent), **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

def find_free_port(start_port=5173, max_attempts=50):
    for p in range(start_port, start_port + max_attempts):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('127.0.0.1', p))
                return p
            except OSError:
                continue
    return start_port

def serve():
    build_html()
    port = find_free_port(5173)
    url = f"http://127.0.0.1:{port}/__noe-shiftica/Post/{HTML_FILE.name}"
    
    print(f"\n🚀 Preview server running at:\n   {url}\n")
    print("Press Ctrl+C to stop the server.\n")
    
    try:
        webbrowser.open(url)
    except Exception:
        pass

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", port), CustomHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--build-only":
        build_html()
    else:
        serve()
