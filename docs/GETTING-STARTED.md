# เริ่มใช้งาน API ในเครื่อง

## ความต้องการ

- Node.js 24 LTS และ npm
- ครั้งแรกต้องติดตั้ง dependency ด้วย `npm install`

## รันแบบพัฒนา

```sh
npm run dev
```

ค่าเริ่มต้น bind ที่ `127.0.0.1:3000` และอ่าน `PORT`, `HOST` จาก environment หรือไฟล์ `.env` ที่ผู้ใช้สร้างเองจาก `.env.example` ได้ ไฟล์ `.env` ใช้เก็บการตั้งค่าเฉพาะเครื่องและถูก ignore โดย Git

## API หลัก

- `GET /healthz`
- `GET /v1/openapi.json`
- `GET /v1/lessons?q=regex&locale=th-TH&audience=app_user`
- `GET /v1/lessons?audience=developer`
- `GET /v1/lessons/regex-introduction`
- `GET /v1/patterns?category=status`
- `GET /v1/patterns/affection-number`
- `GET /v1/recipes/station-status-card`
- `GET /v1/recipes/dialogue-and-actions/export`
- `POST /v1/regex/test`

ผู้ใช้ Client เริ่มจากคัดลอก workflow ใน `SkillPrompt.MD` ไปวางใน GPT, Gemini หรือ Claude ได้ โดยไม่ต้องเรียน Regex ก่อน; ตำราอ้างอิงอยู่ใน `docs/REGEX-TEXTBOOK.md` พารามิเตอร์ `audience` รองรับเฉพาะ `app_user` และ `developer` ในรายการ lessons และเลือกว่าจะส่ง `audienceNotes` ส่วนใดกลับมา ถ้าไม่ส่งจะคืนคำอธิบายทั้งสองแบบ

ตัวอย่าง body สำหรับทดลอง Regex:

```json
{
  "pattern": "Affection[:：]\\s*(\\d{1,3})",
  "flags": "gi",
  "replacement": "Affection: $1",
  "input": "Affection: 72"
}
```

คำตอบทดลองส่ง match, captures, index และ output โดย index เป็น UTF-16 code units ตาม JavaScript ผลนี้เป็นการลอง JavaScript RegExp กับสตริง ไม่มีการ render HTML หรือจำลองขอบเขตข้อความของ Rubii

## Build

```sh
npm test
npm run typecheck
npm run build
npm start
```

ชุดทดสอบใช้ Node.js test runner ส่วน `typecheck` และ `build` ตรวจ TypeScript คำสั่ง `dev` รัน TypeScript จาก Node โดยตรง; เมื่อแก้โค้ดให้หยุดและเริ่มคำสั่งใหม่

## ขอบเขตการใช้งาน

รุ่นนี้เหมาะกับการพัฒนาและทดลองเฉพาะในเครื่อง API ยังไม่มี API key, authentication, rate limit แบบกระจาย, ระบบโควตาผู้ใช้ หรือ deployment configuration จึงยังไม่พร้อมเปิดรับคำขอจากเครือข่ายสาธารณะ อย่าเปลี่ยน `HOST` เป็น `0.0.0.0` จนกว่าจะเพิ่มการควบคุมการเข้าถึงและโควตา

Regex worker จำกัด 4 งานพร้อมกัน, 250 ms ต่องาน, input 16 KiB, pattern/replacement อย่างละ 2 KiB, 100 matches และ output 64 KiB คำขอที่เกินเพดานจะได้ error กลับ โดยข้อความ input ไม่ถูกเขียนลง application logs
