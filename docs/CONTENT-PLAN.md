# แผนข้อมูล JSON และตำรา Regex

วันที่ปรับปรุง: 2026-10-03

สถานะ: Prompt Converter สำหรับ Client เป็นทางเข้าเริ่มต้น; ตำรา Regex และข้อมูล API เป็นเนื้อหาอ้างอิงสำหรับผู้ที่ต้องการรายละเอียดเพิ่ม

## หลักการจัดเก็บ

- ไฟล์ Markdown เก็บแผน ข้อตกลง วิธีพัฒนา และเอกสารอ่านสำหรับคน ส่วนข้อมูลเนื้อหาที่ API ส่งออกเก็บใน JSON และตรวจ reference ตอนเริ่ม API
- `content/lessons.json` เป็นเนื้อหาบทเรียนหลักที่มีโครงสร้าง; `docs/REGEX-TEXTBOOK.md` เป็นฉบับเรียบเรียงสำหรับอ่านและตัวอย่างการใช้งาน หากแก้ข้อเท็จจริงให้ปรับทั้งคู่และตรวจไม่ให้ขัดกัน
- `content/patterns.json` แยก Pattern, flags, replacement, captures, ตัวอย่าง และข้อจำกัด เพื่อให้ผู้ใช้แอปคัดลอกค่าได้ และนักพัฒนาเรียกเป็น JSON ได้
- อ้างอิงแหล่งที่มาผ่าน `sourceRefs`; เขียนคำอธิบายและตัวอย่างใหม่ ไม่คัดลอกบทความมาเป็นฐานข้อมูล
- ไม่เก็บ secret, token, ข้อมูลรับรอง, เนื้อหาส่วนตัว, absolute local paths, ชื่อบัญชี/เครื่อง, IP ภายใน, หรือค่าจาก environment ลงในเอกสาร ตัวอย่าง หรือ logs

## กลุ่มข้อมูล

- `sources` — ชื่อแหล่งข้อมูล URL หัวข้ออ้างอิงและวันที่ตรวจ
- `lessons` — บทเรียน Regex ที่ระบุระดับ เนื้อหา แบบฝึกหัด และ `audiences` สำหรับ `app_user` กับ `developer`; `audienceNotes` ปรับคำอธิบายเฉพาะกลุ่มโดยใช้พื้นฐานบทเดียวกัน
- `patterns` — Pattern ที่นำไปใช้ได้ พร้อม `pattern`, `flags`, `replacement`, `captureGroups`, `explanation`, `instructions`, `examples` และ `limitations`
- `styles` และ `recipes` — โครงสร้างรองรับไว้สำหรับเนื้อหาสูตรในระยะถัดไป; ยังไม่ใช่ขอบเขตหลักของตำรารุ่นนี้
- `schemas` และ `releases` — แนวทางสำหรับการแยกไฟล์ schema และประกาศ content release เมื่อคลังโตขึ้น

## ลำดับตำรา Regex

1. Regex คืออะไรและใช้ทำอะไร
2. Pattern, flags และรูปแบบการเขียน
3. อักขระ ชุดตัวเลือก escape, quantifiers, groups และ anchors
4. กลุ่มจับและ replacement
5. Raw content, displayed text และลำดับการทำงานใน Rubii
6. วิธีปรับทีละจุดและทดสอบกรณีบวก/ลบ/ขอบ
7. เส้นทางใช้งานสำหรับผู้ใช้แอปและนักพัฒนา

Prompt Converter ใน `SkillPrompt.MD` ให้ผู้ใช้คัดลอกไปวางใน GPT, Gemini หรือ Claude แล้วเริ่มจากไอเดียหรือ Raw HTML/CSS เดินตาม workflow Rubii 6 ขั้น: วิเคราะห์สถาปัตยกรรม, ตั้ง Style tags, Global CSS, Regex, Default Styles 7 รายการ, และ Prompt โมเมนต์/First Message โดยตอบครั้งละหนึ่งขั้นและรอการตรวจยืนยันก่อนส่งขั้นถัดไป ค่าเริ่มต้นเน้นผลลัพธ์สำหรับ Client; ค่อยเพิ่มรายละเอียด Regex/JSON สำหรับ Developer เมื่อร้องขอ

## รูปแบบ Pattern

- ไม่ใส่ slash ครอบใน `pattern`; เก็บ `flags` แยก
- ใช้ `applyTo` และ `matchStage` เป็น enum ภายในตามตัวเลือกที่ตรวจได้จาก Rubii
- ระบุกลุ่มจับตามลำดับวงเล็บ พร้อมความหมายของแต่ละกลุ่ม
- แต่ละตัวอย่างบันทึก input, expected matches, expected captures และ expected output
- แยกหลักฐาน `documentary`, `node_tested` และ `rubii_tested`; การทดสอบ Node.js ไม่รับรองการ render ของ Rubii
- escape backslash ผ่าน JSON serializer และทดสอบไฟล์ JSON ก่อนเผยแพร่

## แหล่งอ้างอิงและข้อจำกัด

บทความ Rubii อธิบาย Regex สอง stage ได้แก่ raw content ก่อนขยาย Style tags และ displayed text หลังการจัดรูปแบบ รวมถึงลำดับกฎ ควรเก็บ stage และ order ชัดเจน ไม่อนุมาน behavior ที่เอกสารไม่ได้ยืนยัน [Styles & regex](https://rubii.ai/blog/styles-and-regex)

Styles cookbook ใช้เป็นแหล่งอ้างอิงสำหรับการพัฒนาสูตรในอนาคต แต่รอบนี้ไม่พยายามทำตำรา Styles, CSS หรือ recipe ให้ครบ [Styles cookbook](https://rubii.ai/blog/styles-cookbook)

Syntax ของ JavaScript RegExp อ้าง MDN และอาจต่างจาก engine อื่น ความแตกต่างนี้ต้องแสดงให้ชัดทั้งในบทเรียน, API metadata และ prompt สำหรับ AI:

- [MDN: JavaScript regular expressions guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions)
- [MDN: JavaScript regular expressions reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Regular_expressions)

## เกณฑ์รับเนื้อหา

- JSON parse ได้และทุก `sourceRefs` ชี้ไปยัง source ที่มีอยู่
- Pattern compile ใน engine ที่ระบุ และ expected examples ตรงกับผลทดสอบ
- บทเรียนอ่านเข้าใจได้โดยไม่ต้องเขียนโค้ด และมีแนวทางต่อสำหรับนักพัฒนา
- ข้อความ Rubii แยกจากคำอธิบาย JavaScript และไม่อ้างว่ารุ่น API นี้จำลอง Rubii renderer
- Prompt ใช้ได้โดยคัดลอก ไม่ต้องติดตั้งปลั๊กอินหรือแนบ secret
- ไม่มีข้อมูลสำคัญจากเครื่อง ข้อมูลรับรอง หรือข้อความส่วนตัวในเนื้อหา
