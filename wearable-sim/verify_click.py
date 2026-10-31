#!/usr/bin/env python3
"""Tes klik mouse nyata pada tombol Bantuan (+cincin) dan Jadwal, plus screenshot opsional.

Pakai:  python3 verify_click.py
Opsi env: SHOT_DIR=shots   simpan screenshot desktop & mobile
          THREE_DIR=path   pakai three r128 lokal (folder paket npm `three`) alih-alih CDN
Butuh:   pip install playwright && playwright install chromium
"""
import functools
import http.server
import json
import os
import socketserver
import sys
import threading

from playwright.sync_api import sync_playwright

ROOT = os.environ.get("SITE_DIR") or os.path.dirname(os.path.abspath(__file__))
THREE_DIR = os.environ.get("THREE_DIR")
SHOT_DIR = os.environ.get("SHOT_DIR")

BANTUAN = (-1.2, 1.3, 1.6)
JADWAL = (1.0, 1.3, -1.35)
RADIUS_BANTUAN = 1.0
HALF_JADWAL = 0.8
STEP = 0.27

PATIENTS = [{"id": 1, "name": "Pasien Uji", "room_number": "A1", "device_id": 1}]
PATIENT = {"todayTasks": []}


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a):
        pass


def serve():
    handler = functools.partial(Quiet, directory=ROOT)
    srv = socketserver.TCPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, srv.server_address[1]


def cdn(route):
    url = route.request.url
    if THREE_DIR and "three@0.128.0/" in url:
        rel = url.split("three@0.128.0/", 1)[1]
        path = os.path.join(THREE_DIR, rel)
        if os.path.exists(path):
            route.fulfill(path=path, content_type="application/javascript")
            return
    route.continue_()


def api(route):
    path = route.request.url.split("/api", 1)[1].rstrip("/")
    if path == "/patients":
        body = PATIENTS
    elif path.startswith("/patients/"):
        body = PATIENT
    else:
        route.fulfill(status=404, body="", headers={"Access-Control-Allow-Origin": "*"})
        return
    route.fulfill(status=200, content_type="application/json", body=json.dumps(body),
                  headers={"Access-Control-Allow-Origin": "*"})


def grid(c, radius=None, half=None):
    pts = []
    n = int(1.2 / STEP) + 1
    for i in range(-n, n + 1):
        for j in range(-n, n + 1):
            dx, dz = i * STEP, j * STEP
            if radius is not None and (dx * dx + dz * dz) ** 0.5 > radius:
                continue
            if half is not None and (abs(dx) > half or abs(dz) > half):
                continue
            pts.append((c[0] + dx, c[1], c[2] + dz))
    return pts


FREEZE = """() => {
  if (typeof rotOn !== 'undefined') rotOn = false;
  O.autoRotate = false;
  camTo = null; if (typeof tgtTo !== 'undefined') tgtTo = null;
  window.__press = [];
  Bus.on('press', k => window.__press.push(k));
  window.__cam = C.position.clone(); window.__tgt = O.target.clone();
}"""

RESET = """() => {
  try { helpEnd(); } catch (e) {}
  try { hide(); } catch (e) {}
  camTo = null; if (typeof tgtTo !== 'undefined') tgtTo = null;
  O.autoRotate = false;
  C.position.copy(window.__cam); O.target.copy(window.__tgt); O.update(); C.updateMatrixWorld();
  window.__press = [];
}"""

PROJECT = """(p) => {
  C.updateMatrixWorld();
  const r = cv.getBoundingClientRect(), v = new THREE.Vector3(p[0], p[1], p[2]).project(C);
  return [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height];
}"""


def click_all(page, points, want):
    ok = 0
    for p in points:
        x, y = page.evaluate(PROJECT, list(p))
        page.mouse.move(x, y)
        page.mouse.down()
        page.wait_for_timeout(250)
        page.mouse.up()
        page.wait_for_timeout(60)
        if want in page.evaluate("() => window.__press"):
            ok += 1
        page.evaluate(RESET)
    return ok, len(points)


def shots(browser, base):
    os.makedirs(SHOT_DIR, exist_ok=True)
    for name, vp in (("desktop", (1440, 800)), ("mobile", (390, 844))):
        pg = browser.new_page(viewport={"width": vp[0], "height": vp[1]})
        pg.route("https://cdn.jsdelivr.net/**", cdn)
        pg.route("http://localhost:4000/api/**", api)
        pg.on("dialog", lambda d: d.dismiss())
        pg.goto(base, wait_until="load")
        pg.wait_for_timeout(4000)
        pg.screenshot(path=os.path.join(SHOT_DIR, name + ".png"))
        pg.close()


def main():
    srv, port = serve()
    base = "http://127.0.0.1:%d/index.html" % port
    errors = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader",
                                           "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        page = browser.new_page(viewport={"width": 1440, "height": 800})
        page.route("https://cdn.jsdelivr.net/**", cdn)
        page.route("http://localhost:4000/api/**", api)
        page.on("dialog", lambda d: d.dismiss())
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(base, wait_until="load")
        page.wait_for_timeout(2500)
        page.evaluate(FREEZE)
        page.wait_for_timeout(500)

        b_ok, b_n = click_all(page, grid(BANTUAN, radius=RADIUS_BANTUAN), "bantuan")
        j_ok, j_n = click_all(page, grid(JADWAL, half=HALF_JADWAL), "jadwal")
        print("Bantuan %d/%d" % (b_ok, b_n))
        print("Jadwal %d/%d" % (j_ok, j_n))

        page.wait_for_timeout(300)
        if SHOT_DIR:
            shots(browser, base)
        browser.close()
    srv.shutdown()

    for e in errors:
        print("pageerror:", e)
    passed = b_ok == b_n and j_ok == j_n and not errors
    print("HASIL:", "LOLOS" if passed else "GAGAL")
    sys.exit(0 if passed else 1)


if __name__ == "__main__":
    main()
