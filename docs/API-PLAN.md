# แผน API และ Stack ฝั่งบริการ

วันที่จัดทำ: 2026-10-03

สถานะ: API รุ่นแรกทำงานในเครื่องแล้ว ยังไม่มี public access

รุ่นแรกใช้ Node.js 24 LTS, TypeScript, Fastify, Ajv, JSON Schema และไฟล์ JSON ใน repository มีตำรา Regex แบบอ่าน Markdown, บทเรียนแยกมุมมองผู้ใช้แอป/นักพัฒนา, endpoint อ่านบทเรียน/Pattern/Recipe, OpenAPI contract และ Regex preview ผ่าน worker ที่จำกัดเวลาและขนาด ยังไม่มี database, authentication, shared rate limit หรือ deployment setup จึงยังไม่เปิดรับ public traffic

## เป้าหมาย

ให้บุคคลและโปรแกรมภายนอกค้นหาบทเรียน อ่าน Pattern ดึง Recipe และทดลอง Regex ได้ พร้อมผลลัพธ์ที่อธิบายและตรวจสอบได้ เริ่มเป็น REST API ส่ง JSON ภายใต้ `/v1` โดยไม่ผูกกับส่วนแสดงผลใด

## Stack ที่แนะนำ

- **Node.js 24 LTS:** ใช้รันบริการและเครื่องมือตรวจข้อมูล ตอนเริ่มทำโครงการ รุ่น 24 เป็น LTS และ Node.js แนะนำให้ production ใช้ Active LTS หรือ Maintenance LTS [เอกสาร](https://nodejs.org/en/about/previous-releases)
- **TypeScript:** ใช้กับโค้ดบริการและตัวตรวจข้อมูล เพื่อให้ refactor และตรวจชนิดข้อมูลได้ง่าย
- **Fastify:** ใช้ routing, request validation และ response serialization โดยกำหนด JSON Schema ของแต่ละ endpoint ให้ชัดเจน [เอกสาร](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/)
- **JSON Schema:** เป็นข้อตกลงตรวจข้อมูลเนื้อหาและ request/response ใช้ schema ที่โครงการควบคุมเท่านั้น ไม่รับ schema จากผู้เรียกมาคอมไพล์เอง
- **OpenAPI:** อธิบาย endpoint, authentication, ตัวอย่างและ error สำหรับผู้เรียก API เลือกรุ่น specification ที่เครื่องมือที่ใช้รองรับ และตรวจว่าเอกสารตรงกับ route ใน CI [มาตรฐาน](https://spec.openapis.org/oas/)
- **PostgreSQL เมื่อเปิดบริการ:** เก็บ API key metadata, โควตา และดัชนีเนื้อหาที่เผยแพร่ ใช้คอลัมน์ทั่วไปกับ ID/สถานะ/เวอร์ชัน และ JSONB กับเอกสารเนื้อหาที่มีโครงสร้างยืดหยุ่น JSONB รองรับ indexing [เอกสาร](https://www.postgresql.org/docs/current/datatype-json.html)
- **Node.js test runner:** ใช้ทดสอบกรณี Pattern, validation และ API contract
- **Container สำหรับ deployment:** ทำให้ runtime ทำซ้ำได้ แยกบริการ API และ worker ทดลอง Regex โดยยังไม่เลือกผู้ให้บริการ hosting

ไม่เพิ่ม Redis หรือระบบคิวในรุ่นแรกโดยอัตโนมัติ เมื่อขยายหลาย instance จึงประเมินตัวเก็บ rate limit ร่วมกันและคิวงานตามปริมาณใช้งานจริง

## บทบาทของ JSON และฐานข้อมูล

ระยะแรกให้ JSON ใน repository เป็นแหล่งข้อมูลต้นฉบับของบทเรียนและสูตร ผ่าน schema validation, reference checks และ tests ก่อนเผยแพร่

เมื่อเปิดบริการให้นำชุดข้อมูลที่ผ่านการตรวจเข้าสู่ PostgreSQL เป็น release ที่ระบุ `contentVersion` ได้ชัดเจน การนำเข้าต้องสำเร็จทั้งชุดก่อนสลับรุ่นที่ให้บริการ หากล้มเหลวให้คงรุ่นเดิมไว้

ข้อมูลผู้ใช้งาน โควตา และ API key metadata อยู่ในฐานข้อมูล ไม่อยู่ในไฟล์เนื้อหา หลีกเลี่ยงการแก้เนื้อหาทั้งใน JSON และฐานข้อมูลพร้อมกันจนเกิดต้นฉบับสองชุด

## Endpoint ที่เสนอ

- `GET /v1/lessons` — รายการบทเรียนตามระดับและหัวข้อ; `audience=app_user|developer` เลือกคำอธิบายสำหรับผู้อ่านกลุ่มนั้น
- `GET /v1/lessons/{id}` — บทเรียน วิธีใช้ และแบบฝึกหัด
- `GET /v1/patterns` — ค้นหาและกรอง Pattern
- `GET /v1/patterns/{id}` — นิพจน์ คำอธิบาย ตัวอย่าง และข้อจำกัด
- `GET /v1/recipes` — ค้นหาสูตรสำเร็จตามหมวด
- `GET /v1/recipes/{id}` — ส่วนประกอบและวิธีติดตั้งตามลำดับ
- `POST /v1/regex/test` — ทดลอง Pattern และ replacement กับข้อความที่ส่งมา
- `GET /v1/recipes/{id}/export` — ส่ง JSON รวมองค์ประกอบเพื่อให้ผู้ใช้คัดลอกแต่ละส่วน ไม่อ้างว่า Rubii รองรับการ import ไฟล์นี้

รุ่นแรกคืนรายการที่ผ่านตัวกรองทั้งหมด โดยรองรับ `q`, `category`, `level` และ `locale`; เฉพาะ lessons รองรับ `audience=app_user|developer` ซึ่งเลือก `audienceNotes` ให้เหลือกลุ่มเดียว ถ้าไม่ส่งจะคืนคำอธิบายทั้งสองกลุ่ม รายการที่ไม่เผยแพร่จะไม่ออกผ่าน endpoint; เพิ่ม cursor pagination เมื่อขนาดคลังเนื้อหาเริ่มต้องการ

ผลลัพธ์มี `data` และ `meta` ซึ่งระบุ `contentVersion` และ cursor ถ้ามี ข้อผิดพลาดใช้โครงสร้าง `error.code`, `error.message` และ `requestId` โดยไม่ส่ง stack trace หรือรายละเอียดระบบภายใน

แยก HTTP status ให้ชัด: 400 เมื่อข้อมูลผิดรูปแบบ, 401 เมื่อข้อมูลรับรองไม่ถูกต้อง, 403 เมื่อ scope ไม่พอ, 404 เมื่อไม่พบ, 422 เมื่อ Pattern ไม่ถูกต้องหรือเกินขอบเขตที่รองรับ, 429 เมื่อเกินโควตา และ 503 เมื่อ worker ไม่พร้อม

## การทดลอง Regex

ใช้ JavaScript RegExp เป็น engine เริ่มต้น รับ `pattern`, `flags`, `replacement` และ `input` เป็นข้อมูล ไม่รับโค้ด executable และไม่ใช้ eval

แยกการประมวลผลไว้ใน worker process ที่ถูกยุติได้ พร้อมเพดาน input, output, จำนวน match, concurrency และเวลาทำงานจริง การใช้ Promise timeout อย่างเดียวไม่สามารถหยุด Regex ที่กำลังบล็อก CPU ได้

ค่าตั้งต้นเพื่อทดสอบก่อนปรับจริง: input ไม่เกิน 16 KiB, pattern ไม่เกิน 2 KiB, output ไม่เกิน 64 KiB, ไม่เกิน 100 matches และ execution deadline 250 ms ต้องหยุด worker เมื่อเกินกำหนด และตรวจการขยาย replacement ก่อนสร้าง output ขนาดใหญ่ ค่าทั้งหมดเป็นข้อเสนอ ไม่ใช่ข้อจำกัดทางการของ Rubii

รับเฉพาะ flags ที่กำหนดไว้ใน compatibility profile และทดสอบ zero-length matches, Unicode, ข้อความหลายบรรทัด, invalid syntax, replacement ที่ขยายมาก และการทำงานหลายคำขอพร้อมกัน

ผลทดสอบคืน match, capture groups, ข้อความหลังแทนที่, engine และสถานะการทดสอบ พร้อมระบุ index เป็น UTF-16 code units ตาม JavaScript

รุ่นแรกทดสอบการแทนข้อความเท่านั้น ยังไม่จำลองการ render และ sanitization ของ Rubii โดยเฉพาะ displayed-text regex ที่มีขอบเขต text node จึงไม่รับรองว่าผลเหมือน Rubii ทุกกรณี

## การเข้าถึงและข้อมูลส่วนตัว

ก่อนเปิดให้บุคคลอื่นใช้ ต้องมี HTTPS, API key ที่เพิกถอนและหมุนเวียนได้, scope อย่าง `catalog:read` และ `regex:test`, rate limit ต่อ key และข้อจำกัดรวมของบริการ

แสดง secret key ครั้งเดียว เก็บเฉพาะ digest ของ secret พร้อม public identifier และ metadata ไม่วาง key ใน URL จำกัดสิทธิ์การเผยแพร่เนื้อหาแยกจากสิทธิ์อ่านและทดลอง

ไม่บันทึก request body ของการทดลอง Regex โดยค่าเริ่มต้น ไม่บันทึก authorization headers, keys, เนื้อหาส่วนตัว หรือ error ที่มีรายละเอียดเครื่อง ใช้ operational logs เฉพาะ request ID, status, latency และ error code ที่ผ่านการกรองแล้ว

เอกสารและตัวอย่างต้องไม่รวม absolute local paths, ชื่อบัญชีในเครื่อง, hostname ส่วนตัว, IP ภายใน, environment values, connection strings หรือข้อมูลรับรอง ใช้ชื่อและข้อมูลสมมติเท่านั้น

## ลำดับพัฒนาและเกณฑ์ผ่าน

1. **ทำแล้ว:** สร้าง schema ขั้นต้นและข้อมูล JSON ตัวอย่าง พร้อมตรวจ references ตอนเริ่ม API
2. **ทำแล้ว:** เพิ่ม endpoint อ่านบทเรียน, Pattern, Recipe, recipe export และ OpenAPI contract
3. **ทำแล้ว:** เพิ่ม Regex preview ใน worker จำกัด input/output, เวลา และ concurrency
4. **ถัดไป:** เพิ่ม API keys, สิทธิ์, shared rate limits และระบบจัดการโควตา
5. **ถัดไป:** เพิ่ม PostgreSQL, content release/import และ backup เมื่อต้องแก้เนื้อหาขณะระบบทำงาน
6. **ถัดไป:** เตรียม deployment, monitoring และทบทวนความปลอดภัยก่อนเปิด public access

ตำรา Regex และ prompt สำหรับ GPT/Gemini/Claude มีฉบับเริ่มต้นแล้ว การเปิด public access, ระบบบัญชี/โควตา และ deployment ยังคงเป็นงานระยะถัดไป; เนื้อหา Styles และ Cookbook ยังไม่ใช่ขอบเขตของตำรารุ่นนี้
