"""Reads the sync markers (top 4 px) out of marketing/out/with-markers.mp4 and rewrites marketing/audio/timeline.json with the exact time
each caption appears in the final video. Run by make-full-video.mjs."""
import glob, json, os, shutil, subprocess
from PIL import Image
tmp = 'marketing/out/mk'; shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp)
subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', 'marketing/out/with-markers.mp4', '-vf', 'fps=5,crop=1920:4:0:0,scale=24:1', tmp + '/%05d.png'], check=True)
seen = {}
for i, f in enumerate(sorted(glob.glob(tmp + '/*.png'))):
    px = Image.open(f).convert('L'); v = [px.getpixel((x, 0)) for x in (4, 12, 20)]
    d = [round((g - 16) / 32) for g in v]
    if any(x < 0 or x > 7 for x in d): continue
    n = d[0] * 64 + d[1] * 8 + d[2]
    if n and n not in seen: seen[n] = i / 5.0
tl = json.load(open('marketing/audio/timeline.json'))
miss = [it['a'] for it in tl['items'] if it['n'] not in seen]
for it in tl['items']:
    if it['n'] in seen: it['t'] = round(seen[it['n']], 1)
tl['exact'] = True; tl['missing'] = miss
json.dump(tl, open('marketing/audio/timeline.json', 'w'), indent=1)
print('markers found', len(seen), 'of', len(tl['items']), 'missing', miss)
