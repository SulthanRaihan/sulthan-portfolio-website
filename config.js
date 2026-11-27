// Everything a visitor reads in the intro. Change these, not the scene code.
export const CONFIG = {
  name: "Sulthan Syafiq Raihan",
  nameZh: "苏睿涵",                    // the Chinese name (shown next to the About label, in the OS and Aiko's answers)
  role: "software engineer",

  // loader status line, by percentage (reads like an old PC booting)
  boot: [
    [0, "POST check…"],
    [25, "Loading system…"],
    [55, "Building the room…"],
    [85, "Switching on the lamp…"],
    [96, "Warming up the tube…"],
  ],

  // pixel captions on the "plug me in" screen (uppercase A–Z, digits, spaces)
  connect: ["DRAG THE CABLE", "TO GO ONLINE"],
  standby: ["NO SIGNAL", "SCROLL DOWN TO PLUG ME IN"],   // the tube after the computer was unplugged at the desk

  // the first real screen on the monitor
  pill: "hello, world",
  headline: ["I build things", "that think"],
  watermark: "hello",

  // (01) About — big headline lines: [text, start column (1–12), sideways drift with scroll]
  about: {
    label: "About me · 苏睿涵",
    role: "Software engineer · AI / ML · Balikpapan → Nanjing",
    lines: [["HI,", 1, -0.6], ["I’M SULTHAN —", 4, 0.6], ["SOFTWARE", 1, -0.4], ["ENGINEER.", 5, 0.5]],
  },

  // The CV printer. Leave `file` empty to have the site generate a PDF from the pages it draws;
  // put your real PDF in assets/ and set `file: "assets/cv.pdf"` to download that instead.
  // `pageImages` (optional): your own page renders, e.g. ["assets/cv-1.jpg", "assets/cv-2.jpg"] (A4 ratio).
  cv: {
    file: "",
    downloadName: "Sulthan-Syafiq-Raihan-CV.pdf",
    pageImages: [],
    year: "2026",
    email: "sulthanraihan701@gmail.com",                  // the main one: the mailbox, Aiko, the Contact app
    email2: "sulthanraihanssr@gmail.com",
    site: "github.com/SulthanRaihan",                    // printed on the CV's footer ("the rest is at …")
    location: "Nanjing, China (from Balikpapan)",
    intro: "Software engineering student in a UII × NXU 2+2 double degree. I build full-stack web and iOS apps and wire LLMs and on-device ML into them — then test every change before it ships.",
    work: [
      ["KawalBijak", "2nd place · LLM civic-tech app"],
      ["Blue Harvest", "Aquaculture PWA, built solo"],
      ["Arko FitnessCoach", "iOS · Core ML squat coach"],
      ["StudyGuard", "iOS · on-device posture AI"],
      ["PawCare", "Spring Boot clinic + AI assistant"],
      ["ElectroVice", "Flutter + Firebase backend"],
    ],
    experience: [["2026 — now", "Thesis researcher, MemVALID"], ["2026 — now", "Multimedia & Creative Team, IMIX"], ["Mar — Oct 2026", "Freelance software developer"], ["May 2026", "PM & QA, KawalBijak (2nd place)"]],
    services: ["Full-stack web apps", "iOS & mobile apps", "LLM integration", "On-device machine learning", "Project management"],
    tools: ["Next.js · TypeScript", "Spring Boot · Java", "Swift · SwiftUI · Core ML", "Python", "Supabase · Firebase", "Docker · Git"],
  },

  // (02) Portrait: the full-screen panel shrinks into a framed photo, your name rides the frame's sides,
  // then your eras rise underneath. `image`: your photo (portrait, ~4:5; a dark background blends best).
  // Empty = a pixel-art stand-in. `cover`: what fills the screen before it shrinks; empty = the monitor's first screen.
  portrait: {
    name: ["SULTHAN", "RAIHAN"],
    image: "assets/me.webp",
    cover: "",
    eras: [["FULL-STACK", "2023 – 2025"], ["MOBILE & ML", "2025 – 2026"], ["AI & LLMs", "2026 – Today"]],
  },

  // (03) Journey: education + experience as giant rows on one big canvas the scroll pans across (journey.js).
  // Each row reads "TO [photo] WORD". `photos`: your pictures from that time (assets/journey/...); empty = a placeholder.
  // Anything in [brackets] or 20XX is a placeholder — replace it with your real details.
  journey: {
    tag: "Education & experience",
    headline: ["FROM BALIKPAPAN", "TO NANJING, ONE", "STEP AT A TIME."],
    rows: [
      { group: "Education", word: "START", stage: "High School", place: "SMA Negeri 4 Balikpapan", city: "Balikpapan, Indonesia",
        years: "2020 – 2023", detail: "Science (IPA). Born and raised in Balikpapan, East Kalimantan — where the curiosity for computers first switched on.", badge: "SMA 4", ring: "SMA NEGERI 4 · BALIKPAPAN · INDONESIA · ",
        note: ["where it all", "began ✎"], photos: ["assets/journey/sma-guitar.webp", "assets/journey/suits.webp"] },
      { word: "GROW", stage: "Bachelor of Computer Science (S.Kom.)", place: "Universitas Islam Indonesia", city: "Yogyakarta, Indonesia",
        years: "2023 – 2027", detail: "Informatics. The first half of the 2+2 double degree — Project Manager or Scrum Master in most semester projects, and an award at the Informatics Expo.", badge: "UII", ring: "UNIVERSITAS ISLAM INDONESIA · YOGYAKARTA · ",
        note: ["two years of", "late-night projects"], photos: ["assets/journey/uii-expo.webp", "assets/journey/studio.webp"] },
      { word: "EXPLORE", stage: "B.Eng. · 2+2 double degree", place: "Nanjing Xiaozhuang University", city: "Nanjing, China",
        years: "2025 – 2027", detail: "Computer Software Engineering — a new country, a new language (hello, 苏睿涵), iOS + on-device ML, and a thesis on LLM agents.", badge: "NXU", ring: "NANJING XIAOZHUANG UNIVERSITY · 南京晓庄学院 · ",
        note: ["the big leap", "abroad ✈"], photos: ["assets/journey/nxu-drone.webp", "assets/journey/nxu-friends.webp"] },
      { group: "Experience", word: "BUILD", stage: "Freelance", place: "Freelance software developer", city: "Remote",
        years: "Mar – Oct 2026", detail: "Blue Harvest, an aquaculture PWA built solo — and the backend of ElectroVice, whose client team won 1st place at an international competition.", badge: "FREE", ring: "FREELANCE · WEB · MOBILE · AI · ",
        note: ["real clients,", "real deadlines"], photos: ["assets/journey/electrovice-dev.webp", "assets/journey/electrovice-team.webp"] },
      { word: "CREATE", stage: "Multimedia & Creative Team", place: "IMIX — Ikatan Mahasiswa Indonesia Xiaozhuang", city: "Nanjing, China",
        years: "Jul 2026 – now", detail: "The Indonesian student association at NXU. Designing banners and social posts in Canva, and shooting photos and videos at community events so they get documented and shared.", badge: "IMIX", ring: "IMIX · MULTIMEDIA · CREATIVE TEAM · ",
        note: ["a little piece", "of home 🇮🇩"], photos: ["assets/journey/imix-group.webp", "assets/journey/imix-sports.webp"] },
      { word: "LEAD", stage: "Project Manager & Scrum Master", place: "Team projects · UII & NXU", city: "Yogyakarta · Nanjing",
        years: "2023 – now", detail: "Led teams through Agile sprints, took KawalBijak to 2nd place at the TechSprint Innovation Cup 2026 — and ran events & competitions as staff of PORSEMATIK HMIF 2024.", badge: "PM", ring: "PROJECT MANAGER · SCRUM MASTER · TEAMWORK · ",
        note: ["together we", "go further"], photos: ["assets/journey/kawalbijak-team.webp", "assets/journey/kawalbijak-sketch.webp"] },
      { word: "RESEARCH", stage: "Undergraduate thesis", place: "MemVALID", city: "Nanjing, China",
        years: "2026 – now", detail: "A training-free layer that lets an LLM agent tell which of its memories are still true before it answers — tested on LongMemEval and PersonaMem.", badge: "AI", ring: "MEMVALID · LLM AGENTS · MEMORY · ",
        note: ["teaching agents", "to forget ✦"], photos: ["assets/research/memvalid-pipeline.webp", "assets/research/lymph-qc.webp"] },
    ],
  },

  // Music (music.js): played through YouTube's own embedded player (it has to stay visible, at least 200×200, per
  // YouTube's rules). The first track starts when the cable is plugged in at the start, if sound is on.
  music: [
    { id: "c_10qS7amjk", title: "Mean It", artist: "Lauv & LANY" },
    { id: "_3GKsIFtEoE", title: "Coming Up Roses", artist: "Harry Styles" },
    { id: "ApXoWvfEYVU", title: "Sunflower", artist: "Post Malone, Swae Lee" },
    { id: "fE9trKOuT3Q", title: "spiral", artist: "LONGMAN" },
    { id: "lwYw0jyxOys", title: "XXL", artist: "LANY" },
  ],

  // The research archive on the desk (research.js): two folders in a file stand; each opens as a paper-style overview.
  research: [
    {
      id: "memvalid", code: "MV-01", tab: "MemVALID", kind: "Thesis", color: "#6d4bd8",
      title: "MemVALID: Validity-Aware Labeling for Intent-Driven Memory Selection in Conversational Agents",
      authors: "Sulthan Syafiq Raihan (苏睿涵)", affil: "School of Information Engineering, Nanjing Xiaozhuang University", period: "2026 – 2027",
      status: "Method frozen (prompts-v4-frozen) · development pilot done · confirmatory test runs after the March 2027 freeze",
      abstract: "Conversational agents answer from a long-term memory of past turns, but user facts change over time: a retrieved memory can be relevant to the question and still no longer be valid. Recent temporal-memory systems label or re-rank such memories yet still pass them to the generator — stale-evidence leakage. MemVALID is a training-free layer between retrieval and generation: a frozen LLM labels the question’s intent and each candidate’s relevance and temporal role, and deterministic rules keep only the memories that are valid for that intent. The thesis asks whether removing invalid memories helps beyond showing the same labels to the model, or beyond re-ranking.",
      keywords: ["LLM agents", "long-term memory", "temporal validity", "retrieval-augmented generation", "evidence selection"],
      figures: [{ src: "assets/research/memvalid-pipeline.webp", caption: "Figure 1. The MemVALID pipeline — memory construction, intent induction, validity-aware labeling and rule-based selection, then an evidence-grounded answer. (E) lists the evaluation conditions: cut points of the same pipeline with the same generator, prompt and judge." }],
      sections: [
        { h: "1. The problem", p: "January: “I drink tea every morning.” August: “I switched to coffee.” Asked now “What do I drink in the morning?”, an agent that retrieves both memories may still answer tea. Validity also depends on the question: for “What did I drink in January?” the tea memory is the valid one, so “always take the newest” is not enough." },
        { h: "2. Method", list: ["Retrieve — bge-small-en-v1.5 returns the top-20 user turns (one memory = one user turn with its session date).", "Label — a frozen LLM (Qwen3-8B, temperature 0) classifies the intent (current / historical / evolution) and labels each candidate’s relevance R and temporal role T.", "Select — deterministic rules, no LLM: drop irrelevant memories, keep the temporal roles that match the intent, rank required ones first, keep at most 5, sort by date."] },
        { h: "3. Evaluation", p: "Every condition shares the same retrieval, labels, generator and prompt; only the evidence differs. Primary comparison: MemVALID (C) vs labels-without-removal (B5); secondary: removal vs re-ranking (B6), predicted vs gold labels (D), and controls for context length and intent. Data: the knowledge-update subset of LongMemEval (dev 15 · test 52), a historical-question probe (~38) and a PersonaMem subset (80)." },
        { h: "4. Development pilot (exploratory)", table: { head: ["Condition", "Current-state correct (of 12)", "Stale runs (of 36)", "Historical correct (of 2)", "Input tokens"], rows: [["B1 top-5", "~8", "9", "0", "491"], ["B5 labels, no removal", "~9", "9", "0–1", "2013"], ["B6 re-ranking", "10", "3", "0", "2013"], ["C MemVALID", "10", "3", "2", "407"]] },
          note: "Qwen3-8B on 15 dev questions × 3 seeds; the prompts were tuned on these questions, so the numbers are optimistic by construction. Early reading: labels alone still leak stale evidence; removal is the only label-based condition that answers both historical questions, with ~80% fewer generator tokens than B5." },
        { h: "5. Research integrity", list: ["Pre-registration through git — every protocol is committed before its results.", "Method freeze — the prompts-v4-frozen tag fixes prompts, parser, selector and conditions.", "Test lock — the runner refuses test splits until the freeze file exists.", "Human gold labels, a second annotator and a 30% audit of the LLM judge."] },
      ],
      links: [{ label: "GitHub · SulthanRaihan/memvalid", url: "https://github.com/SulthanRaihan/memvalid" }],
    },
    {
      id: "lymph", code: "LN-02", tab: "LYMPH NODE", kind: "Research", color: "#c4432f",
      title: "Medical Lymph Node Segmentation: Does the Global Dice Score See the Small Nodes?",
      authors: "Sulthan Syafiq Raihan (苏睿涵)", affil: "Undergraduate research · 3D medical image segmentation", period: "2026 –",
      status: "Stage 1 — dataset audit complete: 44 / 44 cases processed, 0 errors, 100% of CSV cells filled",
      abstract: "Segmentation models for lymph nodes in CT are usually judged by the global Dice score. This project studies how well that score reflects whether individual annotated lymph nodes are actually detected — especially small ones. Before any model is trained, every case of the dataset is opened, validated and summarised, so that later results rest on data that is known to be correct.",
      keywords: ["medical imaging", "3D segmentation", "CT", "lymph nodes", "evaluation metrics", "Dice vs lesion-wise recall"],
      figures: [
        { src: "assets/research/lymph-overview.webp", caption: "Figure 1. Dataset overview — ground-truth lymph-node volume per case (left) and the size distribution of the 233 connected components (right); only 17 are below the 8 mm small-node threshold." },
        { src: "assets/research/lymph-qc.webp", caption: "Figure 2. Manual verification of MED_LYMPH_001 — CT in a soft-tissue window (L40/W400) with the ground-truth node contour in red, in axial, coronal and sagittal views." },
      ],
      sections: [
        { h: "1. Research question", p: "To what extent does the global Dice score reflect a model’s ability to detect individual annotated lymph nodes, particularly small lymph nodes, in 3D CT? Planned comparison: case-level Dice vs lesion-wise recall, precision and F1, stratified by node size, on the predictions of a baseline 3D segmentation model." },
        { h: "2. Data", p: "44 CT volumes (22 abdominal, 22 mediastinal) with lymph-node masks in NIfTI, a subset of the TCIA CT Lymph Nodes collection (Roth et al.). Reference paper: Bloom et al., Analysis of deep learning-based segmentation of lymph nodes on full-dose and reduced-dose body CT, Abdominal Radiology 51 (2026)." },
        { h: "3. Audit results", list: ["44 / 44 cases processed, 0 errors, 27 columns filled with no missing values.", "Image–label pairs identical in shape, spacing and affine; median HU inside the masks 31–137 (soft tissue).", "Seven cases re-checked by independently written code (56 / 56 checks pass) and by visual review."] },
        { h: "4. Findings that matter", list: ["Six patients appear twice (voxel-identical CT, abdomen vs mediastinum labels) — they must stay on the same side of any train/test split.", "One “node” is a ~9 cm mediastinal mass (239 ml) — keep, exclude or analyse separately.", "Few small nodes: only 17 of 233 components are under 8 mm (median 15.9 mm).", "Label IDs ≠ components (276 vs 233): lesion-wise metrics need an agreed definition of “one node”."] },
      ],
      links: [{ label: "GitHub · SulthanRaihan/medical-lymphnode-segmentation", url: "https://github.com/SulthanRaihan/medical-lymphnode-segmentation" }],
    },
  ],

  // (05) Back at the desk (outro.js): the room again, Aiko wandering on the desk; look inside the computer (os.js) or unplug it
  desk: {
    city: "Nanjing", timeZone: "Asia/Shanghai",                     // the clock in the menu bar inside the computer
    links: { Instagram: "https://www.instagram.com/sulthan.ssr_/", LinkedIn: "https://www.linkedin.com/in/sulthan-raihan/", GitHub: "https://github.com/SulthanRaihan" },
    photo: "assets/me.webp",                                         // pinned in the middle of the board on the wall
    notes: ["Wake up. Learn.\nBuild. Repeat.", "Hiring? Got a\nproject? Open\nContact →", "Ask Aiko\nanything ✦", "Nothing happens\nunless you\nstart."],
    now: ["Researching: MemVALID — memory validity for LLM agents", "Designing: posters & posts for IMIX", "Looking for: a 3-month internship, Jan – Apr 2027", "Learning: Mandarin, one character at a time"],
  },

  // (06) Say hi — the last screen, reachable once the old computer is unplugged (sayhi.js).
  // Weather for the city comes from open-meteo.com (no key needed).
  sayhi: {
    flag: "🇨🇳", lat: 32.06, lon: 118.80, gmt: "GMT+8",
    title: ["Thanks for stopping by.", "The desk light’s always on."],
    sub: "Drop me a letter — let’s build something together.",
  },

  // Aiko's answers. She matches the visitor's words against `keys` (English + Indonesian); {name} etc. come from the config above.
  aiko: {
    hello: "Hi! I’m Aiko, {first}’s study buddy ✦ Ask me anything about {first} — or pick a question below!",
    suggestions: ["Who is {first}?", "Where did {first} study?", "What can {first} do?", "Show me projects", "Is {first} open for an internship?", "Tell me a fun fact"],
    qa: [
      { keys: ["who", "siapa", "about", "tentang", "introduce", "kenalan"], mood: "happy", a: "That’s {name} — 苏睿涵 in Chinese! A {role} from Balikpapan, Indonesia, now in Nanjing, China for a 2+2 double degree (UII × NXU). {first} builds web and iOS apps and wires AI into them." },
      { keys: ["intern", "internship", "magang", "available", "open", "lowongan"], mood: "happy", a: "Yes! {first} is looking for a full-time 3-month internship between January and April 2027. Drop a line at {email} ✦" },
      { keys: ["thesis", "skripsi", "research", "riset", "memvalid", "llm", "ml", "machine learning", "agent"], mood: "think", a: "{first}’s thesis is MemVALID: a layer that checks which memories an LLM agent should still trust before it answers, so it stops using outdated facts. Tested on LongMemEval and PersonaMem!" },
      { keys: ["chinese", "mandarin", "china", "nama", "苏睿涵"], mood: "wink", a: "{first}’s Chinese name is 苏睿涵 (Sū Ruìhán) — picked up while studying in Nanjing. Mandarin level: still growing ✦" },
      { keys: ["study", "school", "university", "kuliah", "sekolah", "kampus", "education", "pendidikan", "degree", "uii", "nanjing", "sma"], mood: "think", a: "{education}" },
      { keys: ["experience", "pengalaman", "work as", "freelance", "organization", "organisasi", "job", "kerja", "imix"], mood: "happy", a: "{experience}" },
      { keys: ["skill", "can", "bisa", "tools", "stack", "figma", "python", "sql", "keahlian"], mood: "wink", a: "{first} works with {skills}. Want to see them? Look inside the computer → Skills!" },
      { keys: ["project", "proyek", "portfolio", "karya", "work", "website", "app"], mood: "happy", a: "{projects} Open the computer and click Work to see each one ✦" },
      { keys: ["contact", "kontak", "hubungi", "email", "mail", "reach", "hire", "rekrut", "collab"], mood: "wink", a: "Email {first} at {email} (or sulthanraihanssr@gmail.com) — or open the Contact app inside the computer. {first} replies fast, I checked!" },
      { keys: ["cv", "resume"], mood: "happy", a: "Scroll up to the About section and click the printer — it prints {first}’s CV for you!" },
      { keys: ["fun", "fact", "random", "seru", "lucu"], mood: "wink", a: "{fact}" },
      { keys: ["aiko", "you", "kamu", "robot", "ai"], mood: "happy", a: "I’m Aiko — a little study buddy living on this desk. I can’t think like a real AI, but I know {first} pretty well ♥" },
      { keys: ["hi", "hello", "halo", "hai", "hey"], mood: "happy", a: "Hii! ✦ What would you like to know about {first}?" },
      { keys: ["thank", "makasih", "terima kasih", "thanks"], mood: "happy", a: "You’re welcome ♥ Come back anytime!" },
    ],
    facts: ["{first} moved from Balikpapan to Nanjing for the second half of a double degree — new language, new food, new everything!", "For Arko FitnessCoach, {first}’s team recorded their own squat videos to train the Core ML model. Lots of squats.", "{first}’s team took 2nd place at the TechSprint Innovation Cup 2026 with KawalBijak ✦", "This whole website was built from scratch, even me ✦", "Try unplugging the computer. I dare you."],
    fallback: "Hmm, I don’t know that one yet… Try asking about {first}’s studies, skills, projects or how to get in touch!",
  },

  // (04) Work: the tunnel of cards (works.js) and the All Work page (work.html).
  // Every item may have `image` (a path in assets/); without one the site draws a placeholder card.
  works: {
    chapters: [
      { key: "web", title: "Websites & Apps", sub: "web apps · iOS apps · AI tools" },
      { key: "skills", title: "Skills", sub: "tools · languages · software" },
      { key: "certs", title: "Certificates", sub: "courses · awards · credentials" },
      { key: "moments", title: "Moments", sub: "events · talks · behind the scenes" },
    ],
    projects: [
      { title: "KawalBijak", kind: "Web app · AI", year: "2026", role: "Project Manager & QA · 2nd place, TechSprint Innovation Cup 2026", summary: "Translates Indonesian fiscal policy into each citizen’s monthly Rupiah impact. Llama 3.3 70B via Groq for policy summaries, a guarded Q&A chatbot and plausibility checks on citizen reports.", stack: ["Next.js", "TypeScript", "Groq API", "Prompt engineering"], link: "https://kawalbijak.vercel.app", image: "assets/work/kawalbijak.webp", color: ["#ff8a3d", "#2a1206"] },
      { title: "Blue Harvest", kind: "Web app · PWA", year: "2026", role: "Freelance · solo developer", summary: "An aquaculture app for fish and shrimp farmers: cultivation-cycle planning with a risk score, feed and water-quality logs, and automated financial reports.", stack: ["Next.js", "TypeScript", "Supabase", "PWA"], link: "https://blue-harvest-chi.vercel.app", image: "assets/work/blueharvest.webp", color: ["#2f9bff", "#061a2b"] },
      { title: "Arko FitnessCoach", kind: "iOS app · ML", year: "2026", role: "Academic project · NXU", summary: "Real-time squat form feedback from Apple Vision pose detection and a Core ML model trained on the team’s own videos (~90% training accuracy), with a CrewAI backend that writes progress reports.", stack: ["Swift", "SwiftUI", "Core ML", "Apple Vision", "CrewAI"], link: "https://github.com/SulthanRaihan/Arko-fitnesscoach", image: "assets/work/arko.webp", color: ["#16c79a", "#06302a"] },
      { title: "StudyGuard", kind: "iOS app · ML", year: "2026", role: "Academic project · NXU", summary: "A posture and focus monitor: 24 body-joint features from Vision landmarks feed a custom Core ML classifier that spots 5 posture types on-device, in real time.", stack: ["Swift", "SwiftUI", "Core ML", "Apple Vision"], link: "https://github.com/SulthanRaihan/StudyGuard", image: "assets/work/studyguard.webp", color: ["#7b61ff", "#140b3a"] },
      { title: "PawCare", kind: "Web app", year: "2026", role: "Academic project · NXU", summary: "A veterinary clinic system for owners, doctors and admins — appointments, records, transactional prescriptions with stock deduction, and an AI health assistant via Groq.", stack: ["Java", "Spring Boot", "Spring Security", "MySQL", "Groq API"], link: "https://github.com/SulthanRaihan/PawCare", image: "assets/work/pawcare.webp", color: ["#ffd23f", "#2a2206"] },
      { title: "ElectroVice", kind: "Mobile app", year: "2026", role: "Freelance · backend developer", summary: "An electronics repair booking app. Built the backend and Firebase side; the client team won 1st place at an international competition.", stack: ["Flutter", "Firebase"], link: "https://github.com/fawwaz2828/electrovice", image: "assets/work/electrovice.webp", color: ["#ff4f79", "#2a0613"] },
      { title: "GymTrack", kind: "Web dashboard · AI", year: "2025", role: "Scrum Master · UII", summary: "A management information system that turns user-habit data into LLM-generated insights, sentiment analysis and alerts.", stack: ["React", "TypeScript", "LLM"], link: "https://github.com/SulthanRaihan/MIS-Gymtrack", image: "assets/work/gymtrack.webp", color: ["#3bc9db", "#06262b"] },
      { title: "Rootify", kind: "Web platform", year: "2024", role: "Project Manager & backend · UII", summary: "“Grow your story” — plan a trip around Yogyakarta, book tour packages and stays, and share travel stories with the community. Team Vortex won an award at the Informatics Expo 2024/2025.", stack: ["PHP", "JavaScript", "Docker"], link: "https://github.com/SulthanRaihan/rootifyFinal", image: "assets/work/rootify.webp", color: ["#51cf66", "#0b2a10"] },
      { title: "MicroGrowth", kind: "Desktop app", year: "2024", role: "Backend developer · UII", summary: "A P2P lending app for small businesses with borrower, investor and admin roles across 22 screens.", stack: ["Java", "JavaFX", "XML"], link: "https://github.com/SulthanRaihan/MicroGrowth", image: "assets/work/microgrowth.webp", color: ["#f59f00", "#2b1d00"] },
      { title: "HoliJoy", kind: "App design", year: "2023", role: "Project Manager · UII", summary: "A travel-planning app designed in Figma: multi-mode route tracker, location-based suggestions and an AI chatbot.", stack: ["Figma", "UI/UX"], link: "https://www.figma.com/design/CYz8rr7WmAl4iW9IAQLR3Y/HoliJoy---Enjoy-every-moment-", image: "assets/work/holijoy.webp", color: ["#e599f7", "#2b0a30"] },
    ],
    // `icon`: a simple-icons.org slug (logo drawn from it); without a match a monogram tile is drawn
    skills: [
      { name: "TypeScript", icon: "typescript", color: "#3178C6" }, { name: "JavaScript", icon: "javascript", color: "#F7DF1E" },
      { name: "Python", icon: "python", color: "#3776AB" }, { name: "Java", icon: "openjdk", color: "#437291" },
      { name: "Swift", icon: "swift", color: "#F05138" }, { name: "SQL", icon: "mysql", color: "#4479A1" },
      { name: "PHP", icon: "php", color: "#777BB4" }, { name: "Next.js", icon: "nextdotjs", color: "#000000" },
      { name: "React", icon: "react", color: "#61DAFB" }, { name: "Spring Boot", icon: "springboot", color: "#6DB33F" },
      { name: "Flutter", icon: "flutter", color: "#02569B" }, { name: "SwiftUI", icon: "swift", color: "#0D96F6" },
      { name: "Core ML", icon: "", color: "#34C759" }, { name: "Supabase", icon: "supabase", color: "#3FCF8E" },
      { name: "Firebase", icon: "firebase", color: "#FFCA28" }, { name: "PostgreSQL", icon: "postgresql", color: "#4169E1" },
      { name: "Docker", icon: "docker", color: "#2496ED" }, { name: "Vercel", icon: "vercel", color: "#000000" },
      { name: "Git", icon: "git", color: "#F05032" }, { name: "GitHub", icon: "github", color: "#181717" },
      { name: "Figma", icon: "figma", color: "#F24E1E" }, { name: "Xcode", icon: "xcode", color: "#147EFB" },
      { name: "Canva", icon: "canva", color: "#00C4CC" },
    ],
    certificates: [
      { title: "2nd Place — Web Development", issuer: "TechSprint Innovation Cup 2026 · Codelab Indonesia", year: "2026", summary: "With KawalBijak, as Project Manager & QA of team labulada (UII).", link: "https://kawalbijak.vercel.app", image: "assets/certs/techsprint.webp" },
      { title: "Informatics Expo Award — Team Vortex", issuer: "Informatika · Universitas Islam Indonesia", year: "2024", summary: "Informatics Expo 2024/2025 Vol.1, for Rootify — Web Application Development & Computer Network Systems.", link: "", image: "assets/certs/expo-vortex.webp" },
      { title: "Staff — Events & Competitions", issuer: "PORSEMATIK HMIF · LEM FTI UII", year: "2024", summary: "Organizing committee of the 2024 informatics student sports & arts week.", link: "", image: "assets/certs/porsematik.webp" },
      { title: "Prompt Engineering with the OpenAI API", issuer: "DataCamp", year: "2026", summary: "Writing, structuring and testing prompts against the OpenAI API — 4 hours, completed Aug 2026.", link: "https://drive.google.com/file/d/1HuTCnWJQDmLLxLd2J0pu3_yGQk7A8oQb/view", image: "assets/certs/prompt-engineering.webp" },
      { title: "Intermediate Python", issuer: "DataCamp", year: "2026", summary: "Python for data work: dictionaries, pandas, plotting and control flow — completed Apr 2026.", link: "https://drive.google.com/file/d/1ysyxTu22S686ku9g8MPnu0ikQy9xoB6d/view", image: "assets/certs/intermediate-python.webp" },
      { title: "Introduction to Python", issuer: "DataCamp", year: "2026", summary: "Python basics: variables, lists, functions and NumPy — completed Mar 2026.", link: "https://drive.google.com/file/d/12Y2FMPilGWGBjHLHnboRIIYaOWCgJH5z/view", image: "assets/certs/intro-python.webp" },
      { title: "AI Praktis untuk Produktivitas", issuer: "Dicoding", year: "2026", summary: "Practical AI for everyday productivity — certificate of competence, Apr 2026.", link: "https://drive.google.com/file/d/1BZwCzpzk6HAlXuqyPS3rpGKh8gOVq3b2/view", image: "assets/certs/ai-praktis.webp" },
      { title: "ICDL Spreadsheets 6.0 — Excel 365", issuer: "ICDL", year: "2025", summary: "Certification test on formulas, functions, charts and data handling in Excel 365 — passed Jun 2025.", link: "https://drive.google.com/file/d/1pdDm4NrUlvtLbUaBc-Qlx_BdiDoD9kmR/view", image: "assets/certs/icdl-excel.webp" },
      { title: "Pelatihan Basis Data", issuer: "Informatika · Universitas Islam Indonesia", year: "2023", summary: "Database training by UII’s Information Systems & Software Engineering lab, Sep 2023.", link: "https://drive.google.com/file/d/1TZGcZwoL5yUZmaUgp6lnv-SO-HwL-4Tj/view", image: "assets/certs/basis-data.webp" },
      { title: "Duolingo English Test — 110", issuer: "Duolingo", year: "2025", summary: "Upper Intermediate, CEFR B2 (Apr 2025). Also: Indonesian (native) and Mandarin (elementary).", link: "https://certs.duolingo.com/4cr5qsqyfvnlkn0p", image: "assets/certs/det.webp" },
    ],
    moments: [
      { title: "Industry visit, the whole crew", place: "Nanjing, China", year: "2025", summary: "NXU jackets on, posing in a company lobby — one of our industry field trips.", image: "assets/moments/m01.webp" },
      { title: "Class photo", place: "NXU, Nanjing", year: "2025", summary: "The whole class, our lecturer in the middle, everyone pointing at him.", image: "assets/moments/m02.webp" },
      { title: "Snack at the summit", place: "Nanjing, China", year: "2025", summary: "Golden hour over the city, and something warm to eat at the top.", image: "assets/moments/m03.webp" },
      { title: "We made it up", place: "Nanjing, China", year: "2025", summary: "Sunset hike with the boys — right next to the “no nearing” sign, of course.", image: "assets/moments/m04.webp" },
      { title: "Pink grass, big group", place: "Nanjing, China", year: "2025", summary: "A whole squad of Indonesian students on a hill of pink muhly grass.", image: "assets/moments/m05.webp" },
      { title: "Lost in the pink", place: "Nanjing, China", year: "2025", summary: "Waist-deep in pink grass under a very blue sky.", image: "assets/moments/m06.webp" },
      { title: "Chasing the sun", place: "Nanjing, China", year: "2025", summary: "Backlit, lens flare and all.", image: "assets/moments/m07.webp" },
      { title: "Portrait among the pink", place: "Nanjing, China", year: "2025", summary: "Leather jacket weather in autumn.", image: "assets/moments/m08.webp" },
      { title: "Trying on AR glasses", place: "Hangzhou, China", year: "2025", summary: "Field trip to a spatial-computing hub — the future looked a bit silly on us.", image: "assets/moments/m09.webp" },
      { title: "Next to a big drone", place: "Industry visit, China", year: "2025", summary: "A fixed-wing drone at a robotics company showroom.", image: "assets/moments/m10.webp" },
      { title: "Firefighting drones", place: "Industry visit, China", year: "2025", summary: "Learning how drones fight fires and wash skyscrapers.", image: "assets/moments/m11.webp" },
      { title: "Lantern street at dusk", place: "China", year: "2025", summary: "An old street lit with painted lanterns.", image: "assets/moments/m12.webp" },
      { title: "Hello, robot", place: "AI showroom, China", year: "2025", summary: "Posing in front of a giant robot screen at a tech showroom.", image: "assets/moments/m13.webp" },
      { title: "Off-duty", place: "Old town, China", year: "2025", summary: "Phone up, jacket on the shoulders.", image: "assets/moments/m14.webp" },
      { title: "Through my lens", place: "Water town, China", year: "2025", summary: "A flower boat drifting down a canal — taken on my camera.", image: "assets/moments/m15.webp" },
      { title: "Visiting Rokid", place: "Hangzhou, China", year: "2025", summary: "Selfie outside the AR company we visited.", image: "assets/moments/m16.webp" },
      { title: "Holding up the world", place: "Science hall, China", year: "2025", summary: "A giant LED globe and me, small in front of it.", image: "assets/moments/m17.webp" },
      { title: "Canteen dinner", place: "NXU, Nanjing", year: "2025", summary: "The usual table, the usual crew.", image: "assets/moments/m18.webp" },
      { title: "Countdown night", place: "Nanjing, China", year: "2026", summary: "A cold, crowded, bright night out in the city.", image: "assets/moments/m19.webp" },
      { title: "Late-night walk", place: "Nanjing, China", year: "2026", summary: "Three of us, one very low camera angle.", image: "assets/moments/m20.webp" },
    ],
  },
};
