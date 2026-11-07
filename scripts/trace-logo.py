"""Traces the six blades from the client's original artwork into smooth SVG paths (blade geometry only).
Output: scripts/blades-traced.json  [{color, d}] in a 0..100 box, plus bbox info. Run before build-logo.py."""
import cv2, numpy as np, json
im = cv2.imread('prototype/assets/client-logo-original.jpg')
hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
H, S, V = hsv[..., 0].astype(int), hsv[..., 1], hsv[..., 2]
sat = (S > 90) & (V > 60)
masks = {'#2E3192': sat & (H > 110) & (H < 135), '#ED1B24': sat & ((H < 8) | (H > 170)), '#00A74F': sat & (H > 55) & (H < 90)}
allm = np.zeros(S.shape, bool)
for m in masks.values(): allm |= m
ys, xs = np.where(allm); x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
cx, cy = (x0 + x1) / 2, (y0 + y1) / 2; sc = 94 / max(x1 - x0, y1 - y0)
out = []
for col, m in masks.items():
    m8 = cv2.morphologyEx(m.astype(np.uint8) * 255, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    cs, _ = cv2.findContours(m8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    for c in cs:
        if cv2.contourArea(c) < 1500: continue
        eps = 0.0016 * cv2.arcLength(c, True)
        a = cv2.approxPolyDP(c, eps, True)[:, 0, :].astype(float)
        p = [((x - cx) * sc + 50, (y - cy) * sc + 50) for x, y in a]
        out.append({'color': col, 'pts': p, 'cx': float(np.mean([q[0] for q in p])), 'cy': float(np.mean([q[1] for q in p]))})
print(len(out), 'blades', [o['color'] for o in out])
json.dump(out, open('scripts/blades-traced.json', 'w'))
