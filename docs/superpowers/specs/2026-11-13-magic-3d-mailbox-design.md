# เอกสารออกแบบระบบ: เว็บกล่องจดหมาย 3 มิติ (Magic 3D Mailbox)

วันที่ออกแบบ: 2026-11-13  
เป้าหมาย Repository: `https://github.com/caboyza503za/magic-3d-mailbox`  
ลิงก์เผยแพร่เป้าหมาย (GitHub Pages): `https://caboyza503za.github.io/magic-3d-mailbox/`

---

## 1. วัตถุประสงค์และประสบการณ์หลัก (Goal & Core Experience)

สร้างเว็บแอปพลิเคชัน 3 มิติแบบโต้ตอบได้ (Interactive WebGL 3D Experience) สำหรับส่งให้แฟนเปิดดูผ่านโทรศัพท์มือถือเป็นหลัก โดยเน้นงานภาพและกราฟฟิค 3 มิติที่อลังการ มีมิติแสงเงาและองค์ประกอบเคลื่อนไหวจำนวนมากให้มองเพลิดเพลินได้รอบทิศทาง 360° และจบลงด้วยการเปิดซองจดหมายเผยคำว่า **"รักนะจุ๊บๆ"** เพียงข้อความเดียวอย่างโดดเด่นงดงาม

### เงื่อนไขสำคัญจากผู้ใช้
- **ธีมบรรยากาศ:** สวนเวทมนตร์ยามค่ำคืน & ออโรร่า (Enchanted Night Garden & Aurora)
- **กราฟฟิค:** อลังการตา ละเอียด มีชีวิตชีวา และเคลื่อนไหวต่อเนื่องจนดูเพลิน
- **อุปกรณ์หลัก:** เปิดผ่านโทรศัพท์มือถือแนวตั้ง (`9:16`) ได้สวยงาม เต็มหน้าจอ และลื่นไหล
- **ข้อความปลายทาง:** แสดงเฉพาะคำว่า **"รักนะจุ๊บๆ"** เท่านั้น (ไม่เพิ่มบทความหรือคำบรรยายยาวอื่นในจดหมาย)
- **การส่งมอบ:** อัปโหลดขึ้น GitHub Public Repository (`caboyza503za/magic-3d-mailbox`) และเปิดใช้งาน GitHub Pages พร้อมตรวจสอบลิงก์จริงก่อนส่งมอบ

---

## 2. สถาปัตยกรรมเทคโนโลยี (Tech Stack & Architecture)

| ส่วนประกอบ | เทคโนโลยีที่เลือกใช้ | เหตุผล |
|---|---|---|
| Build & Bundler | **Vite (Vanilla ES Modules)** | Bundle `three` และ Post-processing ไว้ในโปรเจกต์โดยตรง โหลดไวบนมือถือ ไม่พึ่ง CDN ภายนอกที่อาจล่มหรือโหลดช้า |
| 3D Rendering Engine | **Three.js (WebGL2)** | ควบคุม Camera, Raycasting, InstancedMesh, Custom GLSL Shaders และ Animation Loop ได้ละเอียด 60fps |
| Post-Processing | `EffectComposer` + `RenderPass` + `UnrealBloomPass` + `OutputPass` | ให้แสงออโรร่า ดอกไม้ ผีเสื้อ และพลุหัวใจเปล่งประกายฟุ้งละมุน (ACES Filmic Tone Mapping) |
| Audio Engine | **Procedural WebAudio API** | สังเคราะห์เสียงกล่องดนตรี (Music Box) และเสียงกระดิ่ง/พลุอัตโนมัติหลังผู้ใช้แตะจอครั้งแรก ไม่ต้องโหลดไฟล์เสียง MP3 |
| UI Overlay | **HTML5 + CSS3 (Safe-Area & Glassmorphism)** | แสดงคำแนะนำสั้นๆ ปุ่มเสียง ปุ่ม Replay และข้อความ **"รักนะจุ๊บๆ"** ที่คมชัด ไม่พร่าจาก Bloom |
| Deployment | **GitHub Actions + GitHub Pages** | Build จาก `main` อัตโนมัติด้วย `actions/upload-pages-artifact` และ `actions/deploy-pages` |

---

## 3. อัตลักษณ์สีและตัวอักษร (Visual Design Tokens)

### ชุดสีหลัก (Midnight Botanicals & Celestial Rose-Gold)
- **Midnight Sky Deep:** `#07091A` (พื้นหลังท้องฟ้าเบื้องบน)
- **Nebula Horizon:** `#111638` (ไล่เฉดขอบฟ้าและหมอกเรืองแสง)
- **Aurora Emerald:** `#2CE6C8` (แสงออโรร่าชั้นล่างและหิ่งห้อย)
- **Aurora Amethyst:** `#9D6BFF` (แสงออโรร่าชั้นกลางและวงแหวนเวทมนตร์)
- **Aurora Rose:** `#FF70B8` (แสงออโรร่าชั้นบน ดอกไม้ และหัวใจ)
- **Mailbox Velvet Plum:** `#1E1842` (ตัวกล่องจดหมายเคลือบเงา Clearcoat)
- **Champagne Rose-Gold:** `#F5C28B` (ขอบซุ้ม กลอน รูกุญแจ ขอบซองจดหมาย)
- **Heart Wax Crimson:** `#FF4F87` (ธงหัวใจ และตราครั่งรูปหัวใจบนซอง)
- **Crystal Ivory:** `#FFF7FA` (กระดาษจดหมายและตัวอักษรหลัก)

### ตัวอักษร (Typography)
- ใช้ Google Fonts: **`Mali`** (น้ำหนัก 500, 600, 700) สำหรับข้อความหลัก **"รักนะจุ๊บๆ"** เพื่อให้ความรู้สึกอบอุ่น หวาน น่ารัก อ่านง่ายบนมือถือ และ **`Noto Sans Thai`** (น้ำหนัก 400, 500) สำหรับคำแนะนำสั้นๆ

---

## 4. รายละเอียดฉาก 3 มิติและ Custom Shaders

### 4.1 ท้องฟ้า กาแล็กซี่ และแสงออโรร่า (`src/scene/createSkyAndAurora.js`)
- **Galaxy Nebula Sky Dome:** ทรงกลมขนาดใหญ่ใช้ Custom GLSL Fragment Shader สร้างสีท้องฟ้าไล่ระดับ กลุ่มเมฆเนบิวลาหมุนช้าๆ ด้วย Simplex/Value Noise
- **Twinkling Starfield:** จุดดาวกว่า 1,400 ดวงที่มีความถี่การกระพริบและขนาดต่างกันใน Vertex/Fragment Shader
- **Shooting Stars:** ดาวตก 3 เส้นที่พุ่งเฉียงข้ามท้องฟ้าเป็นรอบเวลาแบบสุ่มพร้อมหางแสงไล่ความโปร่งใส
- **Aurora Borealis Ribbons:** แผ่นริบบิ้นโค้ง 3 ชั้นเหนือท้องฟ้า ใช้ Custom GLSL Vertex Displacement + FBM Curtain Shader ให้แสงออโรร่าพริ้วเป็นม่านคลื่นและเปลี่ยนสีระหว่าง `#2CE6C8`, `#9D6BFF`, `#FF70B8`

### 4.2 เกาะเวทมนตร์ บ่อน้ำสะท้อนแสง และสวนดอกไม้ (`src/scene/createIslandAndWater.js`)
- **Floating Crystal Island:** เกาะลอยรูปทรงออร์แกนิก ด้านบนเป็นเนินหญ้าสีครามเข้ม ส่วนใต้เกาะเป็นแท่งหินคริสตัลหลายเหลี่ยมส่องแสงเรืองรอง
- **Moonlit Ripple Pond Ring:** วงแหวนผิวน้ำรอบฐานเสากล่องจดหมาย ใช้ Custom Fresnel + Concentric Ripple Shader สะท้อนแสงดาวและแสงออโรร่า
- **Enchanted Flora (`InstancedMesh`):**
  - ดอกไม้คริสตัลเรืองแสง 45+ ดอก รอบเกาะ พร้อมกลีบซ้อนและเกสรส่องสว่าง (Vertex Shader พริ้วตามสายลม)
  - เห็ดเรืองแสงและผลึกคริสตัลจิ๋วริมขอบเกาะ
  - วงแหวนอักษรรูนแสง (Magic Circle Rings) ที่หมุนสวนทางกันอย่างนุ่มนวลรอบฐานกล่องจดหมาย
- **Curved Lantern Post:** เสาเหล็กดัดโค้งด้านข้างเกาะพร้อมตะเกียงแก้วจิ๋วที่แกว่งเบาๆ และ PointLight สีอุ่น

### 4.3 กล่องจดหมายเวทมนตร์ 3 มิติ (`src/scene/createMailbox.js`)
- สร้างประกอบจากชิ้นส่วน 3D ที่มี Pivot แยกอิสระ:
  - **เสาตั้งกล่อง (Pedestal Post):** เสาประดับบัวขอบทอง พร้อมเถาวัลย์ดอกไม้เลื้อยพันรอบเสา
  - **ตัวกล่อง (Mailbox Body):** ทรงโค้งมน `MeshPhysicalMaterial` (Velvet Enamel Clearcoat) ประดับซุ้มขอบทองโรสโกลด์
  - **ช่องกระจกรูปหัวใจด้านข้าง & รูกุญแจ:** เรืองแสงสีทอง-ชมพูอุ่นๆ จากไฟ `PointLight` ภายในกล่องที่กระพริบหายใจเบาๆ
  - **ธงหัวใจ (Heart Flag Pivot):** ก้านทองพร้อมป้ายรูปหัวใจด้านขวาของกล่อง หมุนดีดขึ้นจากแนวนอนเป็นแนวตั้งเมื่อเปิดกล่อง
  - **บานประตูหน้า (Door Pivot):** บานพับด้านล่างพร้อมกลอนหัวใจทอง เปิดพับลงด้านหน้า 110° อย่างนุ่มนวล
  - **Inner Light Beam:** กรวยแสง (Volumetric-style Additive Cone Shader) พุ่งออกจากปากกล่องเมื่อประตูเปิดออก

### 4.4 ซองจดหมาย 3 มิติ & ตราครั่งหัวใจ (`src/scene/createEnvelope.js`)
- ซองจดหมายสีครีมมุกขอบทอง 3 มิติ (`DoubleSide` + ผิวกระดาษละเอียด)
- **ฝาซองพับบน (Flap Pivot):** พับเปิดออก 145° เมื่อแกะซอง
- **ตราประทับครั่งรูปหัวใจ (Wax Heart Seal):** รูปหัวใจนูน 3 มิติสีชมพูแดงเงา พร้อมวงแหวนประกายล้อมรอบ เมื่อผู้ใช้แตะ ตราครั่งจะสั่นเล็กน้อยแล้วแตกสลายเป็นประกายเพชร
- **แผ่นกระดาษจดหมายเรืองแสง & หัวใจ 3 มิติ:** เลื่อนลอยขึ้นจากด้านในซอง พร้อมหัวใจคริสตัล 3 มิติลอยเต้นจังหวะเหนือการ์ดข้อความ

### 4.5 องค์ประกอบมีชีวิต (`src/scene/createLivingParticles.js`)
- **ผีเสื้อคริสตัล 3 มิติ (10 ตัว):** ปีกซ้าย-ขวาแยก Pivot กระพือปีกตามเฟสเฉพาะตัว (Shader/Transform) สีปีกโปร่งแสงเหลือบมุก-ชมพู-ฟ้า บินวนตามเส้นโค้ง 3 มิติรอบกล่องจดหมาย และหันทิศเข้าหาจุดที่ผู้ใช้แตะหน้าจอ
- **หิ่งห้อย & ละอองดาว (450+ อนุภาค):** ลอยขึ้นช้าๆ พร้อมการส่ายไซน์และกระพริบสว่าง
- **กลีบกุหลาบ 3 มิติ (`InstancedMesh`):** กลีบโค้งสีชมพู-ทอง 70+ กลีบ ปลิวหมุนรอบเกาะตลอดเวลา
- **ฟองหัวใจเรืองแสง (Heart Orbs):** หัวใจโปร่งแสงขนาดจิ๋วลอยขึ้นจากสวนดอกไม้

### 4.6 พลุหัวใจ 3 มิติ & เอฟเฟกต์การแตะ (`src/scene/createFireworksAndBursts.js`)
- **3D Heart Fireworks:** ยิงเส้นแสงจากขอบเกาะขึ้นสู่ท้องฟ้า เมื่อถึงจุดสูงสุดจะแตกเป็นรูปหัวใจ 3 มิติ (Parametric Heart Curve ในพื้นที่ 3 มิติ) หลายเฉดสีพร้อมแรงโน้มถ่วงและหางแสงที่ค่อยๆ จางลง
- **Tap Magic Burst:** เมื่อผู้ใช้แตะจุดใดก็ได้บนหน้าจอ ระบบ Raycast ลงบนระนาบ 3 มิติรอบจุดศูนย์กลางฉาก เพื่อระเบิดอนุภาคละอองดาว ณ ตำแหน่งนิ้วทันที

---

## 5. State Machine, การควบคุมบนมือถือ และระบบเสียง

### ลำดับสถานะ (4-Act State Machine)
1. **`IDLE_EXPLORE` (สำรวจและแตะเล่น):**
   - กล้องแสดงกล่องจดหมายเต็มเฟรมพอดีกับจอมือถือแนวตั้ง (`fov` ปรับอัตโนมัติตาม Aspect Ratio เพื่อไม่ให้กล่องโดนขอบจอตัดเมื่อเปิดในจอมือถือแคบ)
   - ผู้ใช้หมุนกล้อง 360° และซูมดูรายละเอียดได้อิสระ (`OrbitControls` พร้อม Damping, จำกัด `minPolarAngle`/`maxPolarAngle` ไม่ให้มุดทะลุใต้พื้นน้ำลึกเกินไป)
   - ข้อความชวนโต้ตอบเบาๆ ด้านล่าง: `"หมุนชมรอบๆ หรือแตะที่กล่องจดหมาย"`
   - แยกแยะ Gesture ด้วยระยะลาก (`pointerdown -> pointerup < 10px` จึงนับเป็น Tap) เพื่อป้องกันการเผลอเปิดกล่องขณะลากหมุนกล้อง
2. **`OPENING_MAILBOX` (เปิดกล่องจดหมาย ~2.2 วินาที):**
   - กล้องเคลื่อนตัวนุ่มนวลมาด้านหน้ากล่องจดหมาย -> ธงหัวใจดีดตัวขึ้น -> กลอนหมุนและบานประตูหน้าพับเปิด -> ลำแสงพุ่งออกพร้อมผีเสื้อและกลีบกุหลาบ -> ซองจดหมาย 3 มิติลอยหมุนออกมากลางเฟรม
3. **`ENVELOPE_READY` (รอแกะซอง):**
   - ซองจดหมาย 3 มิติลอยหายใจเบาๆ กลางจอ พร้อมแสงรัศมีรอบตราครั่งหัวใจ
   - ข้อความแนะนำ: `"แตะที่ตราหัวใจเพื่อเปิดซอง"` (แตะได้ทั้งตัวซองหรือตราหัวใจ)
4. **`UNFOLDING_FINALE` (แกะซอง & เผยคำว่า "รักนะจุ๊บๆ"):**
   - ตราหัวใจแตกเป็นประกายเพชร -> ฝาซองพับเปิด 3 มิติ -> แสงออโรร่าสว่างขึ้น + พลุหัวใจ 3 มิติยิงต่อเนื่องหลายชุด
   - การ์ดกระจกคริสตัลโปร่งแสงพร้อมกรอบทองบางเบาและข้อความ **"รักนะจุ๊บๆ"** ค่อยๆ ปรากฏกลางหน้าจออย่างคมชัด พร้อมหัวใจ 3 มิติเต้นจังหวะด้านบน
   - เปิดโหมด **"แตะหน้าจอเพื่อจุดพลุหัวใจเพิ่ม"** ได้ไม่จำกัด พร้อมปุ่มขนาดกะทัดรัดมุมล่างสำหรับ **"เปิดดูอีกรอบ"** (Reset State กลับไป `IDLE_EXPLORE` อย่างนุ่มนวล)

### ระบบเสียง (Procedural WebAudio Engine - `src/audio/soundEngine.js`)
- เริ่มทำงานเมื่อผู้ใช้แตะจอครั้งแรกเท่านั้น (รองรับนโยบาย Autoplay ของ iOS Safari / Android Chrome)
- ปุ่มควบคุมเสียงมุมขวาบน (`เปิด/ปิดเสียง`)
- สังเคราะห์ท่วงทำนองกล่องดนตรี (Music Box Arpeggio ในบันไดเสียง Major อบอุ่น) ร่วมกับ Sound Effects:
  - เสียงประกายระยิบระยับเมื่อแตะจอ (`Tap Sparkle`)
  - เสียงกลไกเปิดกล่อง + กระดิ่งวิเศษ (`Mailbox Open Chime`)
  - เสียงคลี่ซองและพลุแตกตัวนุ่มๆ (`Seal Break & Firework Pop`)

---

## 6. โครงสร้างไฟล์โปรเจกต์

```text
magic-3d-mailbox/
├── .github/
│   └── workflows/
│       └── deploy.yml                  # GitHub Actions build & deploy to GitHub Pages
├── docs/
│   └── superpowers/
│       ├── specs/
│       │   └── 2026-11-13-magic-3d-mailbox-design.md
│       └── plans/
├── index.html                          # Entry HTML + Thai Fonts + Mobile Viewport + Overlay UI
├── package.json
├── vite.config.js                      # Base path '/magic-3d-mailbox/'
└── src/
    ├── main.js                         # App bootstrap, WebGL renderer, Resize/Responsive FOV, State Machine
    ├── styles.css                      # Mobile-first CSS, 100dvh, Safe-Area, Glass Card, Typography
    ├── audio/
    │   └── soundEngine.js              # Procedural Music Box + SFX Synthesizer
    ├── scene/
    │   ├── createSkyAndAurora.js       # Sky Dome, Stars, Shooting Stars, Aurora Shader
    │   ├── createIslandAndWater.js     # Floating Island, Ripple Pond, Flowers, Lantern, Magic Rings
    │   ├── createMailbox.js            # 3D Mailbox, Flag, Door, Inner Light Beam, Vines
    │   ├── createEnvelope.js           # 3D Envelope, Flap, Wax Seal, Floating Heart
    │   ├── createLivingParticles.js    # 3D Butterflies, Fireflies, Rose Petals, Heart Orbs
    │   └── createFireworksAndBursts.js # 3D Heart Fireworks & Tap Magic Burst
    └── utils/
        ├── easing.js                   # Easing & math helpers
        └── qualityManager.js           # DPR capping & Adaptive FPS quality scaler
```

---

## 7. เกณฑ์ความสำเร็จและการตรวจสอบ (Verification Criteria)

1. **ความสวยงามและกราฟฟิค:** ท้องฟ้าออโรร่า 3 ชั้น, ดาวกระพริบ, ดาวตก, เกาะลอย, ผิวน้ำสะท้อนคลื่น, ดอกไม้เรืองแสง, ผีเสื้อ 3 มิติ, หิ่งห้อย, กลีบกุหลาบ, พลุหัวใจ 3 มิติ ทำงานครบและสมดุลแสง Bloom ไม่กลบตัวอักษร
2. **การแสดงผลบนมือถือ:** ทดสอบเปิดบน Playwright ขนาดมือถือ (`390x844` / `iPhone 13`) และ Desktop (`1280x800`) ครบทุก State (`IDLE_EXPLORE` -> `ENVELOPE_READY` -> `UNFOLDING_FINALE`) โดยไม่มี Scrollbar เกินขอบ ไม่มีปุ่ม/ข้อความถูกบัง และข้อความสุดท้ายแสดงเฉพาะคำว่า **"รักนะจุ๊บๆ"**
3. **การปรับปรุงประสิทธิภาพ:** Build production (`npm run build`) ผ่าน 0 error, ไม่มี runtime console errors ใน browser, DPR จำกัดไม่เกิน 2
4. **การเผยแพร่จริง:** Push ขึ้น GitHub `caboyza503za/magic-3d-mailbox`, GitHub Actions Deploy ผ่านสถานะ `success`, และเปิดหน้าเว็บ `https://caboyza503za.github.io/magic-3d-mailbox/` เพื่อตรวจยืนยันว่าโหลดขึ้นจริงบนโลกออนไลน์
