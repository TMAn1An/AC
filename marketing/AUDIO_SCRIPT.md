# Voice-over scripts for ElevenLabs

Three scripts: the vertical ad (English and Bangla) and the client walkthrough (English). Each ad line is timed to its scene in `shital-ad-vertical.mp4` (66.5 s). Read the notes first.

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

## A. Marketing ad, English (about 150 words, 66 seconds)

| Scene | Time | On screen | Voice-over |
| --- | --- | --- | --- |
| 1 | 0:00 to 0:05.5 | AC not cooling? | AC not cooling in the middle of a Dhaka summer? <break time="0.4s" /> The heat will not wait. |
| 2 | 0:05.5 to 0:13.5 | Book a technician in under a minute | Book a technician in under a minute. <break time="0.3s" /> Your phone is verified with a one-time code, so only real requests get through. |
| 3 | 0:13.5 to 0:21.5 | Fixed prices. No surprises. | Prices are fixed before you confirm. No hidden charges. <break time="0.3s" /> If extra work is needed, you decide. |
| 4 | 0:21.5 to 0:30.5 | Watch your technician arrive, live | Then watch your technician arrive, live on the map, with the time they will reach you. |
| 5 | 0:30.5 to 0:37.5 | Every technician is ID verified | Every technician is ID verified. <break time="0.3s" /> National ID checked. Live selfie matched. |
| 6 | 0:37.5 to 0:45 | The job closes only with your code | And the job closes only when you give the technician your code. <break time="0.3s" /> You stay in control. |
| 7 | 0:45 to 0:51 | Pay your way | Pay your way, after the work is done. <break time="0.3s" /> Cash, bKash, Nagad or card. |
| 8 | 0:51 to 0:59.5 | Shop ACs, bags and local cosmetics | Shop air conditioners, bags and local cosmetics in one place. <break time="0.3s" /> Twenty percent off installation, and a one year repair warranty. |
| 9 | 0:59.5 to 1:06.5 | Shital. Cooling, serviced and delivered. | Shital. <break time="0.4s" /> Cooling, serviced and delivered. <break time="0.4s" /> Coming soon on Android. |

## B. Marketing ad, Bangla

Same timing as above. Numbers are written in words to help the voice.

| Scene | Voice-over (Bangla) |
| --- | --- |
| 1 | এসি ঠান্ডা হচ্ছে না? <break time="0.4s" /> ঢাকার গরম তো অপেক্ষা করে না। |
| 2 | এক মিনিটেরও কম সময়ে বুক করুন একজন দক্ষ টেকনিশিয়ান। <break time="0.3s" /> ওটিপি দিয়ে আপনার ফোন নম্বর যাচাই হয়, তাই শুধু আসল অনুরোধই আসে। |
| 3 | দাম আগেই ঠিক করা, কোনো লুকানো খরচ নেই। <break time="0.3s" /> বাড়তি কাজ লাগলে সিদ্ধান্ত আপনার। |
| 4 | তারপর দেখুন আপনার টেকনিশিয়ান কোথায়, লাইভ ম্যাপে, আর কখন পৌঁছাবেন সেটাও। |
| 5 | প্রতিটি টেকনিশিয়ানের পরিচয় যাচাই করা। <break time="0.3s" /> জাতীয় পরিচয়পত্র মিলিয়ে দেখা, লাইভ ছবিও মেলানো। |
| 6 | কাজ শেষ হয় শুধু আপনার দেওয়া কোড দিলেই। <break time="0.3s" /> নিয়ন্ত্রণ সব সময় আপনার হাতে। |
| 7 | কাজ শেষে নিজের পছন্দমতো পেমেন্ট করুন। <break time="0.3s" /> ক্যাশ, বিকাশ, নগদ বা কার্ড। |
| 8 | এসি, ব্যাগ আর দেশি কসমেটিকস, সব এক জায়গায়। <break time="0.3s" /> ইনস্টলেশনে বিশ শতাংশ ছাড়, আর এক বছরের রিপেয়ার ওয়ারেন্টি। |
| 9 | শীতল। <break time="0.4s" /> ঠান্ডা সেবা, ঘরে পৌঁছে। <break time="0.4s" /> খুব শিগগিরই অ্যান্ড্রয়েডে। |

## C. Short versions

15 second teaser (scenes 1, 4, 9): "AC not cooling? Watch your verified technician arrive, live. Shital. Cooling, serviced and delivered."

Bangla: "এসি ঠান্ডা হচ্ছে না? যাচাই করা টেকনিশিয়ানকে লাইভ আসতে দেখুন। শীতল। ঠান্ডা সেবা, ঘরে পৌঁছে।"

## D. Client walkthrough narration, English (`shital-client-walkthrough.mp4`, 4 min 7 s)

Times are approximate. Line them up in your editor against the captions that appear on screen. The video has no sound by default.

| About | Section | Narration |
| --- | --- | --- |
| 0:00 | Intro | This is Shital, one connected system for selling air conditioners, bags and local cosmetics, and for dispatching technicians. Five apps, one live workflow. Everything you will see is running together right now. |
| 0:07 | Booking | A customer books a service. The price is fixed, they pick a time slot and an address, and they pay after the job. <break time="0.5s" /> Before the request goes through, the phone is verified with a one-time code, so fake orders are blocked. |
| 0:25 | Admin sees it | The admin team sees it instantly. A count appears on Bookings and unread items are marked, so nothing is missed. |
| 0:40 | Dispatch | The nearest technicians are ranked by distance. Admin assigns one in a tap. If nobody is close, admin forwards the job to a vendor instead. The customer is told right away, and every step is logged. |
| 0:58 | Technician | The technician gets an offer with a timer. If nobody answers within sixty seconds, the job returns to the queue and admin can reassign it. <break time="0.4s" /> The technician accepts, and the customer and admin see it at once. |
| 1:15 | Live directions | During the trip the technician follows live directions. The customer and admin watch the same trip on the map, and this needs no paid map service. |
| 1:35 | Extra work | If extra work is needed, the technician picks a priced item. There is no office approval to wait for, so nobody rushes. The customer decides in the app, and admin is simply informed. |
| 1:55 | Completion | The job closes only with the customer's code, generated by our backend and shown in the customer app. If the technician's app ever fails, admin can complete or cancel, and the log records exactly where it was done. |
| 2:15 | Reviews | After the job the customer rates the work, behaviour and punctuality. These ratings are private to admin. Technicians and vendors never see them. |
| 2:30 | Wallet | The technician wallet tracks cash and incentive. Cash collected stays on the balance until a deposit is accepted. Admin accepts the deposit, and only then does the cash go to zero. The technician can then withdraw their incentive, and finance pays it out. Every movement is in an auditable ledger. |
| 2:50 | Vendors | For areas without a Shital technician, admin forwards the job to a vendor. Vendors have their own app and see only their own jobs. They assign one of their own technicians, and if they do not reply in fifteen minutes, admin can forward to another vendor. |
| 3:15 | Shop | The customer app is also a shop for air conditioners, bags and local cosmetics. Add to cart or buy now, apply a promo code in one tap, and remove items right in checkout. |
| 3:35 | Courier | Admin packs the order and ships it with a courier partner. Delivery updates are added in one tap and appear in the customer's timeline. No paid courier service is required, and updates can come from the courier automatically later. |
| 3:50 | Control | Staff roles have custom permissions. Technicians are verified before they can work, with national ID photos, a live ID check and a live selfie, and whoever onboards them is responsible. Vendor technicians are visible only to that vendor and to admin. |
| 4:02 | Close | Faster dispatch, fewer surprises, and full accountability, in one live system. |
