# Voice-over scripts for ElevenLabs

Two videos, three scripts. Pick the script that matches the video.

| Video | Length | Script | Language |
| --- | --- | --- | --- |
| `shital-ad-vertical.mp4` (marketing ad for social media) | 66 s | `audio/1-ad-vertical-english.md` | English |
| `shital-ad-vertical.mp4` (the same ad) | 66 s | `audio/2-ad-vertical-bangla.md` | Bangla |
| `shital-client-walkthrough.mp4` (presentation to the client) | 4 min 7 s | `audio/3-client-walkthrough-english.md` | English |
| `shital-client-walkthrough.mp4` (the same video) | 4 min 7 s | `audio/4-client-walkthrough-bangla.md` | Bangla |

Scripts 1 and 2 are the same ad in two languages, and scripts 3 and 4 are the same client video in two languages, so use one of each pair.

## How to generate the audio

1. In ElevenLabs choose a warm, confident, clear voice. For Bangla use the multilingual model and listen to a test line before the full script, because pronunciation of brand names and numbers can need small spelling tweaks.
2. Suggested settings, then adjust by ear: stability 45 to 55, similarity 75, style 20 to 30, speed 1.0. Generate each scene as its own clip so it is easy to line up.
3. `<break time="0.5s" />` adds a pause. Remove the tags if your model version ignores them.
4. Brand name: write it as "Shital" in English. In Bangla the text below spells it phonetically.
5. Keep each clip no longer than its scene length. If a clip is longer, raise the speed a little or trim a word. If shorter, leave the gap, a pause reads fine.
6. Join the audio to the video (drop your final mix in `vo.mp3`):

```bash
ffmpeg -i marketing/shital-ad-vertical.mp4 -i vo.mp3 -map 0:v -map 1:a -c:v copy -c:a aac -shortest ad-with-voice.mp4
```

Add quiet royalty-free background music at about 15 to 20 percent of the voice volume if you like.
