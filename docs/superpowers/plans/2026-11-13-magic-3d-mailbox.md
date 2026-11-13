# แผนการพัฒนา: เว็บกล่องจดหมาย 3 มิติ (Magic 3D Mailbox)

> **สำหรับผู้พัฒนา:** ทำตามแผนทีละ Task ตามลำดับ พร้อมตรวจสอบ Build และภาพหน้าจอจริงทั้ง Desktop และ Mobile ก่อนเผยแพร่ขึ้น GitHub Pages

**เป้าหมาย:** สร้างเว็บกล่องจดหมาย 3D ในธีมสวนเวทมนตร์ยามค่ำคืนและแสงออโรร่า ที่อัดแน่นด้วยกราฟฟิคมีชีวิตชีวา ลื่นไหลบนโทรศัพท์มือถือ และปิดท้ายด้วยซองจดหมายคลี่ออกพร้อมพลุหัวใจ 3 มิติ เผยคำว่า **"รักนะจุ๊บๆ"** แล้วเผยแพร่ผ่าน GitHub Pages

**สถาปัตยกรรม:** Vanilla ES Modules + Vite + Three.js (`WebGLRenderer`, `EffectComposer`, `UnrealBloomPass`) + Custom GLSL Shaders + Procedural WebAudio Synthesizer

**อ้างอิง Spec:** [2026-11-13-magic-3d-mailbox-design.md](file:///C:/Users/caboy/.gemini/antigravity/scratch/magic-3d-mailbox/docs/superpowers/specs/2026-11-13-magic-3d-mailbox-design.md)

---

### Task 1: ตั้งค่าโปรเจกต์ Vite, Dependencies, HTML และ Mobile-First CSS

**ไฟล์ที่เกี่ยวข้อง:**
- สร้าง: `package.json`
- สร้าง: `vite.config.js`
- สร้าง: `index.html`
- สร้าง: `src/styles.css`

**ขั้นตอนการทำงาน:**
1. สร้าง `package.json` พร้อม `scripts` (`dev`, `build`, `preview`) และติดตั้ง `three` กับ `vite` ด้วย `npm install`
2. สร้าง `vite.config.js` โดยตั้งค่า `base: '/magic-3d-mailbox/'` ให้ Asset และ Path ทำงานถูกต้องบน GitHub Pages
3. สร้าง `index.html`:
   - ตั้ง `lang="th"`, viewport `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover`
   - โหลดฟอนต์ `Mali` และ `Noto Sans Thai` จาก Google Fonts
   - วาง `<canvas id="scene-canvas">`, ปุ่มเสียงมุมขวาบน (`#audio-toggle`), ข้อความแนะนำแบบนุ่มนวลด้านล่าง (`#hint-pill`), การ์ดกระจกคริสตัลสำหรับแสดงข้อความ **"รักนะจุ๊บๆ"** (`#finale-card`), ปุ่ม **"เปิดดูอีกรอบ"** (`#replay-btn`) และ Fallback container กรณีบราวเซอร์ไม่รองรับ WebGL
4. สร้าง `src/styles.css`:
   - ใช้ชุดสี Midnight Botanicals & Rose-Gold, ความสูง `100dvh`, รองรับ `env(safe-area-inset-*)`
   - ป้องกัน Touch Scroll / Pull-to-refresh ซ้อนทับขณะหมุนโมเดล 3D (`touch-action: none`, `overscroll-behavior: none`)
   - ออกแบบ `#finale-card` ให้โปร่งแสงเห็นฉาก 3D และพลุหัวใจด้านหลังชัดเจน แต่ข้อความ **"รักนะจุ๊บๆ"** คมชัดเด่นสะดุดตาไม่โดนแสง Bloom กลบ
5. รัน `npx vite --version` เพื่อยืนยันเครื่องมือพร้อมใช้งาน

---

### Task 2: Utilities, Adaptive Quality และ Procedural WebAudio Engine

**ไฟล์ที่เกี่ยวข้อง:**
- สร้าง: `src/utils/easing.js`
- สร้าง: `src/utils/qualityManager.js`
- สร้าง: `src/audio/soundEngine.js`

**ขั้นตอนการทำงาน:**
1. สร้าง `src/utils/easing.js`: ฟังก์ชัน `clamp`, `lerp`, `damp`, `easeOutCubic`, `easeInOutCubic`, `easeOutBack`, `randomRange` สำหรับแอนิเมชันและกล้องที่นุ่มนวล
2. สร้าง `src/utils/qualityManager.js`:
   - จำกัด `pixelRatio` ไม่เกิน `2`
   - ตรวจวัด FPS เฉลี่ย หากเฟรมเรตตกต่ำกว่าเกณฑ์บนมือถือรุ่นเล็ก สามารถลดความแรง/ขนาดเรนเดอร์ของ Bloom และอัตราการเกิดพาร์ติเคิลรองโดยไม่กระทบกล่องจดหมายหลัก
3. สร้าง `src/audio/soundEngine.js`:
   - ใช้ `AudioContext` แบบปลดล็อกเมื่อผู้ใช้แตะจอครั้งแรก
   - สังเคราะห์ท่วงทำนองกล่องดนตรี (Music Box) อบอุ่นละมุนด้วย Sine + Soft Triangle Harmonics + Delay/Echo เบาๆ
   - สร้าง SFX: `playTapSparkle()`, `playMailboxOpen()`, `playSealBreak()`, `playFireworkPop()` และฟังก์ชัน `toggleMute()`

---

### Task 3: ท้องฟ้ากาแล็กซี่ แสงออโรร่า และเกาะลอยสวนดอกไม้เรืองแสง

**ไฟล์ที่เกี่ยวข้อง:**
- สร้าง: `src/scene/createSkyAndAurora.js`
- สร้าง: `src/scene/createIslandAndWater.js`

**ขั้นตอนการทำงาน:**
1. สร้าง `src/scene/createSkyAndAurora.js`:
   - Sky Dome GLSL Shader: ท้องฟ้าเนบิวลากลางคืนสีน้ำเงิน-ม่วงคราม `#07091A` -> `#111638`
   - Starfield Shader Points: ดาว 1,400+ ดวงกระพริบหลายขนาดและเฉดสีพาสเทล
   - Shooting Stars: ดาวตก 3 เส้นวิ่งผ่านฟ้าเป็นระยะ
   - Aurora Ribbons: แผ่นม่านออโรร่า 3 ชั้นเหนือท้องฟ้า ใช้ GLSL Noise สร้างคลื่นพริ้วไหวและสามารถเพิ่มความสว่าง (`setIntensityBoost`) ในจังหวะ Finale ได้
2. สร้าง `src/scene/createIslandAndWater.js`:
   - เกาะลอยทรงออร์แกนิก (เนินหญ้าครามเข้มด้านบน + แท่งคริสตัลเรืองแสงห้อยด้านล่าง)
   - Moonlit Ripple Pond: วงแหวนผิวน้ำรอบฐานกล่องจดหมาย ใช้ Custom GLSL Shader สร้างคลื่นน้ำกระเพื่อมและขอบเรืองแสง Fresnel
   - สวนดอกไม้เรืองแสง (`InstancedMesh`) + เกสรส่องสว่าง + เห็ดเรืองแสง + เถาวัลย์และผลึกคริสตัล พริ้วตามลมด้วย Vertex Shader
   - วงแหวนเวทมนตร์เรืองแสง (Magic Rune/Star Rings) หมุนสวนทางใต้ฐานกล่องจดหมาย
   - เสาตะเกียงแก้วโค้งด้านข้างพร้อมโคมไฟแกว่งเบาๆ และแสงอุ่น

---

### Task 4: กล่องจดหมายเวทมนตร์ 3 มิติ และซองจดหมาย 3 มิติ

**ไฟล์ที่เกี่ยวข้อง:**
- สร้าง: `src/scene/createMailbox.js`
- สร้าง: `src/scene/createEnvelope.js`

**ขั้นตอนการทำงาน:**
1. สร้าง `src/scene/createMailbox.js`:
   - เสาตั้งกล่องประดับบัวขอบทอง + เถาวัลย์ดอกไม้พันรอบเสา
   - ตัวกล่องทรงโค้ง `MeshPhysicalMaterial` (Velvet Plum Clearcoat) + ซุ้มขอบทองโรสโกลด์ `#F5C28B`
   - ช่องกระจกหัวใจด้านข้าง & รูกุญแจหน้าประตูที่ส่องแสงอุ่นจากไฟภายในกล่อง
   - ธงหัวใจ (`flagPivot`) หมุนดีดตั้งขึ้นได้
   - บานประตูหน้า (`doorPivot`) พับเปิดได้พร้อมกลอนทองและลำแสง Volumetric Light Cone พุ่งออกเมื่อเปิด
   - เมธอดควบคุม: `setOpenProgress(t)`, `setHoverPulse(t)`, `getHitMeshes()`
2. สร้าง `src/scene/createEnvelope.js`:
   - ตัวซองสีครีมมุกขอบทอง 3 มิติ + ฝาซองพับบน (`flapPivot`)
   - ตราประทับครั่งหัวใจนูน 3 มิติ (`sealPivot`) พร้อมวงแหวนแสงรอการแตะ
   - กระดาษจดหมายเรืองแสงเลื่อนขึ้นจากในซอง + หัวใจคริสตัล 3 มิติลอยเต้นจังหวะด้านบน
   - เมธอดควบคุม: `setEmergeProgress(t)`, `setUnfoldProgress(t)`, `getHitMeshes()`

---

### Task 5: องค์ประกอบมีชีวิต (ผีเสื้อ หิ่งห้อย กลีบกุหลาบ) และพลุหัวใจ 3 มิติ

**ไฟล์ที่เกี่ยวข้อง:**
- สร้าง: `src/scene/createLivingParticles.js`
- สร้าง: `src/scene/createFireworksAndBursts.js`

**ขั้นตอนการทำงาน:**
1. สร้าง `src/scene/createLivingParticles.js`:
   - ผีเสื้อคริสตัล 3 มิติ 10 ตัว (แยก Pivot ปีกซ้าย-ขวา กระพือปีกอิสระ บินโคจร 3 มิติรอบกล่องจดหมาย และรองรับ `attractTo(targetPos)` เมื่อแตะหน้าจอ)
   - หิ่งห้อยและละอองดาว 450+ อนุภาค (`ShaderMaterial` points)
   - กลีบกุหลาบโค้ง 3 มิติ 75 กลีบ (`InstancedMesh`) หมุนลอยขึ้นรอบเกาะ
   - ฟองหัวใจโปร่งแสงลอยขึ้นช้าๆ
2. สร้าง `src/scene/createFireworksAndBursts.js`:
   - ระบบพลุหัวใจ 3 มิติ (`launchHeartFirework(origin, target)`): ยิงลำแสงขึ้นฟ้าแล้วแตกตัวเป็นอนุภาคสมการหัวใจ 3 มิติหลากสีพร้อมแรงโน้มถ่วงและประกายระยิบ
   - `spawnTapBurst(worldPos)`: ระเบิดละอองดาวเมื่อแตะหน้าจอ
   - `spawnSealBurst(worldPos)` และ `spawnMailboxBurst(worldPos)` สำหรับจังหวะเปิดกล่องและแกะซอง

---

### Task 6: Main Loop, กล้องและ State Machine, ทดสอบ Playwright และ Deploy ขึ้น GitHub Pages

**ไฟล์ที่เกี่ยวข้อง:**
- สร้าง: `src/main.js`
- สร้าง: `.github/workflows/deploy.yml`

**ขั้นตอนการทำงาน:**
1. สร้าง `src/main.js`:
   - ตั้งค่า `WebGLRenderer` (`ACESFilmicToneMapping`), `EffectComposer` + `UnrealBloomPass` + `OutputPass`, ระบบไฟ (Hemisphere, Moonlight Directional, Mailbox Inner Light, Lantern Light, Envelope Spot)
   - Responsive Mobile Framing: คำนวณระยะกล้องและ FOV อัตโนมัติเมื่อ Aspect Ratio เป็นแนวตั้ง (`width < height`) เพื่อให้กล่องจดหมาย เกาะ และออโรร่าพอดีสวยงามบนหน้าจอมือถือ
   - `OrbitControls` พร้อม Damping + ตรรกะแยกแยะการแตะ (Tap `< 10px` movement) จากการลากหมุนชม 360°
   - State Machine 4 จังหวะ (`IDLE_EXPLORE` -> `OPENING_MAILBOX` -> `ENVELOPE_READY` -> `UNFOLDING_FINALE`) + โหมดแตะจุดพลุหัวใจเพิ่มใน Finale + ปุ่ม Replay
2. รัน `npm run build` ยืนยันไม่มี Compile/Bundle Error
3. ทดสอบและตรวจภาพจริงด้วย Playwright (`webapp-testing` + `web-visual-inspection`):
   - เปิด Vite preview server ทดสอบบนขนาดมือถือ (`iPhone 13` / `390x844`) และ Desktop (`1280x800`)
   - จับภาพหน้าจอทุก State (`IDLE_EXPLORE`, `ENVELOPE_READY`, `UNFOLDING_FINALE`) และตรวจสอบผ่าน `read_file` เพื่อเช็คความคมชัด สีสัน แสง Bloom การจัดวางข้อความ **"รักนะจุ๊บๆ"** และ 0 Console Errors
4. สร้าง `.github/workflows/deploy.yml` สำหรับ GitHub Pages, Commit โค้ดทั้งหมด, สร้าง Public Repo `caboyza503za/magic-3d-mailbox` ด้วย `gh repo create`, Push ขึ้น `main`, เปิดใช้งาน GitHub Pages และรอ Workflow Deploy จนสำเร็จ
5. ตรวจสอบ URL จริง `https://caboyza503za.github.io/magic-3d-mailbox/` ด้วย Playwright + `read_file` ก่อนส่งลิงก์ให้ผู้ใช้
