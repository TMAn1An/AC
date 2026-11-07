"""Reads the sync markers (top 4 px) out of marketing/out/with-markers.mp4 and rewrites marketing/audio/timeline.json with the exact time
each caption appears in the final video. Run by make-full-video.mjs."""
import glob, json, os, shutil, subprocess
from PIL import Image
tmp = 'marketing/out/mk'; shutil.rmtree(tmp, ignore_errors=True); os.makedirs(tmp)
subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', 'marketing/out/with-markers.mp4', '-vf', 'fps=5,crop=1920:2:0:0,scale=24:1', tmp + '/%05d.png'], check=True)
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
# A section marker is replaced by the caption marker painted in the same instant, so use the next caption's time
items = tl['items']
for k, it in enumerate(items):
    if it['n'] not in seen:
        nxt = next((x for x in items[k + 1:] if x['n'] in seen), None)
        if nxt: it['t'] = round(seen[nxt['n']], 1)
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', 'marketing/out/with-markers.mp4'], capture_output=True, text=True).stdout.strip())
tl['total'] = round(dur, 1)
tl['exact'] = True; tl['missing'] = miss
json.dump(tl, open('marketing/audio/timeline.json', 'w'), indent=1)
print('markers found', len(seen), 'of', len(tl['items']), 'missing', miss)
