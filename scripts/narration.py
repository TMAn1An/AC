"""Narration for the full client walkthrough (marketing/new-full-walkthrough.mp4).
Keys are the caption titles used in scripts/make-full-video.mjs. Times come from marketing/audio/timeline.json.
Run: python3 scripts/narration.py   -> writes marketing/audio/5-full-walkthrough-english.md and 6-full-walkthrough-bangla.md"""
import json, re

EN = {
 'Title': "This is NEW. One live system to sell air conditioners, bags and local cosmetics, and to book and dispatch field technicians across Dhaka. There are five apps: customer, technician, vendor, admin on mobile, and the admin web panel. Everything you will see is running together right now.",
 'The customer app': "Let us start with the customer app. It has three sections: air conditioners, bags and local cosmetics. A first-purchase offer is always in view.",
 'Services with fixed prices': "Services have fixed, upfront prices. AC repair, cooling problem, servicing, gas refill, installation and relocation. No haggling and no surprises.",
 'Search, categories and sorting': "In the shop, customers search, open the category menu, and sort from the filter sheet, so the screen stays clean.",
 'Add to cart or Buy now': "Every product has Add to cart and Buy now, and a heart to save it for later. Prices are in plain taka.",
 'Personal history stays on the phone': "Each customer's history, searches, products viewed and orders, is kept on their own phone and nowhere else.",
 'The customer books a service': "Now a real booking. The customer picks a service, a time slot and an address, and pays after the job.",
 'A one-time code verifies the phone': "Before the request goes through, the phone number is verified with a one-time code. Fake orders are stopped before they reach the team.",
 'Admin sees it instantly': "In the admin panel a count appears on Bookings straight away. Unread items are marked, and they turn read once someone opens them.",
 'The nearest technicians are ranked by distance': "Admin opens the booking and sees the nearest technicians ranked by distance. If nobody is close, admin forwards the job to a vendor instead.",
 'Assigned. The customer is told right away.': "One tap assigns the job. The customer is told immediately, and every action is logged with who did it and when.",
 'Live dispatch map': "The live dispatch map shows technicians and vendors together. Technician markers move as they travel, and vendors have a fixed location.",
 'The technician gets an offer with a timer': "On the technician's phone a new job offer arrives with a countdown. If nobody answers in sixty seconds, the job returns to the queue and admin can reassign it.",
 'Accepted. Customer and admin see it at once.': "The technician accepts, and the customer and admin see it at the same moment.",
 'Live directions guide the technician': "On the way, the technician follows live turn-by-turn directions. The customer and admin watch the same trip on the map. This uses open maps, so there is no paid map service.",
 'Extra work: pick a priced item': "If extra work is needed on site, the technician picks a priced item from the list. There is no office approval to wait for, so the job keeps moving.",
 'The customer approves in the app': "The customer decides in their app, and admin is simply informed. Items that are not priced yet are priced by admin or by the vendor.",
 'The job closes only with the customer code': "The job can only be completed with the customer's four digit code. Our backend generates it and the customer app shows it. It is not an SMS.",
 'Completed. Admin can complete, cancel or override any step.': "Job done. And if the technician's app ever fails, admin can complete, cancel or override any step, and the log records exactly where it was done.",
 'Ratings and feedback are private to admin': "After the job the customer rates the work, behaviour and punctuality. These ratings and comments are private to admin. Technicians and vendors never see them.",
 'Customers talk to admin in the app': "Customers can message admin inside the app, and admin replies from the Messages page. Once a booking is confirmed, the customer reaches the technician by phone call or WhatsApp.",
 'The technician wallet': "The technician wallet keeps two numbers: cash to deposit, and incentive earned. Cash collected stays on the balance until a deposit is accepted.",
 'Admin accepts the deposit': "The technician submits a deposit. Admin, or the vendor for their own team, accepts it, and only then does the cash go to zero.",
 'Incentive withdrawal is paid by finance': "Once cash is cleared, the technician can withdraw their incentive. Finance pays it out, and every movement sits in a ledger that can be audited.",
 'No technician nearby? Forward to a vendor': "Where there is no NEW technician nearby, admin forwards the job to a vendor. Vendors have their own app and see only their own jobs, team and earnings.",
 'The vendor assigns one of their own technicians': "The vendor assigns one of their own technicians. If the vendor does not reply in fifteen minutes, admin can forward the job to another vendor.",
 'The admin app does the same on the go': "The admin mobile app does the same work on the go, with Home, Jobs with dispatch, Map, Inbox and More.",
 'Back to the shop': "Back in the customer app, the same shop sells products with courier delivery.",
 'Shop ACs, bags and local cosmetics': "Customers shop air conditioners, bags and local cosmetics. Installation is an optional add-on, with a discount when you buy an AC and a one year repair warranty.",
 'Promo codes apply with one tap': "Checkout is simple. Promo codes apply with one tap, items can be changed or removed right there, and the customer pays with cash on delivery first, then bKash, Nagad or card.",
 'Admin packs and ships with a courier partner': "In Orders, admin packs the order and ships it with a courier partner. Each delivery update is one tap and shows up in the customer's timeline.",
 'No paid courier API required': "No paid courier connection is needed to start. Admin updates the status now, and updates can arrive from the courier automatically later.",
 'The dashboard': "Now the admin web panel, module by module. The dashboard shows bookings, active jobs, revenue and what needs attention, updating live.",
 'Services and prices': "Services and prices are managed here. Admin can add a service, change its price and its time slots, without a developer.",
 'Products': "Products are bought from vendors and sold by NEW. Stock, price and discount are managed in one place.",
 'Categories and promotions': "Categories organise the shop, and promotions create offers and codes. Offers with bKash, Nagad and card providers can be added later.",
 'Customers': "The customers page lists every customer with their bookings and orders.",
 'Technicians and vendors': "Technicians and vendors each have a page. Vendor name, address and phone are stored here, and admin sees every technician.",
 'Payments': "Payments shows every payment by method: cash on delivery, bKash, Nagad and card.",
 'Earnings': "Earnings shows revenue, incentives and vendor commission at a glance.",
 'Staff roles with custom permissions': "Now staff roles. Admin can have many staff, and each person gets a role with its own permissions. Five ready roles are included.",
 'Choose exactly what each role can do': "Admin can also create a new role, such as Support lead, and tick exactly what it may do. Permissions are enforced by the server on every request.",
 'Operations executive': "First, the Operations executive. This role dispatches jobs, overrides statuses, prices extra work, handles orders, technicians and customers. It has no finance access.",
 'Finance': "Next, Finance. This role sees payments, collections, earnings and reviews. It cannot dispatch jobs.",
 'Catalog manager': "The Catalog manager looks after services, products, categories, promotions and orders, and nothing else.",
 'Support agent': "The Support agent handles messages and dispatch, so customers get quick answers.",
 'Super admin': "And the Super admin can do everything, including managing roles. Menus and actions appear only when a role allows them.",
 'Technicians are verified before they can work': "Every technician is verified before they can work. We capture national ID photos, run a live ID check and take a live selfie. Whoever onboards the technician, admin or a vendor, is responsible.",
 'Vendor technicians are visible only to that vendor and admin': "A vendor sees only its own technicians. Admin sees every technician and every assignment.",
 'Close': "That is NEW. Faster dispatch, fewer surprises, and full accountability, in one live system.",
}

BN = {
 'Title': "এটি নিউ। এসি, ব্যাগ ও দেশি কসমেটিকস বিক্রি এবং ঢাকা জুড়ে ফিল্ড টেকনিশিয়ান বুক ও পাঠানোর একটি লাইভ সিস্টেম। এখানে পাঁচটি অ্যাপ আছে: কাস্টমার, টেকনিশিয়ান, ভেন্ডর, মোবাইলে অ্যাডমিন, আর অ্যাডমিন ওয়েব প্যানেল। এখন যা দেখবেন, সবগুলো একসাথে চলছে।",
 'The customer app': "শুরু করি কাস্টমার অ্যাপ দিয়ে। এখানে তিনটি বিভাগ: এসি, ব্যাগ আর দেশি কসমেটিকস। প্রথম কেনাকাটার অফার সবসময় চোখের সামনে থাকে।",
 'Services with fixed prices': "সার্ভিসের দাম আগে থেকেই ঠিক করা। এসি মেরামত, কুলিং সমস্যা, সার্ভিসিং, গ্যাস রিফিল, ইনস্টলেশন আর স্থানান্তর। দর কষাকষি নেই, অপ্রত্যাশিত খরচও নেই।",
 'Search, categories and sorting': "শপে কাস্টমার সার্চ করেন, ক্যাটাগরি মেনু খোলেন, আর ফিল্টার শিট থেকে সাজান। তাই স্ক্রিন পরিষ্কার থাকে।",
 'Add to cart or Buy now': "প্রতিটি পণ্যে কার্টে যোগ করা আর এখনই কেনার বাটন আছে, আর পরে দেখার জন্য একটি হার্ট। দাম সাধারণ টাকায়।",
 'Personal history stays on the phone': "প্রতিটি কাস্টমারের ইতিহাস, মানে সার্চ, দেখা পণ্য আর অর্ডার, শুধু তাঁর নিজের ফোনেই থাকে, অন্য কোথাও নয়।",
 'The customer books a service': "এবার একটি আসল বুকিং। কাস্টমার সার্ভিস, সময় আর ঠিকানা বেছে নেন, আর কাজ শেষে পেমেন্ট করেন।",
 'A one-time code verifies the phone': "অনুরোধ জমা হওয়ার আগে ওটিপি দিয়ে ফোন নম্বর যাচাই হয়। ভুয়া অর্ডার দলের কাছে পৌঁছানোর আগেই আটকে যায়।",
 'Admin sees it instantly': "অ্যাডমিন প্যানেলে বুকিংয়ের ওপর সাথে সাথে একটি সংখ্যা আসে। না-পড়া আইটেম চিহ্নিত থাকে, আর কেউ খুললে পড়া হিসেবে ধরা হয়।",
 'The nearest technicians are ranked by distance': "অ্যাডমিন বুকিং খুললে সবচেয়ে কাছের টেকনিশিয়ানদের দূরত্ব অনুযায়ী সাজানো দেখেন। কাছে কেউ না থাকলে কাজটি ভেন্ডরের কাছে পাঠানো যায়।",
 'Assigned. The customer is told right away.': "এক ট্যাপে কাজ বরাদ্দ হয়। কাস্টমার সাথে সাথে জানতে পারেন, আর প্রতিটি পদক্ষেপ কে কখন করেছেন, তার লগ থাকে।",
 'Live dispatch map': "লাইভ ডিসপ্যাচ ম্যাপে টেকনিশিয়ান আর ভেন্ডর একসাথে দেখা যায়। টেকনিশিয়ানের চিহ্ন চলাচলের সাথে সরে, আর ভেন্ডরের অবস্থান স্থির।",
 'The technician gets an offer with a timer': "টেকনিশিয়ানের ফোনে কাউন্টডাউন সহ নতুন কাজের অফার আসে। ষাট সেকেন্ডে কেউ সাড়া না দিলে কাজটি কিউতে ফিরে যায়, আর অ্যাডমিন আবার বরাদ্দ দিতে পারেন।",
 'Accepted. Customer and admin see it at once.': "টেকনিশিয়ান গ্রহণ করলে কাস্টমার আর অ্যাডমিন একই মুহূর্তে সেটা দেখেন।",
 'Live directions guide the technician': "যাত্রাপথে টেকনিশিয়ান লাইভ বাঁক-বাঁক নির্দেশনা পান। কাস্টমার আর অ্যাডমিন একই যাত্রা ম্যাপে দেখেন। এটি ওপেন ম্যাপ ব্যবহার করে, তাই কোনো পেইড ম্যাপ সেবা লাগে না।",
 'Extra work: pick a priced item': "কাজের জায়গায় বাড়তি কাজ লাগলে টেকনিশিয়ান তালিকা থেকে দামসহ একটি আইটেম বেছে নেন। অফিসের অনুমোদনের অপেক্ষা নেই, তাই কাজ থেমে থাকে না।",
 'The customer approves in the app': "কাস্টমার নিজের অ্যাপে সিদ্ধান্ত নেন, আর অ্যাডমিনকে শুধু জানানো হয়। যে আইটেমের দাম এখনো ঠিক নেই, তার দাম অ্যাডমিন বা ভেন্ডর ঠিক করেন।",
 'The job closes only with the customer code': "কাজ শেষ হয় শুধু কাস্টমারের চার সংখ্যার কোড দিয়ে। কোডটি আমাদের ব্যাকএন্ড বানায় আর কাস্টমার অ্যাপে দেখায়। এটি এসএমএস নয়।",
 'Completed. Admin can complete, cancel or override any step.': "কাজ সম্পন্ন। আর টেকনিশিয়ানের অ্যাপ কখনো কাজ না করলে অ্যাডমিন যেকোনো ধাপ সম্পূর্ণ, বাতিল বা ওভাররাইড করতে পারেন, আর লগে লেখা থাকে ঠিক কোথা থেকে করা হয়েছে।",
 'Ratings and feedback are private to admin': "কাজ শেষে কাস্টমার কাজের মান, আচরণ আর সময়ানুবর্তিতার রেটিং দেন। এই রেটিং আর মন্তব্য শুধু অ্যাডমিনের জন্য। টেকনিশিয়ান বা ভেন্ডর কখনো দেখেন না।",
 'Customers talk to admin in the app': "কাস্টমার অ্যাপের ভেতরেই অ্যাডমিনকে মেসেজ করতে পারেন, আর অ্যাডমিন মেসেজ পেজ থেকে উত্তর দেন। বুকিং নিশ্চিত হলে কাস্টমার ফোন কল বা হোয়াটসঅ্যাপে টেকনিশিয়ানের সাথে কথা বলেন।",
 'The technician wallet': "টেকনিশিয়ানের ওয়ালেটে দুটি সংখ্যা থাকে: জমা দেওয়ার নগদ টাকা, আর অর্জিত ইনসেন্টিভ। সংগ্রহ করা নগদ ততক্ষণ ব্যালেন্সে থাকে, যতক্ষণ জমা গ্রহণ করা না হয়।",
 'Admin accepts the deposit': "টেকনিশিয়ান জমার অনুরোধ পাঠান। অ্যাডমিন, বা নিজের দলের ক্ষেত্রে ভেন্ডর, সেটা গ্রহণ করলে তবেই নগদ শূন্য হয়।",
 'Incentive withdrawal is paid by finance': "নগদ শূন্য হলে টেকনিশিয়ান ইনসেন্টিভ তুলতে পারেন। ফাইন্যান্স সেটা পরিশোধ করে, আর প্রতিটি লেনদেন একটি অডিটযোগ্য খাতায় থাকে।",
 'No technician nearby? Forward to a vendor': "যেখানে কাছে কোনো নিউ টেকনিশিয়ান নেই, সেখানে অ্যাডমিন কাজটি ভেন্ডরের কাছে পাঠান। ভেন্ডরের নিজস্ব অ্যাপ আছে, যেখানে তিনি শুধু নিজের কাজ, দল আর আয় দেখেন।",
 'The vendor assigns one of their own technicians': "ভেন্ডর নিজের একজন টেকনিশিয়ানকে কাজ দেন। ভেন্ডর পনেরো মিনিটে সাড়া না দিলে অ্যাডমিন কাজটি অন্য ভেন্ডরের কাছে পাঠাতে পারেন।",
 'The admin app does the same on the go': "মোবাইলের অ্যাডমিন অ্যাপ চলতি পথেও একই কাজ করে। এতে আছে হোম, ডিসপ্যাচসহ জবস, ম্যাপ, ইনবক্স আর মোর।",
 'Back to the shop': "আবার কাস্টমার অ্যাপে। একই অ্যাপে কুরিয়ার ডেলিভারিসহ পণ্য বিক্রি হয়।",
 'Shop ACs, bags and local cosmetics': "কাস্টমার এসি, ব্যাগ আর দেশি কসমেটিকস কেনেন। ইনস্টলেশন ঐচ্ছিক, এসি কিনলে ছাড় পাওয়া যায়, সাথে এক বছরের মেরামত ওয়ারেন্টি।",
 'Promo codes apply with one tap': "চেকআউট সহজ। প্রোমো কোড এক ট্যাপে লাগে, আইটেম সেখানেই বদলানো বা বাদ দেওয়া যায়, আর প্রথমে ক্যাশ অন ডেলিভারি, পরে বিকাশ, নগদ বা কার্ডে পেমেন্ট করা যায়।",
 'Admin packs and ships with a courier partner': "অর্ডার পেজে অ্যাডমিন অর্ডার প্যাক করে কুরিয়ার পার্টনারের মাধ্যমে পাঠান। প্রতিটি ডেলিভারি আপডেট এক ট্যাপে হয় আর কাস্টমারের টাইমলাইনে দেখা যায়।",
 'No paid courier API required': "শুরুতে কোনো পেইড কুরিয়ার সংযোগ লাগে না। এখন অ্যাডমিন স্ট্যাটাস দেন, আর পরে কুরিয়ারের কাছ থেকে আপডেট নিজে থেকেই আসতে পারে।",
 'The dashboard': "এবার অ্যাডমিন ওয়েব প্যানেল, একেকটি মডিউল ধরে। ড্যাশবোর্ডে বুকিং, চলমান কাজ, আয় আর যেটায় নজর দরকার, সবই লাইভ দেখা যায়।",
 'Services and prices': "সার্ভিস আর দাম এখানে ঠিক করা হয়। অ্যাডমিন নতুন সার্ভিস যোগ করতে, দাম আর সময়ের স্লট বদলাতে পারেন, ডেভেলপার ছাড়াই।",
 'Products': "পণ্য ভেন্ডরদের কাছ থেকে কেনা হয় আর নিউ নিজে বিক্রি করে। স্টক, দাম আর ছাড় এক জায়গা থেকে চলে।",
 'Categories and promotions': "ক্যাটাগরি দিয়ে শপ সাজানো হয়, আর প্রমোশনে অফার ও কোড তৈরি হয়। বিকাশ, নগদ আর কার্ড প্রোভাইডারের অফার পরে যোগ করা যাবে।",
 'Customers': "কাস্টমার পেজে প্রতিটি কাস্টমারের বুকিং আর অর্ডার দেখা যায়।",
 'Technicians and vendors': "টেকনিশিয়ান আর ভেন্ডরের আলাদা পেজ আছে। ভেন্ডরের নাম, ঠিকানা আর ফোন এখানে থাকে, আর অ্যাডমিন সব টেকনিশিয়ান দেখেন।",
 'Payments': "পেমেন্ট পেজে পদ্ধতি অনুযায়ী প্রতিটি পেমেন্ট দেখা যায়: ক্যাশ অন ডেলিভারি, বিকাশ, নগদ আর কার্ড।",
 'Earnings': "আর্নিংসে এক নজরে আয়, ইনসেন্টিভ আর ভেন্ডর কমিশন দেখা যায়।",
 'Staff roles with custom permissions': "এবার স্টাফ রোল। অ্যাডমিনে অনেক স্টাফ থাকতে পারেন, আর প্রত্যেকে নিজস্ব অনুমতিসহ একটি রোল পান। পাঁচটি তৈরি রোল দেওয়া আছে।",
 'Choose exactly what each role can do': "অ্যাডমিন নিজেও নতুন রোল বানাতে পারেন, যেমন সাপোর্ট লিড, আর ঠিক কী কী করতে পারবে তা বেছে নেন। অনুমতি প্রতিটি অনুরোধে সার্ভার যাচাই করে।",
 'Operations executive': "প্রথমে অপারেশনস এক্সিকিউটিভ। এই রোল কাজ বরাদ্দ করে, স্ট্যাটাস ওভাররাইড করে, বাড়তি কাজের দাম ঠিক করে, আর অর্ডার, টেকনিশিয়ান ও কাস্টমার দেখে। ফাইন্যান্সে প্রবেশাধিকার নেই।",
 'Finance': "এরপর ফাইন্যান্স। এই রোল পেমেন্ট, কালেকশন, আর্নিংস আর রিভিউ দেখে। কাজ বরাদ্দ করতে পারে না।",
 'Catalog manager': "ক্যাটালগ ম্যানেজার সার্ভিস, পণ্য, ক্যাটাগরি, প্রমোশন আর অর্ডার দেখেন, আর কিছু নয়।",
 'Support agent': "সাপোর্ট এজেন্ট মেসেজ আর ডিসপ্যাচ দেখেন, যাতে কাস্টমাররা দ্রুত উত্তর পান।",
 'Super admin': "আর সুপার অ্যাডমিন সবকিছু করতে পারেন, রোল পরিচালনাসহ। রোল অনুমতি দিলেই কেবল মেনু আর কাজ দেখা যায়।",
 'Technicians are verified before they can work': "কাজ শুরুর আগে প্রতিটি টেকনিশিয়ান যাচাই হন। আমরা জাতীয় পরিচয়পত্রের ছবি নিই, লাইভ পরিচয় যাচাই চালাই আর লাইভ সেলফি তুলি। যিনি টেকনিশিয়ানকে যুক্ত করেন, অ্যাডমিন বা ভেন্ডর, দায়ও তাঁর।",
 'Vendor technicians are visible only to that vendor and admin': "একজন ভেন্ডর শুধু নিজের টেকনিশিয়ানদের দেখেন। অ্যাডমিন সব টেকনিশিয়ান আর প্রতিটি বরাদ্দ দেখেন।",
 'Close': "এই হলো নিউ। দ্রুত ডিসপ্যাচ, কম বিস্ময়, আর পূর্ণ জবাবদিহি, একটি লাইভ সিস্টেমে।",
}


# Tighter lines for beats that have little time on screen (checked against the recording timeline).
EN.update({
 'Title': "This is NEW. One live system to sell air conditioners, bags and local cosmetics, and to dispatch field technicians across Dhaka. Five connected apps, one workflow.",
 'The customer app': "Start with the customer app: air conditioners, bags and local cosmetics, with a first-purchase offer always in view.",
 'Services with fixed prices': "Services have fixed prices: repair, cooling problem, servicing, gas refill, installation and relocation.",
 'Add to cart or Buy now': "Add to cart, Buy now, or save with a heart.",
 'Assigned. The customer is told right away.': "One tap assigns it. The customer is told at once, and every action is logged.",
 'Live dispatch map': "The live map shows technicians moving and vendors fixed.",
 'The technician gets an offer with a timer': "A job offer arrives with a countdown. No answer in sixty seconds, and admin can reassign it.",
 'The customer approves in the app': "The customer decides in the app, and admin is informed.",
 'Incentive withdrawal is paid by finance': "With cash cleared, the technician withdraws incentive. Finance pays it, all in an audit ledger.",
 'The admin app does the same on the go': "The admin mobile app does the same on the go.",
 'Shop ACs, bags and local cosmetics': "Customers shop ACs, bags and cosmetics. Installation is an add-on with a discount and a one year warranty.",
 'The dashboard': "Now the admin web panel. The dashboard shows bookings, jobs, revenue and what needs attention, live.",
 'Services and prices': "Admin adds services and changes prices and time slots, without a developer.",
 'Categories and promotions': "Categories organise the shop. Promotions create offers and codes; provider offers can be added later.",
 'Technicians and vendors': "Technicians and vendors have their own pages. Vendor name, address and phone live here.",
 'Choose exactly what each role can do': "Admin can also create new roles.",
 'Operations executive': "Operations executive: dispatch, overrides, extra-work pricing, orders and people. No finance.",
 'Finance': "Finance sees payments, collections, earnings and reviews. It cannot dispatch.",
 'Catalog manager': "Catalog manager: services, products, promotions and orders only.",
 'Super admin': "The Super admin can do everything, including roles. Menus appear only when a role allows them, and the server checks every request.",
 'Vendor technicians are visible only to that vendor and admin': "A vendor sees only its own technicians. Admin sees all.",
})
BN.update({
 'Title': "এটি নিউ। এসি, ব্যাগ ও দেশি কসমেটিকস বিক্রি এবং ঢাকা জুড়ে ফিল্ড টেকনিশিয়ান পাঠানোর একটি লাইভ সিস্টেম। পাঁচটি সংযুক্ত অ্যাপ, একটাই ওয়ার্কফ্লো।",
 'The customer app': "শুরু কাস্টমার অ্যাপ দিয়ে: এসি, ব্যাগ ও দেশি কসমেটিকস, আর প্রথম কেনাকাটার অফার সবসময় চোখের সামনে।",
 'Services with fixed prices': "সার্ভিসের দাম ঠিক করা: মেরামত, কুলিং সমস্যা, সার্ভিসিং, গ্যাস রিফিল, ইনস্টলেশন ও স্থানান্তর।",
 'Add to cart or Buy now': "কার্টে যোগ, এখনই কেনা, অথবা হার্ট দিয়ে সেভ।",
 'Assigned. The customer is told right away.': "এক ট্যাপে বরাদ্দ। কাস্টমার সাথে সাথে জানেন, আর প্রতিটি পদক্ষেপের লগ থাকে।",
 'Live dispatch map': "লাইভ ম্যাপে টেকনিশিয়ান চলছে, ভেন্ডর স্থির।",
 'The technician gets an offer with a timer': "কাউন্টডাউনসহ কাজের অফার আসে। ষাট সেকেন্ডে সাড়া না দিলে অ্যাডমিন আবার বরাদ্দ দিতে পারেন।",
 'The customer approves in the app': "কাস্টমার অ্যাপে সিদ্ধান্ত নেন, অ্যাডমিনকে জানানো হয়।",
 'Incentive withdrawal is paid by finance': "নগদ শূন্য হলে টেকনিশিয়ান ইনসেন্টিভ তোলেন। ফাইন্যান্স পরিশোধ করে, সবই অডিট খাতায়।",
 'The admin app does the same on the go': "মোবাইলের অ্যাডমিন অ্যাপে চলতি পথেও একই কাজ।",
 'Shop ACs, bags and local cosmetics': "কাস্টমার এসি, ব্যাগ ও কসমেটিকস কেনেন। ইনস্টলেশন ছাড়ে ঐচ্ছিক, সাথে এক বছরের ওয়ারেন্টি।",
 'The dashboard': "এবার অ্যাডমিন ওয়েব প্যানেল। ড্যাশবোর্ডে বুকিং, কাজ, আয় আর নজর দেওয়ার বিষয়, লাইভ।",
 'Services and prices': "অ্যাডমিন সার্ভিস যোগ করেন, দাম আর সময়ের স্লট বদলান, ডেভেলপার ছাড়াই।",
 'Categories and promotions': "ক্যাটাগরি শপ সাজায়। প্রমোশনে অফার ও কোড হয়, প্রোভাইডার অফার পরে যোগ হবে।",
 'Technicians and vendors': "টেকনিশিয়ান ও ভেন্ডরের আলাদা পেজ। ভেন্ডরের নাম, ঠিকানা, ফোন এখানে।",
 'Choose exactly what each role can do': "অ্যাডমিন নতুন রোলও বানাতে পারেন।",
 'Operations executive': "অপারেশনস এক্সিকিউটিভ: ডিসপ্যাচ, ওভাররাইড, বাড়তি কাজের দাম, অর্ডার ও মানুষ। ফাইন্যান্স নেই।",
 'Finance': "ফাইন্যান্স দেখে পেমেন্ট, কালেকশন, আর্নিংস ও রিভিউ। ডিসপ্যাচ করতে পারে না।",
 'Catalog manager': "ক্যাটালগ ম্যানেজার শুধু সার্ভিস, পণ্য, প্রমোশন ও অর্ডার।",
 'Super admin': "সুপার অ্যাডমিন সব পারেন, রোলসহ। অনুমতি থাকলেই কেবল মেনু দেখা যায়, আর সার্ভার প্রতিটি অনুরোধ যাচাই করে।",
 'Vendor technicians are visible only to that vendor and admin': "ভেন্ডর শুধু নিজের টেকনিশিয়ান দেখেন; অ্যাডমিন সবাইকে।",
})
EN.update({
 'The nearest technicians are ranked by distance': "Admin opens the booking and sees the nearest technicians ranked by distance. If nobody is close, it goes to a vendor.",
 'The admin app does the same on the go': "The admin mobile app does this on the go.",
 'Shop ACs, bags and local cosmetics': "Customers shop ACs, bags and cosmetics. Installation is an add-on with a discount and warranty.",
 'Super admin': "The Super admin can do everything, including roles. Menus appear only when a role allows them.",
})
OFFSET = 0.0  # timeline.json already holds the exact times read back from the footage (scripts/video_timeline.py)

def build():
    tl = json.load(open('marketing/audio/timeline.json')); items = [dict(i, t=i['t'] + OFFSET) for i in tl['items']]; total = tl['total'] + OFFSET
    section = ''; rows = []; secname = {}
    for it in items:
        if it['kind'] == 'section': section = it['a']; secname[it['t']] = section
        else: rows.append((it['t'], section, it['a']))
    rows = [(0.0, 'Title', 'Title')] + rows + [(items[-1]['t'] if items[-1]['a'] == 'Close' else total - 8, 'Close', 'Close')]
    def mm(t): return '%d:%02d' % (t // 60, t % 60)
    for lang, D, fn, title in (('en', EN, '5-full-walkthrough-english.md', 'English'), ('bn', BN, '6-full-walkthrough-bangla.md', 'Bangla')):
        out = ['# Voice-over %s: full client walkthrough, %s\n' % ('5' if lang == 'en' else '6', title),
               'For the video: `marketing/new-full-walkthrough.mp4` (%s, 1080p). Times come from the recording, so each line starts when its caption appears.\n' % mm(total),
               'Use the table to line clips up in your editor. For ElevenLabs, generate each section (the groups below) as its own clip, in one voice and setting, and join them in order. The video has no sound by default. See `../AUDIO_SCRIPT.md`.\n',
               '| Time | Section | Narration |', '| --- | --- | --- |']
        warn = []
        for i, (t, sec, key) in enumerate(rows):
            txt = D.get(key)
            if not txt: warn.append(key); continue
            out.append('| %s | %s | %s |' % (mm(t), sec, txt))
            nxt = rows[i + 1][0] if i + 1 < len(rows) else total
            words = len(txt.split()); secs = max(1, nxt - t); rate = words / secs
            if lang == 'en' and rate > 2.9: warn.append('%s: %d words in %.0fs' % (key, words, secs))
        out.append('\n## Full text by section (paste each block into ElevenLabs as one clip)\n')
        cur = None; block = []
        for t, sec, key in rows:
            if sec != cur:
                if block: out.append('\n'.join(block) + '\n')
                out.append('### %s\n' % sec); block = []; cur = sec
            if D.get(key): block.append(D[key])
        if block: out.append('\n'.join(block) + '\n')
        open('marketing/audio/' + fn, 'w').write('\n'.join(out) + '\n')
        print(fn, 'lines', len(rows), 'warnings:', warn)

if __name__ == '__main__': build()
