# Design.MD: ระบบ Regex ตำราคู่มือแบบสำเร็จรูป (Regex Handbook & Recipe Studio)

> **รูปแบบดีไซน์**: Minimal + Glassmorphism  
> **เทคโนโลยีสไตล์**: Tailwind CSS  
> **แนวทางสถาปัตยกรรม**: Dynamic Data-Driven (100% Zero Hardcode)  
> **สถานะ**: ข้อกำหนดการออกแบบและแผนพัฒนา (Architecture & Design Specification)

---

## 1. บทนำและวิสัยทัศน์ (Executive Summary & Vision)

โครงการ **"ระบบ Regex ตำราคู่มือแบบสำเร็จรูป" (Regex Handbook & Recipe Studio)** พัฒนาต่อยอดจากโครงสร้าง API และคลังข้อมูลของ `rubii-style-regex-converter` โดยมีเป้าหมายเพื่อสร้างแพลตฟอร์มการเรียนรู้ ค้นหา ทดสอบ และนำ Regex สำเร็จรูปไปประยุกต์ใช้งานจริงได้อย่างสะดวกรวดเร็ว

### เป้าหมายหลัก
1. **Interactive Handbook (ตำราคู่มือมีชีวิต)**: เรียนรู้ Regex ทีละขั้น มีตัวอย่างที่กดรันได้จริง และมีคำอธิบายแยกกลุ่มผู้ใช้ (`app_user` และ `developer`)
2. **Ready-Made Recipe Catalog (คลังสูตรสำเร็จรูป)**: รวบรวม Pattern และ Recipe พร้อมใช้งาน แบ่งตามหมวดหมู่ (status, dialogue, cleanup, formatting ฯลฯ) พร้อมติดตั้ง 1-Click
3. **Live Sandbox & Visual Dissect (ห้องทดลองตรวจผลแบบ Real-time)**: ทดสอบ Regex ทันที แสดงไฮไลต์ตำแหน่งที่ Match และ Capture Groups ($1, $2, ...) ด้วยสีเฉพาะแบบกระจกโปร่งแสง
4. **No-Hardcode Dynamic Architecture**: เนื้อหาทั้งหมดถูกดึงจาก JSON Schemas และ Fastify REST API สามารถเพิ่มสูตรใหม่ได้ทันทีโดยไม่ต้องแก้ไขหน้า UI
5. **Minimal + Glassmorphism Aesthetic**: หน้าตาทันสมัย สวยสะกดตา หรูหรา เรียบง่าย ด้วยเลเยอร์กระจกฝ้า แสงสะท้อนเรืองรอง (Neon Glow) และโทนสี Dark Mode ระดับพรีเมียม

---

## 2. ระบบการออกแบบ (Design System: Minimal + Glassmorphism)

การออกแบบยึดหลัก **"Simplicity with Depth"** ผสมผสานความเรียบง่ายแบบ Minimalist เข้ากับมิติความลึกของ Glassmorphism ผ่าน Tailwind CSS

```
+-------------------------------------------------------------------------------+
|                             BACKGROUND MESH GRADIENT                          |
|   (Deep Obsidian #090d16 + Ambient Glow Blobs: Cyan, Indigo, Violet)          |
|                                                                               |
|   +--------------------------+  +-----------------------------------------+   |
|   |   FROSTED GLASS SIDEBAR  |  |           MAIN GLASS CONTAINER          |   |
|   |   - backdrop-blur-xl     |  |   - backdrop-blur-2xl                   |   |
|   |   - bg-slate-900/40      |  |   - bg-slate-900/50                     |   |
|   |   - border-white/10      |  |   - border-white/10                     |   |
|   |   - Specular Inner Glow  |  |   - Soft Ambient Drop Shadow            |   |
|   +--------------------------+  +-----------------------------------------+   |
+-------------------------------------------------------------------------------+
```

### 2.1 โทนสีและ Palette (Color Palette)

| บทบาทสี | ค่าสี (Tailwind / Hex) | การใช้งาน |
|---|---|---|
| **Base Background** | `bg-[#080c14]` / `bg-slate-950` | พื้นหลังหลักของระบบ มืดสนิท นุ่มสายตา |
| **Glass Background** | `bg-slate-900/40` ถึง `bg-slate-900/70` | พื้นหลังแผ่นกระจกฝ้า สำหรับการ์ดและพาเนล |
| **Glass Border** | `border-white/10` / `border-slate-700/50` | เส้นขอบบางเฉียบสร้างมิติสะท้อนแสง |
| **Primary Accent** | `text-cyan-400` / `from-cyan-500 to-blue-600` | ปุ่มแอคชันหลัก, ไฮไลต์ Match, ค่า $1 |
| **Secondary Accent**| `text-indigo-400` / `from-indigo-500 to-purple-600` | หมวดหมู่, แท็ก, ค่า $2 |
| **Tertiary Accent** | `text-fuchsia-400` / `from-fuchsia-500 to-pink-600` | ตัวแปรพิเศษ, ค่า $3 |
| **Success / Match** | `text-emerald-400` / `bg-emerald-500/15` | ผลทดสอบผ่าน, ข้อความที่ถูกตรวจจับ |
| **Alert / Warning** | `text-amber-400` / `bg-amber-500/15` | ข้อจำกัด (Limitations), คำเตือน Performance |
| **Error** | `text-rose-400` / `bg-rose-500/15` | Regex Syntax Error, Worker Timeout |

### 2.2 ตัวพิมพ์ (Typography)
- **UI & Reading**: `Plus Jakarta Sans`, `Prompt` หรือ `Kanit` (ฟอนต์สะอาด คมชัด รองรับภาษาไทยสมบูรณ์แบบ)
- **Code & Regex Expressions**: `Fira Code`, `JetBrains Mono` หรือ `monospace` (มี Ligatures ชัดเจน แยกแยะ `\d`, `()`, `[]`, `{}` ได้แม่นยำ)

### 2.3 ชั้นของกระจก (Glassmorphism Elevation Layers)

1. **Layer 0 (Canvas)**: Background Mesh ที่มี Ambient Radial Gradient เคลื่อนไหวช้า ๆ
2. **Layer 1 (Card & Sidebar Panels)**: `backdrop-blur-xl bg-slate-900/40 border border-white/10 shadow-2xl shadow-black/40`
3. **Layer 2 (Inputs, Codeboxes, Dropdowns)**: `backdrop-blur-md bg-slate-950/60 border border-white/5 focus-within:border-cyan-500/50`
4. **Layer 3 (Modals & Overlays)**: `backdrop-blur-2xl bg-slate-950/80 border border-white/15 shadow-[0_0_50px_rgba(0,0,0,0.8)]`

---

## 3. สถาปัตยกรรมแบบ Zero-Hardcode (Dynamic Data-Driven Architecture)

ทุกองค์ประกอบของระบบจะโหลดผ่าน **Data Models** และ **Fastify REST API (`/v1`)** โดยตรง ไม่ฝังค่าคงที่ในโค้ด UI

```
                      +-----------------------------+
                      |     content/*.json Data     |
                      |  - lessons.json             |
                      |  - patterns.json            |
                      |  - recipes.json             |
                      |  - styles.json              |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |     Fastify API Engine      |
                      |  /v1/lessons (query, filter)|
                      |  /v1/patterns (search, cat) |
                      |  /v1/recipes (bundle export)|
                      |  /v1/regex/test (Worker)    |
                      +--------------+--------------+
                                     |
                                     v
                      +-----------------------------+
                      |   Frontend Dynamic Client   |
                      |  - Auto-generated Filters   |
                      |  - Dynamic Form Inputs      |
                      |  - Schema-driven Renderers  |
                      |  - Reactive State Store     |
                      +-----------------------------+
```

### 3.1 โครงสร้างการเชื่อมต่อข้อมูล Dynamic
- **หมวดหมู่ (Categories)**: รวมและสร้าง Dropdown/Filter Pills อัตโนมัติจากค่า `category` ในข้อมูลจริง
- **ระดับความยาก (Levels)**: ดึงค่า `beginner`, `intermediate`, `advanced` สร้างตัวกรองพร้อม Badge สีตามระดับ
- **กลุ่มเป้าหมาย (Audience)**: สลับมุมมอง `app_user` (เน้นวิธีใช้ภาษาเข้าใจง่าย) หรือ `developer` (เน้น RegExp Engine, Performance, Memory) แบบ Real-time
- **Capture Groups ($1, $2, ...)**: สร้างตารางและแท็กสีตามจำนวน `captureGroups` ที่นิยามในสูตร
- **Limitations & Explanation**: เรนเดอร์เป็น Accordion หรือ Step List อัตโนมัติตาม Array ใน JSON

---

## 4. โครงสร้างคอมโพเนนต์ Tailwind CSS (Tailwind Component Blueprint)

### 4.1 Reusable Glass Utility Classes (Tailwind Config / CSS Recipes)

```css
/* Glassmorphic Core Utilities */
.glass-panel {
  @apply backdrop-blur-xl bg-slate-900/50 border border-white/10 shadow-xl shadow-black/40 rounded-2xl;
}

.glass-panel-hover {
  @apply transition-all duration-300 hover:bg-slate-900/70 hover:border-white/20 hover:shadow-cyan-500/10 hover:-translate-y-0.5;
}

.glass-input {
  @apply backdrop-blur-md bg-slate-950/60 border border-slate-700/60 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-2.5 outline-none transition-all duration-200 focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/20 font-mono text-sm;
}

.glass-button-primary {
  @apply relative overflow-hidden backdrop-blur-md bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-medium px-5 py-2.5 rounded-xl shadow-lg shadow-cyan-500/25 transition-all duration-200 active:scale-95 disabled:opacity-50;
}

.glass-button-secondary {
  @apply backdrop-blur-md bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 px-4 py-2.5 rounded-xl transition-all duration-200 active:scale-95;
}

.glass-badge-cyan {
  @apply px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm bg-cyan-500/15 text-cyan-300 border border-cyan-500/30;
}

.glass-badge-purple {
  @apply px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm bg-indigo-500/15 text-indigo-300 border border-indigo-500/30;
}

.glass-badge-emerald {
  @apply px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-sm bg-emerald-500/15 text-emerald-300 border border-emerald-500/30;
}
```

---

## 5. การจัดผังหน้าจอและการทำงานของแต่ละโมดูล (UI Modules & Layout)

### 5.1 ผังหน้าจอหลัก (Master Layout Grid)

```
+-------------------------------------------------------------------------------------+
| [Logo: RegexStudio]  [Search / Filter Bar...]  [Audience: User/Dev]  [API Status: OK] |
+-------------------------------------------------------------------------------------+
| SIDEBAR NAVIGATOR           | MAIN CONTENT WORKSPACE                                |
|                             |                                                       |
| [Tab: ตำราคู่มือ Handbook]    | [HEADER: Title, Category, Difficulty Badge, Actions]  |
| [Tab: คลังสูตร Recipes]     |                                                       |
| [Tab: ห้องทดลอง Sandbox]    | +---------------------------------------------------+ |
|                             | | 1. PATTERN & FORMULA CARD                         | |
| --- รายการบทเรียน/สูตร ---  | |    Pattern:  [ Affection[:：]\s*(\d{1,3})       ] | |
| > พื้นฐาน Regex             | |    Flags:    [ gi ]   Replacement: [ Affection: $1 ] | |
| > การจับตัวเลขสถานะ         | +---------------------------------------------------+ |
| > การจัดบทสนทนา             | | 2. INTERACTIVE LIVE TESTER & HIGHLIGHT ENGINE     | |
| > การล้างข้อความที่ไม่ต้องการ| |    Input Text:                                    | |
|                             | |    [ Affection: 72 -> [MATCH HIGHLIGHTED]       ] | |
|                             | |    Replaced Output: [ Affection: 72 ]             | |
|                             | +---------------------------------------------------+ |
|                             | | 3. TOKEN BREAKDOWN & EXPLANATION ACCORDION        | |
|                             | | 4. RUBII INSTALLATION STEPS & JSON BUNDLE EXPORT  | |
+-------------------------------------------------------------------------------------+
```

---

### 5.2 โมดูลที่ 1: ตำราคู่มือแบบมีชีวิต (Interactive Handbook Module)

- **Dynamic Lesson Browser**: แสดงบทเรียนจาก `/v1/lessons` จัดกลุ่มตาม `category`
- **Audience Context Switching**:
  - เมื่อเลือก `app_user`: แสดงคำอธิบายเปรียบเทียบเชิงพฤติกรรม ไม่เน้นศัพท์เทคนิค
  - เมื่อเลือก `developer`: แสดงรายละเอียด ECMAScript RegExp, Flags, Memory, Group indexing
- **Interactive Section Breakdown**: แต่ละหัวข้อย่อยมีกล่องตัวอย่างโค้ดที่สามารถกด `Send to Sandbox` เพื่อลองแก้และดูผลได้ทันที
- **Exercise & Challenge Engine**: มีแบบฝึกหัดท้ายบทพร้อมระบบเฉลยแบบ Dynamic Reveal

---

### 5.3 โมดูลที่ 2: คลังสูตรและ Pattern สำเร็จรูป (Ready-made Recipe Catalog)

- **Search & Multi-Facet Filtering**:
  - ค้นหาแบบ Full-text (ภาษาไทยและอังกฤษ)
  - กรองตามหมวดหมู่ (ดึงหมวดหมู่แบบ Dynamic จากข้อมูลจริง)
  - กรองตามระดับ (Beginner, Intermediate, Advanced)
- **Recipe Cards Layout**:
  - การ์ดแบบ Glassmorphism แสดงชื่อ, คำอธิบายย่อ, Badge ระดับ, แท็กหมวดหมู่
  - ปุ่ม Quick Actions: **1-Click Copy Regex**, **Quick Test**, **View Blueprint**
- **Detailed Recipe Drawer / Modal**:
  - **Capture Groups Dissection**: ตารางแยกแจงความหมายของ `$1`, `$2`
  - **Step-by-step Explanation**: แจกแจงการทำงานของแต่ละ Token
  - **Limitations & Gotchas**: รายการข้อจำกัดและกรณีที่ไม่ควรใช้
  - **Rubii Style Configuration**: ข้อมูลสำหรับกรอกในช่อง Rubii (Apply to, Match Stage, Style Tags)

---

### 5.4 โมดูลที่ 3: ห้องทดลองและตัวตรวจผลสด (Real-time Live Sandbox & Highlighter)

- **Real-time Worker Testing**: เชื่อมโยงกับ `/v1/regex/test` มีระบบ Worker Sandbox ป้องกัน ReDoS (Regex Denial of Service) ปลอดภัย 100%
- **Visual Highlighter Engine**:
  - ทำไฮไลต์ข้อความที่ Match ได้แบบโปร่งแสงสวยงาม
  - แยกสีของ Capture Groups อย่างชัดเจน (กลุ่ม 1 = Cyan, กลุ่ม 2 = Violet, กลุ่ม 3 = Amber)
- **Instant Replacement Preview**: แสดงผลลัพธ์หลังทำการ Replace ทันที พร้อมแสดง Diff หรือ Result Box
- **Preloaded Test Cases Runner**: รันชุดตัวอย่าง `examples` ที่ผูกกับสูตรอัตโนมัติ เพื่อยืนยันความถูกต้องแบบ Green/Red Status

---

### 5.5 โมดูลที่ 4: ตัวแปลงและสร้าง Recipe Bundle (Export & Converter)

- **1-Click JSON Bundle Export**: ดาวน์โหลดโครงสร้าง JSON สำหรับนำไป Import หรือต่อยอดผ่าน API
- **SkillPrompt Integration**: มีปุ่มคัดลอก Prompt Template สำหรับนำไปวางใน ChatGPT / Gemini / Claude เพื่อสร้าง Pattern เพิ่มเติมได้อย่างแม่นยำ

---

## 6. สัญญาข้อมูลและสคีมา (Data Contracts & Schemas)

ระบบยึดตาม Data Contract ของ API ดังนี้:

### 6.1 Pattern Entity Schema
```typescript
interface PatternItem {
  id: string;
  schemaVersion: number;
  revision: number;
  locale: string;
  status: "draft" | "review" | "published";
  title: string;
  summary: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced";
  pattern: string;
  flags: string;
  replacement: string;
  applyTo: "all" | "user" | "character";
  matchStage: "raw" | "display";
  captureGroups: Array<{ index: number; meaning: string }>;
  explanation: string[];
  instructions: string[];
  examples: Array<{
    input: string;
    expectedMatches: string[];
    expectedCaptures: string[][];
    expectedOutput: string;
  }>;
  limitations: string[];
  sourceRefs: string[];
}
```

### 6.2 Recipe Entity Schema
```typescript
interface RecipeItem {
  id: string;
  schemaVersion: number;
  revision: number;
  locale: string;
  status: "published" | "draft";
  title: string;
  summary: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced";
  settingInstructions: string[];
  openingExample: string;
  patternRefs: string[];
  styleRefs: string[];
  ruleOrder: Array<{ kind: "pattern" | "style"; id: string }>;
  installationSteps: string[];
  sourceRefs: string[];
}
```

### 6.3 Regex Test Request / Response Contract
```typescript
// POST /v1/regex/test
interface RegexTestPayload {
  pattern: string;
  flags: string;
  replacement: string;
  input: string;
}

interface RegexTestResponse {
  data: {
    matched: boolean;
    matchCount: number;
    matches: Array<{
      match: string;
      index: number;
      groups: string[];
    }>;
    output: string;
    executionTimeMs: number;
  };
  meta: {
    engine: string;
    contentVersion: string;
  };
}
```

---

## 7. แผนการดำเนินงานและลำดับขั้นตอนการสร้าง (Implementation Roadmap)

| ขั้นตอน | รายละเอียดงาน | ผลลัพธ์ที่ได้ |
|---|---|---|
| **ระยะที่ 1: การวางรากฐาน (Foundation)** | กำหนด Tailwind CSS Theme Tokens, Glassmorphic Styles, Background Mesh, การจัดการฟอนต์ภาษาไทยและ Code Font | ไฟล์สไตล์และ Design Tokens พื้นฐาน |
| **ระยะที่ 2: Dynamic Data Client Layer** | สร้าง Data Store และ API Client เชื่อมต่อ Fastify Endpoints (`/v1/lessons`, `/v1/patterns`, `/v1/recipes`, `/v1/regex/test`) | Service ดึงข้อมูลแบบ 0% Hardcode |
| **ระยะที่ 3: Glass UI Components** | สร้างคอมโพเนนต์ GlassCard, GlassModal, GlassTabs, Dynamic Filter Bar, Syntax Highlighter | คลัง UI Component สไตล์ Glassmorphism |
| **ระยะที่ 4: Feature Modules Assembly** | ประกอบหน้า Handbook (ตำรา), Recipe Catalog (คลังสูตร), Live Sandbox (ห้องทดลอง) และระบบ Export | ระบบเว็บแอปพลิเคชันตัวเต็มที่สมบูรณ์ |
| **ระยะที่ 5: Testing & Quality Assurance** | ทดสอบความถูกต้องของ Regex Test Engine, ตรวจสอบ Responsive Design บนทุกอุปกรณ์ และยืนยันความปลอดภัยของ Worker Sandbox | ระบบที่พร้อมใช้งานและถูกต้องตามสเปก |

---

## 8. กฎเหล็กการพัฒนาและความปลอดภัย (Engineering Guidelines)

1. **ห้าม Hardcode ข้อมูลสูตรหรือบทเรียน**: ข้อมูลทั้งหมดต้องมาจาก JSON Data / API เท่านั้น
2. **รักษาความสมบูรณ์ของโค้ดเดิม**: ยึดกฎความเข้ากันได้ 100% ไม่แก้ไขหรือลบฟังก์ชันเดิมของ Fastify API โดยไม่จำเป็น
3. **Safe Regex Execution**: การทดสอบ Regex จากผู้ใช้ต้องผ่าน Worker Thread ที่มี Timeout และ Output Size Limit เสมอ
4. **Accessibility & Contrast**: แม้ใช้ดีไซน์ Glassmorphism แต่ Contrast ของตัวหนังสือกับพื้นหลังต้องผ่านมาตรฐาน WCAG AA เพื่อให้อ่านง่ายทั้งกลางวันและกลางคืน
