# Marketing and presentation videos

| File | Use |
| --- | --- |
| `shital-ad-vertical.mp4` | Vertical ad, 1080x1920, 66 seconds, no sound. For Facebook, Instagram, TikTok and YouTube Shorts. Add the voice-over from `AUDIO_SCRIPT.md` |
| `shital-client-walkthrough.mp4` | Client presentation, 1920x1080, about 4 minutes, no sound. Shows the full workflow across all five apps |
| `AUDIO_SCRIPT.md` | Timed voice-over scripts for ElevenLabs (English and Bangla) and narration for the client video |

Both videos are generated from the real prototype, so they can be remade after any change:

```bash
./scripts/serve.sh &                       # serve the prototype on 8080
npm install                                # installs Playwright
npx playwright install chromium            # first time only
node scripts/capture-shots.mjs             # refresh app screens used by the ad
node scripts/make-ad.mjs                   # writes marketing/shital-ad-vertical.mp4
node scripts/make-walkthrough.mjs          # writes marketing/shital-client-walkthrough.mp4
```

FFmpeg must be installed. Edit the captions and timing in `prototype/video/ad.html` and `scripts/make-walkthrough.mjs`. Lighter web versions used by the showcase page live in `prototype/video/`.
