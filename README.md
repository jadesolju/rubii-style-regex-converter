# Styles & Regex Knowledge API

สถานะ: API รุ่นแรกพร้อมรันในเครื่อง ยังไม่เปิดรับ public traffic

เริ่มจาก Prompt Converter สำหรับ Client ที่พาออกแบบ Rubii Style & Regex ทีละขั้น พร้อมตำรา Regex และคลัง Pattern ผ่าน API สำหรับผู้ใช้แอปทั่วไปกับนักพัฒนา ส่วนตำรา Styles และ Cookbook จะเพิ่มในระยะถัดไป

## เอกสารและโค้ด

- แผน API และ Stack ฝั่งบริการ: `docs/API-PLAN.md`
- แผนข้อมูล JSON และเนื้อหาตำรา: `docs/CONTENT-PLAN.md`
- Prompt Converter สำหรับคัดลอกไปใช้กับ GPT, Gemini หรือ Claude: `SkillPrompt.MD`
- ตำรา Regex ภาษาไทยประกอบการเรียนรู้: `docs/REGEX-TEXTBOOK.md`
- วิธีเริ่มใช้งาน: `docs/GETTING-STARTED.md`
- API contract: `src/openapi.json`, ให้บริการที่ `/v1/openapi.json`
- เนื้อหาตัวอย่าง: `content/`

## เริ่มต้น

ต้องติดตั้ง Node.js 24 LTS และ npm ก่อน จากนั้นรัน:

```sh
npm install
npm run dev
```

API จะเริ่มที่ `http://localhost:3000` ใช้ `npm run typecheck` ตรวจชนิดข้อมูล และ `npm run build && npm start` สำหรับโหมด build

รันชุดทดสอบด้วย `npm test`.

ดูคำสั่งและ endpoint ทั้งหมดใน `docs/GETTING-STARTED.md`.

## ข้อตกลง

- เอกสารแผนและข้อสรุปเก็บเป็น Markdown
- เนื้อหาที่ API ใช้งานเก็บเป็น JSON และตรวจ reference ตอนเริ่ม API
- ไม่บันทึกข้อมูลสำคัญในเครื่อง ข้อมูลรับรอง หรือรายละเอียดสภาพแวดล้อมส่วนตัว
- รายละเอียด API และชื่อฟิลด์ในเอกสารเป็นข้อเสนอของโครงการ ไม่ใช่ API หรือ schema ทางการของ Rubii
- API ยังไม่มี authentication หรือโควตา จึงตั้งค่าให้รับคำขอจากเครื่องนี้เท่านั้น
