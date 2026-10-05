let cookbookBundle;
let cookbookRevision = 0;
const CUSTOM_COOKBOOK_KEY = 'regex-studio.custom-cookbooks.v1';

function getCustomCookbookBundles() {
  try {
    const bundles = JSON.parse(localStorage.getItem(CUSTOM_COOKBOOK_KEY) || '[]');
    return Array.isArray(bundles) ? bundles.filter(bundle => bundle?.recipe?.id && bundle.custom === true) : [];
  } catch { return []; }
}

function saveCustomCookbookBundles(bundles) {
  localStorage.setItem(CUSTOM_COOKBOOK_KEY, JSON.stringify(bundles));
}

function getCustomCookbookBundle(id) {
  return getCustomCookbookBundles().find(bundle => bundle.recipe.id === id);
}

function cookbookField(parent, label, value, multiline = true) {
  const wrap = document.createElement('label');
  wrap.className = 'block space-y-2 text-sm text-slate-300';
  const caption = document.createElement('span'); caption.textContent = label;
  const input = document.createElement(multiline ? 'textarea' : 'input');
  input.className = 'glass-input w-full p-3 rounded-xl code-font text-sm';
  if (multiline) input.rows = 3;
  input.value = value;
  input.oninput = () => { cookbookRevision++; document.getElementById('cookbook-status').textContent = 'แก้ไขแล้ว กดดูผลครบขั้นอีกครั้ง'; };
  wrap.append(caption, input); parent.append(wrap); return input;
}

function cookbookSelect(parent, label, value, options) {
  const wrap=document.createElement('label');wrap.className='block space-y-2 text-sm text-slate-300';
  const caption=document.createElement('span');caption.textContent=label;
  const select=document.createElement('select');select.className='glass-input w-full p-3 rounded-xl';
  for(const [key,text] of options)select.add(new Option(text,key));
  select.value=value;
  select.onchange=()=>{cookbookRevision++;document.getElementById('cookbook-status').textContent='แก้ไขแล้ว กดดูผลครบขั้นอีกครั้ง'};
  wrap.append(caption,select);parent.append(wrap);return select;
}

function cookbookRegexLiteral(pattern, flags) {
  return '/' + String(pattern).replace(/\//g, '\\/') + '/' + (flags || '');
}

function parseCookbookRegexLiteral(source) {
  const value = String(source || '').trim();
  if (!value.startsWith('/')) throw new Error('นิพจน์ต้องเขียนแบบ /pattern/flags และมี / ครอบ Pattern');
  const closingSlash = value.lastIndexOf('/');
  if (closingSlash <= 0) throw new Error('ใส่เครื่องหมาย / ปิดท้าย Pattern ก่อน Flags');
  const pattern = value.slice(1, closingSlash);
  const flags = value.slice(closingSlash + 1);
  if (!pattern) throw new Error('Pattern ต้องไม่เว้นว่าง');
  if (!/^[gimsu]*$/.test(flags)) throw new Error('Preview รองรับ Flags g, i, m, s และ u');
  if (new Set(flags).size !== flags.length) throw new Error('ห้ามใส่ Flag ซ้ำ');
  try { new RegExp(pattern, flags); } catch (error) { throw new Error('Pattern ใช้ไม่ได้: ' + error.message); }
  return { pattern, flags };
}

function ensureCookbookModal() {
  let modal = document.getElementById('cookbook-modal');
  if (modal) return { modal, content: document.getElementById('cookbook-modal-content') };
  modal = document.createElement('div');
  modal.id = 'cookbook-modal';
  modal.className = 'fixed inset-0 z-[100] hidden items-center justify-center bg-slate-950/80 p-2 backdrop-blur-sm sm:p-5';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Cookbook · สูตรครบชุด');
  const dialog = document.createElement('section');
  dialog.className = 'glass-card flex max-h-[96vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-cyan-400/20 shadow-2xl shadow-black/50';
  dialog.innerHTML = '<header class="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6"><div><div class="text-[10px] font-semibold uppercase tracking-[.2em] text-cyan-300">Cookbook · Live Preview</div><p class="mt-0.5 text-xs text-slate-400">แก้ HTML, CSS และ Regex แล้วดูผลในหน้าต่างเดียว</p></div><button type="button" class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200 hover:bg-white/10" aria-label="ปิดหน้าต่าง" onclick="closeCookbookModal()">ปิด ✕</button></header>';
  const content = document.createElement('div');
  content.id = 'cookbook-modal-content';
  content.className = 'min-h-0 overflow-y-auto p-3 sm:p-5';
  dialog.append(content);
  modal.append(dialog);
  modal.addEventListener('click', event => { if (event.target === modal) closeCookbookModal(); });
  modal.addEventListener('keydown', event => { if (event.key === 'Escape') closeCookbookModal(); });
  document.body.append(modal);
  return { modal, content };
}

function closeCookbookModal() {
  const modal = document.getElementById('cookbook-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.body.style.overflow = '';
  cookbookRevision++;
}

let activeBlueprintCategory = 'all';

const COOKBOOK_BLUEPRINTS = [
  {
    id: 'bp-noti-drawer',
    category: 'notification',
    categoryLabel: '📱 การแจ้งเตือน',
    title: '📱 ศูนย์การแจ้งเตือน & แผงควบคุมระบบ (Mission HUD Drawer)',
    summary: 'กล่อง <details> นีออนไซแอน (#00c8ff) เรืองแสง พร้อมระบบแจ้งเตือนภารกิจ, ยอดเงินคงเหลือในกระเป๋า และแชตกลุ่มสมาชิกทีม',
    tags: ['Notification', 'Wallet', 'Group Chat', 'Details'],
    tag: 'hud-noti',
    template: '<div class="hud-notification-wrap">$1</div>',
    css: `.hud-notification-wrap { margin-bottom: 12px; }
.hud-details-cyan {
  background: rgba(4, 13, 33, 0.88); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
  border: 2px solid #00c8ff; border-radius: 24px; padding: 14px 18px; color: #f0f9ff;
  box-shadow: 0 8px 32px rgba(0, 200, 255, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.15);
}`,
    html: `<div class="hud-notification-wrap" style="margin-bottom:12px;">
  <details class="hud-details-cyan" style="background:rgba(4,13,33,0.88);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:2px solid #00c8ff;border-radius:24px;padding:14px 18px;color:#f0f9ff;box-shadow:0 8px 32px rgba(0,200,255,0.22),inset 0 1px 0 rgba(255,255,255,0.15);transition:all 0.3s ease;">
    <summary style="cursor:pointer;outline:none;display:flex;align-items:center;justify-content:space-between;gap:8px;color:#38bdf8;user-select:none;">
      <h3 style="margin:0;font-size:15px;font-weight:700;letter-spacing:0.02em;display:flex;align-items:center;gap:8px;color:#38bdf8;">
        <span style="font-size:18px;">📱</span> ศูนย์การแจ้งเตือน & เครือข่ายระบบ
      </h3>
      <span style="font-size:10px;font-weight:700;padding:3px 10px;border-radius:999px;background:rgba(0,200,255,0.15);border:1px solid rgba(0,200,255,0.4);color:#a5f3fc;text-transform:uppercase;letter-spacing:0.08em;">● LIVE FEED</span>
    </summary>
    
    <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(0,200,255,0.2);display:flex;flex-direction:column;gap:12px;">
      
      <!-- System Alert Banner -->
      <div style="background:linear-gradient(135deg,rgba(0,187,249,0.12),rgba(14,165,233,0.06));border:1px solid rgba(56,189,248,0.3);border-radius:14px;padding:10px 14px;display:flex;align-items:flex-start;gap:10px;">
        <span style="font-size:16px;line-height:1.2;">🔔</span>
        <div style="font-size:12.5px;line-height:1.5;color:#e0f2fe;">
          <strong style="color:#38bdf8;">[การแจ้งเตือนระบบ]:</strong> ปลดล็อกความคืบหน้าระดับ S เรียบร้อย! ข้อมูลบทสนทนาและชุดค่าพลังพิเศษพร้อมใช้งานในเซสชันนี้
        </div>
      </div>

      <!-- Financial / Wallet Section -->
      <div style="background:rgba(15,23,42,0.6);border:1px solid rgba(0,200,255,0.2);border-radius:16px;padding:12px 14px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:#38bdf8;background:rgba(0,200,255,0.12);padding:3px 10px;border-radius:8px;border:1px solid rgba(0,200,255,0.25);">
            💳 สถานะการเงิน & เครดิต
          </span>
          <span style="font-size:11px;color:#94a3b8;">กระเป๋าหลัก (VIP)</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:8px;padding:6px 0;">
          <span style="font-size:12px;color:#94a3b8;">💰 ยอดเงินคงเหลือ:</span>
          <span style="font-size:18px;font-weight:800;color:#38bdf8;font-family:ui-monospace,monospace;letter-spacing:0.02em;">฿ 54,200.00 <span style="font-size:11px;font-weight:500;color:#7dd3fc;">THB</span></span>
        </div>
        <div style="margin-top:6px;padding:8px 10px;background:rgba(2,6,23,0.5);border-radius:10px;border:1px solid rgba(255,255,255,0.05);font-size:11.5px;color:#cbd5e1;display:flex;justify-content:space-between;">
          <span>📑 ธุรกรรมล่าสุด: ชำระค่าบริการ Server -450 บาท</span>
          <span style="color:#34d399;font-weight:600;">สำเร็จ</span>
        </div>
      </div>

      <!-- Multi-Character Squad LINE Group Chat -->
      <div style="background:rgba(15,23,42,0.6);border:1px solid rgba(0,200,255,0.2);border-radius:16px;padding:12px 14px;">
        <div style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:#38bdf8;margin-bottom:10px;background:rgba(0,200,255,0.12);padding:3px 10px;border-radius:8px;border:1px solid rgba(0,200,255,0.25);width:fit-content;">
          💬 LINE GROUP: ทีมปฏิบัติการพิเศษ 🚀
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;font-size:12.5px;">
          <div style="display:flex;align-items:flex-start;gap:8px;background:rgba(255,255,255,0.03);padding:6px 10px;border-radius:10px;border-left:3px solid #ff4d6d;">
            <span style="color:#ff4d6d;font-weight:700;white-space:nowrap;min-width:75px;">🥛 มิลค์:</span>
            <span style="color:#f1f5f9;">"โมดูลใหม่ดีพลอยขึ้นระบบเรียบร้อย คืนนี้เทสต์กันได้เลยนะทุกคน! 🎉"</span>
          </div>
          <div style="display:flex;align-items:flex-start;gap:8px;background:rgba(255,255,255,0.03);padding:6px 10px;border-radius:10px;border-left:3px solid #fbbf24;">
            <span style="color:#fbbf24;font-weight:700;white-space:nowrap;min-width:75px;">🐹 แก้ม:</span>
            <span style="color:#f1f5f9;">"ส่งสไตล์ Glassmorphism ให้ในแชนเนลแล้วนะ สวยฉ่ำมาก ✨"</span>
          </div>
          <div style="display:flex;align-items:flex-start;gap:8px;background:rgba(255,255,255,0.03);padding:6px 10px;border-radius:10px;border-left:3px solid #34d399;">
            <span style="color:#34d399;font-weight:700;white-space:nowrap;min-width:75px;">🐍 บีม:</span>
            <span style="color:#f1f5f9;">"ตรวจเช็ก Token & Security เรียบร้อย ปลอดภัย 100% 🛡️"</span>
          </div>
          <div style="display:flex;align-items:flex-start;gap:8px;background:rgba(255,255,255,0.03);padding:6px 10px;border-radius:10px;border-left:3px solid #a855f7;">
            <span style="color:#a855f7;font-weight:700;white-space:nowrap;min-width:75px;">👑 พลอย:</span>
            <span style="color:#f1f5f9;">"เยี่ยมมาก เดี๋ยวเริ่มรันพรีวิวเต็มจอรอบนี้ได้เลย 🌟"</span>
          </div>
        </div>
      </div>

    </div>
  </details>
</div>`
  },
  {
    id: 'bp-transfer-slip',
    category: 'financial',
    categoryLabel: '💸 สลิปโอนเงิน',
    title: '💸 สลิปโอนเงินดิจิทัล & ธุรกรรมธนาคาร (E-Receipt Slip)',
    summary: 'สลิปการทำรายการโอนเงินดิจิทัลสไตล์ E-Banking สีเขียวนีออน (#10b981) พร้อมยอดเงิน, รหัสอ้างอิง, ผู้รับ-ผู้โอน และตราประทับรับรอง',
    tags: ['Financial', 'Transfer Slip', 'Bank Receipt', 'Payment'],
    tag: 'hud-slip',
    template: '<div class="hud-slip-wrap">$1</div>',
    css: `.hud-slip-wrap { margin-bottom: 12px; }`,
    html: `<div class="hud-slip-wrap" style="margin-bottom:12px;">
  <div style="max-width:440px;margin:0 auto;background:radial-gradient(circle at top right,rgba(16,185,129,0.15),rgba(4,13,33,0.95) 70%);border:2px solid #10b981;border-radius:24px;padding:18px 20px;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);box-shadow:0 12px 36px rgba(0,0,0,0.5),0 0 24px rgba(16,185,129,0.25);color:#f8fafc;font-family:system-ui,-apple-system,sans-serif;">
    
    <!-- Slip Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px dashed rgba(16,185,129,0.35);padding-bottom:12px;margin-bottom:14px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:36px;height:36px;border-radius:50%;background:rgba(16,185,129,0.2);border:1.5px solid #10b981;display:flex;align-items:center;justify-content:center;color:#34d399;font-size:18px;font-weight:bold;">
          ✓
        </div>
        <div>
          <div style="font-size:14px;font-weight:700;color:#34d399;letter-spacing:0.02em;">โอนเงินสำเร็จ</div>
          <div style="font-size:10.5px;color:#94a3b8;">Transfer Successful · E-Receipt</div>
        </div>
      </div>
      <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px;background:rgba(16,185,129,0.15);border:1px solid rgba(16,185,129,0.3);color:#6ee7b7;">AUTO-VERIFIED</span>
    </div>

    <!-- Amount Display -->
    <div style="text-align:center;padding:10px 0 16px;">
      <div style="font-size:11.5px;color:#94a3b8;margin-bottom:4px;">จำนวนเงินที่โอน</div>
      <div style="font-size:28px;font-weight:900;color:#ffffff;text-shadow:0 0 18px rgba(16,185,129,0.6);letter-spacing:0.02em;font-family:ui-monospace,monospace;">
        ฿ 8,500.00
      </div>
      <div style="font-size:11px;color:#6ee7b7;font-weight:500;margin-top:2px;">(แปดพันห้าร้อยบาทถ้วน)</div>
    </div>

    <!-- Transfer Detail Rows -->
    <div style="background:rgba(15,23,42,0.7);border-radius:14px;border:1px solid rgba(255,255,255,0.08);padding:12px 14px;display:flex;flex-direction:column;gap:10px;font-size:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="color:#94a3b8;">👤 จาก:</span>
        <span style="color:#f1f5f9;font-weight:600;">บัญชีหลัก (Rubii Wallet #8892)</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="color:#94a3b8;">🎯 ไปยัง:</span>
        <span style="color:#38bdf8;font-weight:600;">น.ส. อลิสา (Prompt Master · xxx-x-12345-x)</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="color:#94a3b8;">🔖 รหัสอ้างอิง:</span>
        <span style="color:#e2e8f0;font-family:ui-monospace,monospace;font-size:11px;">TXN-2026-9988776644</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="color:#94a3b8;">⏱️ วันเวลา:</span>
        <span style="color:#cbd5e1;">05 ต.ค. 2026 • 18:00:00 น.</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="color:#94a3b8;">⚡ ค่าธรรมเนียม:</span>
        <span style="color:#34d399;font-weight:600;">0.00 บาท (ฟรี)</span>
      </div>
    </div>

    <!-- Memo Footer -->
    <div style="margin-top:12px;padding:8px 12px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:10px;font-size:11.5px;color:#a7f3d0;display:flex;align-items:center;gap:6px;">
      <span>💬</span>
      <span><strong>บันทึกช่วยจำ:</strong> ค่าสนับสนุนภารกิจ & พัฒนาโมดูล Regex Studio 🚀</span>
    </div>

  </div>
</div>`
  },
  {
    id: 'bp-char-status',
    category: 'character',
    categoryLabel: '✨ สถานะตัวละคร',
    title: '✨ แถบสถานะตัวละคร & ค่าความสัมพันธ์ (Character Status HUD)',
    summary: 'กล่อง <details> สไตล์มาเจนต้าเรืองแสง (#ff007f) แสดงเกจความรัก ❤️, ความเชื่อใจ 🤝, ความเสน่หา 🔥 และอารมณ์ปัจจุบัน 🎭',
    tags: ['Character Status', 'Affinity HUD', 'Love Meter', 'Details'],
    tag: 'hud-character',
    template: '<div class="hud-character-wrap">$1</div>',
    css: `.hud-character-wrap { margin-bottom: 12px; }
.hud-details-magenta {
  background: rgba(28, 4, 22, 0.88); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
  border: 2px solid #ff007f; border-radius: 24px; padding: 14px 18px; color: #fff;
  box-shadow: 0 8px 32px rgba(255, 0, 127, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15);
}`,
    html: `<div class="hud-character-wrap" style="margin-bottom:12px;">
  <details class="hud-details-magenta" style="background:rgba(28,4,22,0.88);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:2px solid #ff007f;border-radius:24px;padding:14px 18px;color:#fff;box-shadow:0 8px 32px rgba(255,0,127,0.25),inset 0 1px 0 rgba(255,255,255,0.15);transition:all 0.3s ease;">
    <summary style="cursor:pointer;outline:none;display:flex;align-items:center;justify-content:space-between;gap:8px;color:#ff3399;user-select:none;">
      <h3 style="margin:0;font-size:15px;font-weight:700;letter-spacing:0.02em;display:flex;align-items:center;gap:8px;color:#ff3399;">
        <span style="font-size:18px;">✨</span> สถานะตัวละคร & ระดับความสัมพันธ์ (Affinity HUD)
      </h3>
      <span style="font-size:10px;font-weight:700;padding:3px 10px;border-radius:999px;background:rgba(255,0,127,0.18);border:1px solid rgba(255,0,127,0.4);color:#fbcfe8;text-transform:uppercase;letter-spacing:0.08em;">HEART SYNC</span>
    </summary>
    
    <div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,0,127,0.25);display:flex;flex-direction:column;gap:12px;">
      
      <!-- Meter Gauges Grid -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;">
        <!-- Love Meter -->
        <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,0,127,0.3);border-radius:14px;padding:10px 12px;text-align:center;">
          <div style="display:flex;align-items:center;justify-content:center;gap:4px;font-size:12px;font-weight:700;color:#ff4d8d;">
            <span>❤️</span> ความรัก
          </div>
          <div style="font-size:18px;font-weight:800;color:#ff66aa;margin:4px 0;font-family:ui-monospace,monospace;">85%</div>
          <div style="height:5px;background:rgba(255,255,255,0.1);border-radius:99px;overflow:hidden;">
            <div style="height:100%;width:85%;background:linear-gradient(90deg,#ff007f,#ff66aa);border-radius:99px;"></div>
          </div>
        </div>

        <!-- Trust Meter -->
        <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(56,189,248,0.3);border-radius:14px;padding:10px 12px;text-align:center;">
          <div style="display:flex;align-items:center;justify-content:center;gap:4px;font-size:12px;font-weight:700;color:#38bdf8;">
            <span>🤝</span> ความเชื่อใจ
          </div>
          <div style="font-size:18px;font-weight:800;color:#7dd3fc;margin:4px 0;font-family:ui-monospace,monospace;">92%</div>
          <div style="height:5px;background:rgba(255,255,255,0.1);border-radius:99px;overflow:hidden;">
            <div style="height:100%;width:92%;background:linear-gradient(90deg,#0284c7,#38bdf8);border-radius:99px;"></div>
          </div>
        </div>

        <!-- Drive / Passion Meter -->
        <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(245,158,11,0.3);border-radius:14px;padding:10px 12px;text-align:center;">
          <div style="display:flex;align-items:center;justify-content:center;gap:4px;font-size:12px;font-weight:700;color:#f59e0b;">
            <span>🔥</span> ความเสน่หา
          </div>
          <div style="font-size:18px;font-weight:800;color:#fbbf24;margin:4px 0;font-family:ui-monospace,monospace;">70%</div>
          <div style="height:5px;background:rgba(255,255,255,0.1);border-radius:99px;overflow:hidden;">
            <div style="height:100%;width:70%;background:linear-gradient(90deg,#ea580c,#fbbf24);border-radius:99px;"></div>
          </div>
        </div>
      </div>

      <!-- Current Mood Banner -->
      <div style="background:linear-gradient(135deg,rgba(255,0,127,0.15),rgba(147,51,234,0.1));border:1px solid rgba(255,0,127,0.3);border-radius:14px;padding:10px 14px;font-size:12.5px;color:#fce7f3;line-height:1.5;">
        <span style="color:#ff3399;font-weight:700;">🎭 อารมณ์ปัจจุบัน:</span> [เขินอายปนปลื้มใจอย่างยิ่ง แก้มแดงระเรื่อเมื่อได้คุยกับคุณ (๑˃ᴗ˂)✨]
      </div>

    </div>
  </details>
</div>`
  },
  {
    id: 'bp-heading-cyber',
    category: 'headings',
    categoryLabel: '🏷️ กล่องหัวข้อ',
    title: '⚡ กล่องหัวข้อไซเบอร์พังก์นีออน (Cyberpunk Neon HUD Heading)',
    summary: 'หัวข้อสไตล์ไซเบอร์นีออนสีฟ้าไซแอน (#00f0ff) เรืองแสง พร้อมสัญลักษณ์บีคอนและแท็กโค้ดเนมระบบ',
    tags: ['Heading', 'Cyberpunk', 'Neon', 'HUD'],
    tag: 'heading-cyber',
    template: '<div class="heading-cyber-hud">$1</div>',
    css: `.heading-cyber-hud {
  margin: 14px 0 8px; padding: 12px 18px;
  background: linear-gradient(90deg, rgba(0,187,249,0.18), rgba(168,85,247,0.08) 70%, transparent);
  border-left: 5px solid #00f0ff; border-top: 1px solid rgba(0,240,255,0.25); border-bottom: 1px solid rgba(0,240,255,0.1);
  border-radius: 0 16px 16px 0; box-shadow: 0 4px 20px rgba(0,240,255,0.15);
}`,
    html: `<div class="heading-cyber-hud" style="margin:14px 0 8px;padding:12px 18px;background:linear-gradient(90deg,rgba(0,187,249,0.18),rgba(168,85,247,0.08) 70%,transparent);border-left:5px solid #00f0ff;border-top:1px solid rgba(0,240,255,0.25);border-bottom:1px solid rgba(0,240,255,0.1);border-radius:0 16px 16px 0;box-shadow:0 4px 20px rgba(0,240,255,0.15);display:flex;align-items:center;justify-content:space-between;gap:12px;">
  <div style="display:flex;align-items:center;gap:10px;">
    <span style="width:10px;height:10px;background:#00f0ff;border-radius:50%;box-shadow:0 0 10px #00f0ff;display:inline-block;"></span>
    <h3 style="margin:0;font-size:16px;font-weight:800;letter-spacing:0.04em;color:#e0f2fe;text-transform:uppercase;">
      ⚡ CYBERPUNK HUD SECTION
    </h3>
  </div>
  <span style="font-size:10px;font-family:ui-monospace,monospace;color:#38bdf8;background:rgba(0,240,255,0.1);padding:2px 8px;border-radius:6px;border:1px solid rgba(0,240,255,0.3);">SYS.NODE-01</span>
</div>`
  },
  {
    id: 'bp-heading-fantasy',
    category: 'headings',
    categoryLabel: '🏷️ กล่องหัวข้อ',
    title: '⚔️ กล่องหัวข้อเควสต์ทองคำแฟนตาซี (Fantasy Quest & Guild Ribbon)',
    summary: 'ป้ายริบบิ้นเควสต์ขอบทองคำไล่เฉด (#f59e0b) สไตล์ RPG กิลด์ พร้อมตราสัญลักษณ์และแท็กสถานะเควสต์',
    tags: ['Heading', 'Fantasy RPG', 'Gold Ribbon', 'Quest'],
    tag: 'heading-fantasy',
    template: '<div class="heading-fantasy-gold">$1</div>',
    css: `.heading-fantasy-gold {
  margin: 14px 0 8px; padding: 12px 18px;
  background: linear-gradient(135deg, rgba(217,119,6,0.2), rgba(120,53,15,0.15) 50%, rgba(15,23,42,0.8));
  border: 1.5px solid #f59e0b; border-radius: 16px;
  box-shadow: 0 4px 24px rgba(245,158,11,0.2), inset 0 1px 0 rgba(254,243,199,0.3);
}`,
    html: `<div class="heading-fantasy-gold" style="margin:14px 0 8px;padding:12px 18px;background:linear-gradient(135deg,rgba(217,119,6,0.2),rgba(120,53,15,0.15) 50%,rgba(15,23,42,0.8));border:1.5px solid #f59e0b;border-radius:16px;box-shadow:0 4px 24px rgba(245,158,11,0.2),inset 0 1px 0 rgba(254,243,199,0.3);display:flex;align-items:center;justify-content:space-between;">
  <div style="display:flex;align-items:center;gap:10px;">
    <span style="font-size:18px;">⚔️</span>
    <h3 style="margin:0;font-size:15.5px;font-weight:700;color:#fef3c7;letter-spacing:0.02em;text-shadow:0 2px 8px rgba(0,0,0,0.6);">
      📜 ภารกิจหลัก: การทดสอบแห่งมนตรา
    </h3>
  </div>
  <span style="font-size:11px;font-weight:700;padding:2px 10px;border-radius:999px;background:linear-gradient(90deg,#d97706,#f59e0b);color:#1c1917;box-shadow:0 2px 8px rgba(245,158,11,0.4);">QUEST ACTIVE</span>
</div>`
  },
  {
    id: 'bp-heading-glass',
    category: 'headings',
    categoryLabel: '🏷️ กล่องหัวข้อ',
    title: '💎 กล่องหัวข้อกระจกแก้วออโรร่า (Aurora Frosted Glass)',
    summary: 'กระจกฝ้าโปร่งแสงพรีเมียม ขอบกระจก 1px พร้อมไอคอนไล่สีม่วง-ครามและคำโปรยรอง',
    tags: ['Heading', 'Glassmorphism', 'Aurora', 'Luxury'],
    tag: 'heading-glass',
    template: '<div class="heading-luxury-glass">$1</div>',
    css: `.heading-luxury-glass {
  margin: 14px 0 8px; padding: 12px 18px;
  background: linear-gradient(135deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03));
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.2); border-radius: 18px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.3);
}`,
    html: `<div class="heading-luxury-glass" style="margin:14px 0 8px;padding:12px 18px;background:linear-gradient(135deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03));backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.2);border-radius:18px;box-shadow:0 8px 32px rgba(0,0,0,0.3),inset 0 1px 1px rgba(255,255,255,0.3);display:flex;align-items:center;gap:12px;">
  <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#c084fc,#818cf8);display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;box-shadow:0 4px 12px rgba(192,132,252,0.4);">
    💎
  </div>
  <div>
    <h3 style="margin:0;font-size:15px;font-weight:700;color:#faf5ff;">Aurora Glass Minimalist</h3>
    <p style="margin:0;font-size:11px;color:#cbd5e1;">เรียบหรู คมชัด สไตล์มินิมอลโมเดิร์น</p>
  </div>
</div>`
  },
  {
    id: 'bp-heading-terminal',
    category: 'headings',
    categoryLabel: '🏷️ กล่องหัวข้อ',
    title: '💻 กล่องหัวข้อคอนโซลเทอร์มินัล (System Matrix Terminal Log)',
    summary: 'กล่องหัวข้อสไตล์ Hacker Terminal สีเขียวเมทริกซ์ (#22c55e) อักษร Monospace และแท็กบอกสถานะ HTTP 200',
    tags: ['Heading', 'Terminal', 'Matrix', 'Developer'],
    tag: 'heading-terminal',
    template: '<div class="heading-terminal-matrix">$1</div>',
    css: `.heading-terminal-matrix {
  margin: 14px 0 8px; padding: 10px 16px;
  background: rgba(2,6,23,0.92); border: 1px solid #22c55e; border-left: 5px solid #22c55e;
  border-radius: 0 12px 12px 0; box-shadow: 0 4px 20px rgba(34,197,94,0.15);
  font-family: ui-monospace, monospace;
}`,
    html: `<div class="heading-terminal-matrix" style="margin:14px 0 8px;padding:10px 16px;background:rgba(2,6,23,0.92);border:1px solid #22c55e;border-left:5px solid #22c55e;border-radius:0 12px 12px 0;box-shadow:0 4px 20px rgba(34,197,94,0.15);font-family:ui-monospace,monospace;display:flex;align-items:center;justify-content:space-between;">
  <div style="display:flex;align-items:center;gap:8px;">
    <span style="color:#22c55e;font-weight:bold;">root@rubii-core:~#</span>
    <span style="color:#86efac;font-size:13.5px;font-weight:600;">EXECUTE --diagnostic</span>
  </div>
  <span style="font-size:10.5px;color:#22c55e;background:rgba(34,197,94,0.12);padding:2px 8px;border-radius:4px;border:1px solid rgba(34,197,94,0.3);">STATUS: 200 OK</span>
</div>`
  },
  {
    id: 'bp-footer-status',
    category: 'status',
    categoryLabel: '📊 แถบสถานะ Footer',
    title: '📊 แถบสถานะส่วนล่างแบบย่อ & ค่าพลัง (HUD Footer Status Ribbon)',
    summary: 'Footer Status Bar แสดงหลอด HP, MP, Stamina และยอดเงินคงเหลือพร้อมสถานะออนไลน์',
    tags: ['Footer', 'Status Bar', 'Gauges', 'HUD'],
    tag: 'hud-footer',
    template: '<div class="hud-footer-bar">$1</div>',
    css: `.hud-footer-bar {
  margin-top: 14px; padding: 10px 16px;
  background: rgba(15,23,42,0.85); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(56,189,248,0.25); border-radius: 16px;
  box-shadow: 0 6px 24px rgba(0,0,0,0.35);
}`,
    html: `<div class="hud-footer-bar" style="margin-top:14px;padding:10px 16px;background:rgba(15,23,42,0.85);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(56,189,248,0.25);border-radius:16px;box-shadow:0 6px 24px rgba(0,0,0,0.35);display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;font-size:12px;color:#e2e8f0;">
  <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
    <span style="display:inline-flex;align-items:center;gap:5px;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.3);color:#fca5a5;padding:2px 8px;border-radius:8px;font-weight:600;">
      ❤️ HP: 100/100
    </span>
    <span style="display:inline-flex;align-items:center;gap:5px;background:rgba(59,130,246,0.15);border:1px solid rgba(59,130,246,0.3);color:#93c5fd;padding:2px 8px;border-radius:8px;font-weight:600;">
      🔮 MP: 250/250
    </span>
    <span style="display:inline-flex;align-items:center;gap:5px;background:rgba(234,179,8,0.15);border:1px solid rgba(234,179,8,0.3);color:#fde047;padding:2px 8px;border-radius:8px;font-weight:600;">
      ⚡ Stamina: 95%
    </span>
  </div>
  <div style="display:flex;align-items:center;gap:8px;">
    <span style="font-size:11px;color:#94a3b8;">เครดิต:</span>
    <span style="font-weight:700;color:#38bdf8;font-family:ui-monospace,monospace;">54,200 THB</span>
    <span style="width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;display:inline-block;" title="Online"></span>
  </div>
</div>`
  }
];

function sendBlueprintToSandbox(bp) {
  if (typeof sendToSandbox === 'function') {
    sendToSandbox(
      encodeURIComponent(''),
      encodeURIComponent(''),
      encodeURIComponent(''),
      encodeURIComponent(bp.html)
    );
    if (typeof showToast === 'function') showToast('ส่ง Blueprint ไปยัง Regex Sandbox แล้ว!');
  }
}

async function createRecipeFromBlueprint(bp) {
  try {
    const response = await fetch('/v1/recipes/premium-scene-profile/export');
    if (!response.ok) throw new Error('โหลดชุดตัวอย่างสำหรับสร้างสูตรไม่สำเร็จ');
    const { data } = await response.json();
    const bundle = JSON.parse(JSON.stringify(data));
    const suffix = globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    bundle.custom = true;
    bundle.globalCSS = bp.css || '';
    bundle.recipe = {
      ...bundle.recipe,
      id: `custom-bp-${suffix}`,
      title: bp.title.replace(/^[^\wก-๙]+/, '').trim(),
      summary: bp.summary,
      category: 'dialogue',
      openingExample: bp.html,
      settingInstructions: [`ครอบส่วนที่ต้องการตกแต่งด้วย <${bp.tag}> และ </${bp.tag}>`, `ใช้ CSS และโครงสร้าง HTML สำเร็จรูปสำหรับแสดงผล`],
      sourceRefs: []
    };
    bundle.styles = [{
      id: `style-${suffix}`,
      tagName: bp.tag,
      title: bp.title,
      applyTo: 'all',
      template: bp.template,
      css: bp.css
    }];
    bundle.recipe.ruleOrder = [{ kind: 'style', id: `style-${suffix}` }];
    const bundles = getCustomCookbookBundles();
    bundles.unshift(bundle);
    saveCustomCookbookBundles(bundles);
    renderCookbookLibrary();
    await openCookbook(bundle.recipe.id);
    if (typeof showToast === 'function') showToast('สร้างสูตรใหม่จาก Blueprint สำเร็จแล้ว!');
  } catch (error) {
    if (typeof showToast === 'function') showToast(error.message || 'สร้างสูตรไม่สำเร็จ');
  }
}

function renderCookbookLibrary() {
  const main = document.getElementById('view-recipes');
  let panel = document.getElementById('cookbook-library');
  if (!panel) {
    panel = document.createElement('section'); panel.id = 'cookbook-library';
    panel.className = 'glass-card rounded-3xl p-6 space-y-6';
    main.prepend(panel);
  }
  panel.replaceChildren();
  const header = document.createElement('div');
  header.className = 'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between';
  const intro = document.createElement('div');
  intro.innerHTML = '<h2 class="text-xl font-bold text-cyan-300">Cookbook · สูตรครบชุด & คลัง UI Blueprints</h2><p class="mt-1 text-sm text-slate-300">สูตรและกล่องตกแต่งสำเร็จรูป: เปิด แก้ Pattern, Tag, CSS และทดลอง Preview ได้ทันที</p>';
  const create = document.createElement('button');
  create.id = 'cookbook-create-button';
  create.type = 'button';
  create.className = 'shrink-0 rounded-xl border border-cyan-300/30 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 px-4 py-2.5 text-sm font-semibold text-cyan-100 shadow-lg shadow-cyan-950/20 transition hover:border-cyan-200/60 hover:from-cyan-500/30 hover:to-indigo-500/30';
  create.textContent = '＋ เพิ่มสูตร';
  create.title = 'สร้างสูตรส่วนตัวจากชุดตัวอย่าง Premium Scene Profile';
  create.onclick = createCustomCookbookRecipe;
  header.append(intro, create);
  panel.append(header);

  const customBundles = getCustomCookbookBundles();
  if (customBundles.length) {
    const localNote = document.createElement('p');
    localNote.className = 'text-[11px] text-violet-200/80';
    localNote.textContent = `สูตรของฉัน ${customBundles.length} ชุด · บันทึกไว้ในเบราว์เซอร์นี้`;
    panel.append(localNote);
  }

  // --- Recipes Grid Section ---
  const recipesSection = document.createElement('div');
  recipesSection.className = 'space-y-3';
  recipesSection.innerHTML = `
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-bold text-slate-200 flex items-center gap-2">
        <svg class="w-4 h-4 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
        สูตรสำเร็จรูปที่พร้อมใช้งาน (Presets & Custom Recipes)
      </h3>
    </div>
  `;
  const list = document.createElement('div'); list.className = 'grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3';
  const orderedRecipes = [
    ...customBundles.map(bundle => ({ ...bundle.recipe, custom: true })),
    ...[...state.recipes].sort((a, b) => Number(b.id === 'premium-scene-profile') - Number(a.id === 'premium-scene-profile'))
  ];
  for (const r of orderedRecipes) {
    if (state.selectedCategory !== 'all' && r.category !== state.selectedCategory) continue;
    if (state.selectedLevel !== 'all' && r.level !== state.selectedLevel) continue;
    if (state.searchQuery && !(r.title + r.summary + (r.settingInstructions || []).join(' ')).toLowerCase().includes(state.searchQuery)) continue;
    const b = document.createElement('button');
    b.className = r.custom
      ? 'min-w-0 rounded-2xl border border-violet-400/30 bg-gradient-to-br from-violet-500/15 to-slate-950/70 p-4 text-left shadow-sm transition hover:border-violet-300/60 hover:bg-slate-900/70 group'
      : r.id === 'premium-scene-profile'
        ? 'min-w-0 rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/15 via-purple-500/15 to-cyan-500/10 p-4 text-left shadow-md transition hover:border-amber-400/50 hover:bg-slate-900/60 group'
        : 'min-w-0 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-left shadow-sm transition hover:border-cyan-400/40 hover:bg-slate-900/60 group';
    b.setAttribute('aria-haspopup', 'dialog');
    b.innerHTML = `
      <div class="flex items-center justify-between gap-2 mb-1.5">
        <span class="min-w-0 truncate text-xs font-bold ${r.custom ? 'text-violet-200' : r.id === 'premium-scene-profile' ? 'text-amber-200' : 'text-cyan-300'} group-hover:text-white transition-colors">${escapeHtml(r.title)}</span>
        <span class="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-300">${r.custom ? 'ของฉัน' : `${r.settingInstructions?.length || 1} ขั้นตอน`}</span>
      </div>
      <p class="text-[11px] text-slate-400 font-light line-clamp-2 leading-relaxed">${escapeHtml(r.summary)}</p>
    `;
    b.onclick = () => openCookbook(r.id);
    list.append(b);
  }
  if (!list.childNodes.length) {
    const empty = document.createElement('p');
    empty.className = 'col-span-full rounded-2xl border border-white/10 bg-slate-950/30 p-6 text-center text-sm text-slate-400';
    empty.textContent = 'ไม่มีสูตรตรงกับตัวกรองนี้ · กด “เพิ่มสูตร” เพื่อสร้างสูตรของคุณจากชุดตัวอย่าง';
    list.append(empty);
  }
  recipesSection.append(list);
  panel.append(recipesSection);

  // --- UI Blueprints / Kits Showcase Section ---
  const bpSection = document.createElement('section');
  bpSection.className = 'pt-4 border-t border-white/10 space-y-4';
  bpSection.id = 'cookbook-blueprints-section';

  const bpHdr = document.createElement('div');
  bpHdr.className = 'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between';
  bpHdr.innerHTML = `
    <div>
      <div class="flex items-center gap-2">
        <span class="px-2 py-0.5 rounded-lg bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px] font-bold uppercase tracking-wider">UI Studio</span>
        <h3 class="text-base font-bold text-slate-100 flex items-center gap-2">
          🎨 คลังกล่องสไตล์ & Blueprint สำเร็จรูป (Cookbook UI Blueprint Kits)
        </h3>
      </div>
      <p class="text-xs text-slate-400 mt-0.5">รวมกล่องหัวข้อ, ศูนย์แจ้งเตือน, สลิปโอนเงิน, แถบสถานะตัวละคร และ Footer พร้อมคัดลอกหรือเปิดทดลองใน Sandbox</p>
    </div>
  `;
async function createCustomCookbookRecipe() {
  const button = document.getElementById('cookbook-create-button');
  if (button) { button.disabled = true; button.textContent = 'กำลังสร้างสูตร…'; }
  try {
    const response = await fetch('/v1/recipes/premium-scene-profile/export');
    if (!response.ok) throw new Error('โหลดชุดตัวอย่างสำหรับสร้างสูตรไม่สำเร็จ');
    const { data } = await response.json();
    const bundle = JSON.parse(JSON.stringify(data));
    const suffix = globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    bundle.custom = true;
    bundle.globalCSS = bundle.styles.map(style => style.css).filter(Boolean).join('\n\n');
    bundle.recipe = {
      ...bundle.recipe,
      id: `custom-${suffix}`,
      title: 'สูตรใหม่ของฉัน',
      summary: 'แก้คำอธิบาย Marker, Regex และสไตล์ของสูตรนี้ได้ตามต้องการ',
      category: 'dialogue',
      settingInstructions: ['ครอบส่วนที่ต้องการตกแต่งด้วย <premium> และ </premium>', ...bundle.recipe.settingInstructions.slice(1)],
      sourceRefs: []
    };
    const bundles = getCustomCookbookBundles();
    bundles.unshift(bundle);
    saveCustomCookbookBundles(bundles);
    renderCookbookLibrary();
    await openCookbook(bundle.recipe.id);
  } catch (error) {
    if (button) { button.disabled = false; button.textContent = '＋ เพิ่มสูตร'; }
    if (typeof showToast === 'function') showToast(error.message || 'สร้างสูตรไม่สำเร็จ');
  }
}

async function openCookbook(id) {
  const revision = ++cookbookRevision;
  const { modal, content } = ensureCookbookModal();
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';
  let panel = document.getElementById('cookbook-editor');
  if (!panel) {
    panel = document.createElement('section');
    panel.id = 'cookbook-editor';
    panel.className = 'space-y-4';
    content.append(panel);
  }
  panel.innerHTML = '<div class="text-xs text-slate-400 py-6 text-center">กำลังโหลดข้อมูลสูตร...</div>';

  try {
    const customBundle = getCustomCookbookBundle(id);
    let bundle;
    if (customBundle) bundle = JSON.parse(JSON.stringify(customBundle));
    else {
      const response = await fetch('/v1/recipes/' + encodeURIComponent(id) + '/export');
      if (!response.ok) throw new Error('โหลดสูตรไม่สำเร็จ');
      ({ data: bundle } = await response.json());
    }
    if (revision !== cookbookRevision) return;
    cookbookBundle = bundle;
    panel.replaceChildren();

    const heading = document.createElement('div');
    heading.className = 'flex items-center gap-2.5 pb-2 border-b border-white/10';
    heading.innerHTML = `
      <div class="w-8 h-8 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
        </svg>
      </div>
      <div>
        <h2 class="text-lg font-bold text-slate-100">${escapeHtml(bundle.recipe.title)}</h2>
        <p class="text-xs text-slate-400 font-light">${escapeHtml(bundle.recipe.summary)}</p>
      </div>
    `;
    panel.append(heading);

    if (bundle.custom) {
      const details = document.createElement('details');
      details.open = true;
      details.className = 'rounded-2xl border border-violet-400/20 bg-violet-950/10 p-4 space-y-3';
      const summary = document.createElement('summary');
      summary.className = 'cursor-pointer text-xs font-semibold text-violet-200';
      summary.textContent = 'รายละเอียดสูตรของฉัน';
      details.append(summary);
      bundle.titleField = cookbookField(details, 'ชื่อสูตร', bundle.recipe.title, false);
      bundle.summaryField = cookbookField(details, 'คำอธิบาย', bundle.recipe.summary);
      bundle.instructionsField = cookbookField(details, 'คำสั่ง Moment · หนึ่งข้อหนึ่งบรรทัด', bundle.recipe.settingInstructions.join('\n'));
      bundle.instructionsField.rows = Math.max(3, Math.min(8, bundle.recipe.settingInstructions.length));
      const persistenceNote = document.createElement('p');
      persistenceNote.className = 'text-[11px] text-slate-400';
      persistenceNote.textContent = 'สูตรส่วนตัวบันทึกในเบราว์เซอร์นี้ · ใช้ปุ่ม “บันทึกสูตร” หลังแก้ไข';
      details.append(persistenceNote);
      panel.append(details);
      bundle.titleField.addEventListener('input', () => {
        const title = bundle.titleField.value.trim() || 'สูตรใหม่ของฉัน';
        heading.querySelector('h2').textContent = title;
      });
      bundle.summaryField.addEventListener('input', () => {
        heading.querySelector('p').textContent = bundle.summaryField.value;
      });
    }

    const instructionsCard = document.createElement('div');
    instructionsCard.className = 'glass-card rounded-2xl p-4 space-y-2.5 border-cyan-500/20 bg-slate-900/40 text-xs';
    instructionsCard.innerHTML = `
      <div class="font-bold text-cyan-300 flex items-center gap-1.5">
        <svg class="w-3.5 h-3.5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        คำแนะนำการตั้งค่า Moment (Moment Setting):
      </div>
      <div class="space-y-1.5 text-slate-200 pl-1">
        ${bundle.recipe.settingInstructions.map(step => `
          <div class="flex items-start gap-2">
            <svg class="w-3 h-3 text-cyan-400 mt-1 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/></svg>
            <div class="flex-1 leading-relaxed">${escapeHtml(step)}</div>
          </div>
        `).join('')}
      </div>
    `;
    panel.append(instructionsCard);

    // Ready-to-copy Rubii Prompt / Opening Format Card (exactly as user requested)
    const promptSnippetCard = document.createElement('div');
    promptSnippetCard.className = 'glass-card rounded-2xl p-4 bg-slate-950/80 border border-cyan-500/30 shadow-lg space-y-2';
    promptSnippetCard.innerHTML = `
      <div class="flex items-center justify-between gap-2">
        <span class="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
          <svg class="w-3.5 h-3.5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/></svg>
          ข้อความนำไปวางจริงใน Rubii (Prompt / Example Output):
        </span>
        <span class="text-[10px] text-slate-400">คัดลอกไปใช้ใน Moment / Prompt ได้ทันที</span>
      </div>
      <div class="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/90 border border-white/10">
        <code id="cookbook-prompt-snippet" class="code-font text-xs sm:text-[13px] text-cyan-200 whitespace-pre-wrap break-all select-all flex-1 leading-relaxed">${escapeHtml(bundle.recipe.openingExample || '')}</code>
        <button type="button" id="cookbook-copy-snippet-btn" class="shrink-0 px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 font-semibold text-xs border border-cyan-400/30 active:scale-95 transition-all flex items-center gap-1.5 shadow-sm">
          <svg class="w-3.5 h-3.5 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <span>คัดลอก</span>
        </button>
      </div>
    `;
    const copySnippetBtn = promptSnippetCard.querySelector('#cookbook-copy-snippet-btn');
    const promptSnippetCode = promptSnippetCard.querySelector('#cookbook-prompt-snippet');
    copySnippetBtn.onclick = () => {
      const textToCopy = cookbookBundle.inputField ? cookbookBundle.inputField.value : bundle.recipe.openingExample;
      copyToClipboard(textToCopy, 'คัดลอกข้อความสำหรับ Rubii แล้ว!');
      copySnippetBtn.innerHTML = '<span class="text-emerald-300 font-bold">✓ คัดลอกแล้ว!</span>';
      setTimeout(() => {
        copySnippetBtn.innerHTML = '<svg class="w-3.5 h-3.5 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>คัดลอก</span>';
      }, 2000);
    };
    panel.append(promptSnippetCard);

    const note = document.createElement('div');
    note.className = 'p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-amber-200/90 flex items-center gap-2';
    note.innerHTML = `
      <svg class="w-3.5 h-3.5 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      <span>แท็บตั้งค่า: แท็กตกแต่ง → CSS ส่วนกลาง → Regex · ลำดับประมวลผล: Raw Regex → แทน Style tag → แสดงผล CSS</span>
    `;
    panel.append(note);

    cookbookBundle.inputField = cookbookField(panel, 'ข้อความ Character สำหรับทดลอง (ไม่ใช่แท็บตั้งค่า)', bundle.recipe.openingExample);
    cookbookBundle.inputField.rows = id === 'premium-scene-profile' ? 12 : 3;
    cookbookBundle.inputField.addEventListener('input', () => {
      promptSnippetCode.textContent = cookbookBundle.inputField.value;
    });
    cookbookBundle.targetField = cookbookSelect(panel, 'จำลองข้อความของ', bundle.patterns[0]?.applyTo === 'user' ? 'user' : 'character', [['character', 'ตัวละคร'], ['user', 'ผู้ใช้']]);

    const nav = document.createElement('nav');
    nav.className = 'grid grid-cols-3 gap-2 border-b border-white/10 pb-3';
    panel.append(nav);

    const tabs = [['tags', 'แท็กตกแต่ง'], ['css', 'CSS ส่วนกลาง'], ['regex', 'Regex']];
    const pages = new Map();
    for (const [key, label] of tabs) {
      const page = document.createElement('section');
      page.id = 'cookbook-tab-' + key;
      page.className = 'space-y-3';
      pages.set(key, page);
      panel.append(page);
      const b = document.createElement('button');
      b.className = 'px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 transition-all';
      b.textContent = label;
      b.onclick = () => {
        for (const [k, p] of pages) p.classList.toggle('hidden', k !== key);
      };
      nav.append(b);
      if (key !== 'tags') page.classList.add('hidden');
    }

    for (const s of bundle.styles) {
      const box = document.createElement('details');
      box.open = s.id === 'premium-profile-style';
      box.className = 'space-y-3 bg-slate-950/40 p-4 rounded-2xl border border-white/5';
      pages.get('tags').append(box);
      const title = document.createElement('summary');
      title.className = 'cursor-pointer font-semibold text-xs text-violet-200';
      title.textContent = s.title;
      box.append(title);
      s.tagField = cookbookField(box, 'ชื่อแท็ก', s.tagName, false);
      s.applyToField = cookbookSelect(box, 'ใช้กับ', s.applyTo, [['all', 'ทุกข้อความ'], ['user', 'ข้อความผู้ใช้'], ['character', 'ข้อความตัวละคร']]);
      s.templateField = cookbookField(box, 'เทมเพลต HTML · $1 = เนื้อหาภายในแท็ก', s.template);
      s.templateField.rows = s.id === 'premium-profile-style' ? 6 : 3;
    }

    bundle.cssField = cookbookField(pages.get('css'), 'CSS ส่วนกลาง', bundle.globalCSS ?? bundle.styles.map(s => s.css).join('\n'));
    bundle.cssField.rows = id === 'premium-scene-profile' ? 14 : 5;
    const cssHint = document.createElement('p');
    cssHint.className = 'text-xs text-slate-400';
    cssHint.textContent = 'CSS ส่วนกลางใช้ selector เพื่อกำหนดหน้าตา สูตรนี้ครอบกฎใต้ .rubii-message-character เพื่อแต่งเฉพาะข้อความตัวละคร; ใช้ .rubii-message-user สำหรับข้อความผู้ใช้ตามต้องการ';
    pages.get('css').append(cssHint);

    const regexPage = pages.get('regex');
    const renderRegexEditors = () => {
      regexPage.replaceChildren();
      const help = document.createElement('p');
      help.className = 'text-xs text-slate-400';
      help.textContent = 'แยกแต่ละสถานการณ์เป็น Regex คนละข้อ ระบบทดลองตามลำดับและส่งผลลัพธ์ของข้อก่อนหน้าให้ข้อต่อไป';
      regexPage.append(help);
      if (bundle.custom) {
        const addRule = document.createElement('button');
        addRule.type = 'button';
        addRule.className = 'rounded-xl border border-cyan-300/20 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-100 hover:bg-cyan-500/20';
        addRule.textContent = '＋ เพิ่ม Regex สำหรับอีกกรณี';
        addRule.onclick = () => addCustomCookbookPattern(bundle, renderRegexEditors);
        regexPage.append(addRule);
      }
      const rules = bundle.recipe.ruleOrder.filter(rule => rule.kind === 'pattern');
      for (let index = 0; index < rules.length; index++) {
        const rule = rules[index];
        const p = bundle.patterns.find(pattern => pattern.id === rule.id);
        if (p) renderCookbookPatternEditor(bundle, p, regexPage, index, rules.length, renderRegexEditors);
      }
      if (!rules.length) {
        const empty = document.createElement('p');
        empty.className = 'rounded-xl border border-white/10 p-4 text-xs text-slate-400';
        empty.textContent = 'สูตรนี้ยังไม่มี Regex · เพิ่มกฎเพื่อรองรับอีกสถานการณ์';
        regexPage.append(empty);
      }
    };
    renderRegexEditors();

    const buttons = document.createElement('div');
    buttons.className = 'flex gap-2.5 flex-wrap pt-2';
    panel.append(buttons);

    const run = document.createElement('button');
    run.innerHTML = '<span class="flex items-center gap-1.5"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg><span>ดูผลครบขั้น</span></span>';
    run.className = 'px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-xs font-medium shadow-md shadow-cyan-500/20 active:scale-95 transition-all';
    run.onclick = runCookbook;
    buttons.append(run);

    const reset = document.createElement('button');
    reset.textContent = 'คืนค่าตัวอย่าง';
    reset.className = 'px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-medium border border-white/10 transition-all';
    reset.onclick = () => openCookbook(id);
    buttons.append(reset);

    const copy = document.createElement('button');
    copy.innerHTML = '<span class="flex items-center gap-1.5"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>คัดลอกชุดตั้งค่า</span></span>';
    copy.className = reset.className;
    copy.onclick = () => {
      try {
        const regex = bundle.patterns.map(p => {
          const expression = parseCookbookRegexLiteral(p.expressionField.value);
          return { name: p.nameField.value, expression: cookbookRegexLiteral(expression.pattern, expression.flags), replacement: p.replacementField.value, applyTo: p.applyToField.value, matchStage: p.matchStageField.value };
        });
        copyToClipboard(JSON.stringify({ momentSetting: bundle.recipe.settingInstructions, regex, styles: bundle.styles.map(s => ({ tagName: s.tagField.value, template: s.templateField.value, applyTo: s.applyToField.value })), globalCSS: bundle.cssField.value }, null, 2), 'คัดลอกชุดตั้งค่า JSON แล้ว!');
      } catch (error) { document.getElementById('cookbook-status').textContent = error.message; }
    };
    buttons.append(copy);

    if (bundle.custom) {
      const save = document.createElement('button');
      save.type = 'button';
      save.textContent = 'บันทึกสูตร';
      save.className = 'px-4 py-2.5 bg-violet-500/20 hover:bg-violet-500/30 text-violet-100 rounded-xl text-xs font-semibold border border-violet-300/25 transition-all';
      save.onclick = () => saveCurrentCustomCookbook(bundle);
      buttons.append(save);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = 'ลบสูตรนี้';
      remove.className = 'ml-auto px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-200 rounded-xl text-xs border border-rose-300/15 transition-all';
      remove.onclick = () => deleteCustomCookbook(bundle.recipe.id);
      buttons.append(remove);
    }

    const status = document.createElement('p');
    status.id = 'cookbook-status';
    status.className = 'text-xs text-slate-400';
    status.setAttribute('aria-live', 'polite');
    panel.append(status);

    const frame = document.createElement('iframe');
    frame.id = 'cookbook-frame';
    frame.title = 'ภาพตัวอย่างหลังใส่ Global CSS';
    frame.setAttribute('sandbox', '');
    frame.setAttribute('referrerpolicy', 'no-referrer');
    frame.className = 'w-full rounded-2xl bg-slate-950 border border-white/10 shadow-inner';
    frame.style.height = '420px';
    panel.append(frame);

    const debugDetails = document.createElement('details');
    debugDetails.className = 'bg-slate-950/30 p-3 rounded-xl border border-white/5 text-slate-400 mt-1';
    const debugSummary = document.createElement('summary');
    debugSummary.className = 'text-xs font-semibold text-slate-400 cursor-pointer hover:text-slate-200 select-none';
    debugSummary.textContent = '🔍 ข้อมูลขั้นตอนการแปลงภายใน (Pipeline Debug Inspection)';
    debugDetails.append(debugSummary);

    for (const [id, label] of [['cookbook-raw', 'หลัง Raw Regex'], ['cookbook-expanded', 'หลังขยาย Style tags']]) {
      const subWrap = document.createElement('div');
      subWrap.className = 'mt-3 space-y-1';
      const subTitle = document.createElement('div');
      subTitle.className = 'text-[11px] font-semibold text-slate-300';
      subTitle.textContent = label;
      const pre = document.createElement('pre');
      pre.id = id;
      pre.className = 'text-xs whitespace-pre-wrap break-all p-3 bg-slate-950/70 rounded-lg text-cyan-200 code-font border border-white/5';
      subWrap.append(subTitle, pre);
      debugDetails.append(subWrap);
    }
    panel.append(debugDetails);

    await runCookbook();
}


function saveCurrentCustomCookbook(bundle) {
  try {
    const recipe = {
      ...bundle.recipe,
      title: bundle.titleField.value.trim() || 'สูตรใหม่ของฉัน',
      summary: bundle.summaryField.value.trim() || 'สูตรส่วนตัว',
      settingInstructions: bundle.instructionsField.value.split(/\r?\n/).map(line => line.trim()).filter(Boolean),
      openingExample: bundle.inputField.value
    };
    const activePatternIds = new Set(bundle.recipe.ruleOrder.filter(rule => rule.kind === 'pattern').map(rule => rule.id));
    const activePatternObjects = bundle.patterns.filter(pattern => activePatternIds.has(pattern.id));
    const patterns = activePatternObjects.map(pattern => {
      const expression = parseCookbookRegexLiteral(pattern.expressionField.value);
      const stored = Object.fromEntries(Object.entries(pattern).filter(([key]) => !key.endsWith('Field')));
      return { ...stored, title: pattern.nameField.value.trim() || pattern.title, pattern: expression.pattern, flags: expression.flags, replacement: pattern.replacementField.value, applyTo: pattern.applyToField.value, matchStage: pattern.matchStageField.value };
    });
    const css = bundle.cssField.value;
    const styles = bundle.styles.map((style, index) => {
      const stored = Object.fromEntries(Object.entries(style).filter(([key]) => !key.endsWith('Field')));
      return { ...stored, tagName: style.tagField.value.trim(), template: style.templateField.value, applyTo: style.applyToField.value, css: index === 0 ? css : '' };
    });
    if (styles.some(style => !/^[a-z][a-z0-9-]{0,40}$/.test(style.tagName))) throw new Error('ชื่อ Tag ใช้อักษรอังกฤษตัวเล็ก ตัวเลข หรือขีดกลาง');
    const saved = { custom: true, contentVersion: bundle.contentVersion, recipe, patterns, styles, globalCSS: css };
    const bundles = getCustomCookbookBundles();
    const index = bundles.findIndex(item => item.recipe.id === recipe.id);
    if (index < 0) bundles.unshift(saved); else bundles[index] = saved;
    saveCustomCookbookBundles(bundles);
    bundle.recipe = recipe;
    patterns.forEach((pattern, index) => Object.assign(activePatternObjects[index], pattern));
    bundle.patterns = activePatternObjects;
    styles.forEach((style, index) => Object.assign(bundle.styles[index], style));
    bundle.globalCSS = css;
    document.getElementById('cookbook-status').textContent = 'บันทึกสูตรแล้ว · สูตรนี้จะอยู่ในคลังหลักของเบราว์เซอร์นี้';
    renderCookbookLibrary();
  } catch (error) {
    document.getElementById('cookbook-status').textContent = 'บันทึกไม่ได้: ' + error.message;
  }
}

function deleteCustomCookbook(id) {
  if (!confirm('ลบสูตรนี้ออกจากคลังในเบราว์เซอร์นี้หรือไม่?')) return;
  saveCustomCookbookBundles(getCustomCookbookBundles().filter(bundle => bundle.recipe.id !== id));
  closeCookbookModal();
  renderCookbookLibrary();
}

function renderCookbookPatternEditor(bundle, pattern, parent, index, count, rerender) {
  const box = document.createElement('details');
  box.open = pattern.id === 'key-value-generic' || pattern.id.startsWith('custom-pattern-');
  box.className = 'space-y-3 rounded-2xl border border-white/5 bg-slate-950/40 p-4';
  const title = document.createElement('summary');
  title.className = 'cursor-pointer text-xs font-semibold text-cyan-300';
  title.textContent = pattern.title;
  box.append(title);
  parent.append(box);

  pattern.nameField = cookbookField(box, 'ชื่อกรณี', pattern.title || 'Regex', false);
  pattern.nameField.addEventListener('input', () => { title.textContent = pattern.nameField.value || 'Regex'; });
  pattern.applyToField = cookbookSelect(box, 'ใช้กับ', pattern.applyTo || 'character', [['all', 'ทุกข้อความ'], ['user', 'ข้อความผู้ใช้'], ['character', 'ข้อความตัวละคร']]);
  pattern.matchStageField = cookbookSelect(box, 'ค้นหาใน', pattern.matchStage || 'raw', [['raw', 'เนื้อหาต้นฉบับ (รวมแท็ก HTML)'], ['displayed_text', 'ข้อความหลังจัดรูปแบบ']]);
  pattern.expressionField = cookbookField(box, 'นิพจน์เต็ม /pattern/flags · ใส่ Pattern และ Flags ในช่องเดียวตาม Rubii', cookbookRegexLiteral(pattern.pattern || '', pattern.flags || ''), false);
  pattern.replacementField = cookbookField(box, 'Replacement', pattern.replacement || '');
  const captureGroups = Array.isArray(pattern.captureGroups) ? pattern.captureGroups : [];
  const limitations = Array.isArray(pattern.limitations) ? pattern.limitations : [];
  const explain = document.createElement('p');
  explain.textContent = [...captureGroups.map(group => '$' + group.index + ' = ' + group.meaning), ...limitations].join(' • ') || 'จัดกลุ่มด้วยวงเล็บ แล้วนำค่ามาใช้ใน Replacement ด้วย $1, $2';
  explain.className = 'text-xs text-slate-400';
  box.append(explain);

  const actions = document.createElement('div');
  actions.className = 'flex flex-wrap items-center gap-3';
  const test = document.createElement('button');
  test.type = 'button';
  test.textContent = 'อ่าน Pattern แยกสีใน Regex Sandbox';
  test.className = 'text-xs text-cyan-300 underline';
  test.onclick = () => {
    try {
      const expression = parseCookbookRegexLiteral(pattern.expressionField.value);
      closeCookbookModal();
      sendToSandbox(...[expression.pattern, expression.flags, pattern.replacementField.value, bundle.inputField.value].map(encodeURIComponent));
    } catch (error) { document.getElementById('cookbook-status').textContent = error.message; }
  };
  actions.append(test);

  if (bundle.custom) {
    for (const [label, delta, disabled] of [['↑', -1, index === 0], ['↓', 1, index === count - 1]]) {
      const move = document.createElement('button');
      move.type = 'button'; move.textContent = label; move.title = 'จัดลำดับ Regex'; move.disabled = disabled;
      move.className = 'rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-300 disabled:opacity-30';
      move.onclick = () => moveCustomCookbookPattern(bundle, pattern.id, delta, rerender);
      actions.append(move);
    }
    const remove = document.createElement('button');
    remove.type = 'button'; remove.textContent = 'ลบกฎ';
    remove.className = 'ml-auto text-xs text-rose-300 underline';
    remove.onclick = () => {
      bundle.patterns = bundle.patterns.filter(item => item.id !== pattern.id);
      bundle.recipe.ruleOrder = bundle.recipe.ruleOrder.filter(rule => !(rule.kind === 'pattern' && rule.id === pattern.id));
      rerender();
      document.getElementById('cookbook-status').textContent = 'ลบ Regex ออกจากสูตรแล้ว · กดบันทึกสูตรเพื่อเก็บการเปลี่ยนแปลง';
    };
    actions.append(remove);
  }
  box.append(actions);
}

function addCustomCookbookPattern(bundle, rerender) {
  const suffix = globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const id = `custom-pattern-${suffix}`;
  bundle.patterns.push({
    id,
    title: 'Key–Value · กรณีใหม่',
    summary: 'จับข้อมูลรูปแบบชื่อ: ค่า',
    pattern: '^([^:：\\n]{1,500})[:：]\\s*(.+)$',
    flags: 'gm',
    replacement: '$1: $2',
    applyTo: 'character',
    matchStage: 'raw',
    captureGroups: [{ index: 1, meaning: 'ชื่อหัวข้อ' }, { index: 2, meaning: 'ค่า' }],
    limitations: ['หนึ่งบรรทัดต่อหนึ่งค่า']
  });
  bundle.recipe.ruleOrder.push({ kind: 'pattern', id });
  rerender();
  document.getElementById('cookbook-status').textContent = 'เพิ่ม Regex แล้ว · แก้ Expression/Replacement แล้วกดบันทึกสูตร';
}

function moveCustomCookbookPattern(bundle, id, delta, rerender) {
  const rules = bundle.recipe.ruleOrder;
  const current = rules.findIndex(rule => rule.kind === 'pattern' && rule.id === id);
  const patternIndexes = rules.map((rule, index) => rule.kind === 'pattern' ? index : -1).filter(index => index >= 0);
  const position = patternIndexes.indexOf(current);
  const target = patternIndexes[position + delta];
  if (current < 0 || target === undefined) return;
  [rules[current], rules[target]] = [rules[target], rules[current]];
  rerender();
  document.getElementById('cookbook-status').textContent = 'จัดลำดับ Regex แล้ว · กดบันทึกสูตรเพื่อเก็บการเปลี่ยนแปลง';
}

function sanitizeCookbookHTML(html) {
  const doc=new DOMParser().parseFromString(html,'text/html');
  const allowed=new Set(['DIV','SPAN','SECTION','ARTICLE','HEADER','FOOTER','MAIN','P','B','I','EM','STRONG','SMALL','H1','H2','H3','H4','CODE','PRE','BR','HR','BLOCKQUOTE','DETAILS','SUMMARY','UL','OL','LI','DEL','TABLE','THEAD','TBODY','TR','TH','TD']);
  const clean=(node)=>{
    if(node.nodeType===Node.TEXT_NODE) return document.createTextNode(node.textContent);
    if(node.nodeType!==Node.ELEMENT_NODE) return document.createTextNode('');
    if(!allowed.has(node.tagName)) return document.createTextNode(node.textContent);
    const result=document.createElement(node.tagName.toLowerCase());
    for(const a of ['class','data-state','style','open','title']) if(node.hasAttribute(a)) result.setAttribute(a,node.getAttribute(a));
    if(node.tagName==='CODE') { result.textContent=node.innerHTML; return result; }
    for(const child of node.childNodes) result.append(clean(child));return result;
  };
  const box=document.createElement('div');for(const child of doc.body.childNodes) box.append(clean(child));return box.innerHTML;
}

async function runCookbook() {
  const bundle=cookbookBundle;if(!bundle) return;
  const revision=++cookbookRevision;
  const status=document.getElementById('cookbook-status');status.textContent='กำลังทดลองตามลำดับ…';
  document.getElementById('cookbook-frame').srcdoc='';
  document.getElementById('cookbook-raw').textContent='';document.getElementById('cookbook-expanded').textContent='';
  try {
    let text=bundle.inputField.value;const counts=[];
    for(const entry of bundle.recipe.ruleOrder.filter(r=>r.kind==='pattern')) {
      const p=bundle.patterns.find(p=>p.id===entry.id);
      const expression = parseCookbookRegexLiteral(p.expressionField.value);
      if(p.applyToField.value!=='all' && p.applyToField.value!==bundle.targetField.value) {counts.push(p.nameField.value+': ข้าม (เป้าหมายคนละประเภท)');continue;}
      const response=await fetch('/v1/regex/test',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pattern:expression.pattern,flags:expression.flags,replacement:p.replacementField.value,input:text})});
      const json=await response.json();if(revision!==cookbookRevision) return;
      if(!response.ok) throw new Error(p.title+': '+(json.error?.message||'ทดลองไม่สำเร็จ'));
      if(json.data.truncated) throw new Error('พบ match เกินขอบเขต ให้ลดข้อความทดลอง');
      text=json.data.output;counts.push(p.title+': '+json.data.matches.length+' match');
    }
    document.getElementById('cookbook-raw').textContent=text;
    for(const entry of bundle.recipe.ruleOrder.filter(r=>r.kind==='style')) {
      const s=bundle.styles.find(s=>s.id===entry.id),tag=s.tagField.value;
      if(s.applyToField.value!=='all' && s.applyToField.value!==bundle.targetField.value) continue;
      if(!/^[a-z][a-z0-9-]{0,40}$/.test(tag)) throw new Error('ชื่อ Tag ใช้อักษรอังกฤษตัวเล็ก ตัวเลข หรือขีดกลาง');
      const expression=new RegExp('<'+tag+'>([\\s\\S]*?)</'+tag+'>','g');
      text=text.replace(expression,(_,body)=>s.templateField.value.split('$1').join(body));
      if(text.length>65536) throw new Error('ผลลัพธ์ยาวเกินขอบเขตทดลอง');
    }
    document.getElementById('cookbook-expanded').textContent=text;
    const css=bundle.cssField.value;if(css.length>20000) throw new Error('CSS ยาวเกินขอบเขตทดลอง');
    const safeCSS=css.replace(/<\/style/gi,'');
    const messageClass=bundle.targetField.value==='user'?'rubii-message-user':'rubii-message-character';
    const baseThemeCss = `
      html { color-scheme: dark; }
      body {
        box-sizing: border-box; min-height: 100vh; margin: 0; padding: 14px;
        background: #050b18; color: #e2e8f0;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 13.5px; line-height: 1.6; overflow-wrap: anywhere;
      }
      main { min-height: 40px; }
      .rubii-message-character {
        background: rgba(15, 23, 42, 0.75); border: 1px solid rgba(56, 189, 248, 0.25);
        border-radius: 16px; padding: 14px 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.35);
      }
      .rubii-message-character::before {
        content: 'Character Message Preview'; display: block; font-size: 10px; font-weight: 700;
        color: #38bdf8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; opacity: 0.85;
      }
      .rubii-message-user {
        background: rgba(30, 27, 75, 0.65); border: 1px solid rgba(168, 85, 247, 0.25);
        border-radius: 16px; padding: 14px 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.35);
      }
      .rubii-message-user::before {
        content: 'User Message Preview'; display: block; font-size: 10px; font-weight: 700;
        color: #c084fc; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; opacity: 0.85;
      }

      /* --- Key-Value & Status Rows --- */
      .model-status-row, .bracket-kv {
        display: flex; justify-content: space-between; align-items: center; gap: 12px;
        margin: 6px 0; padding: 8px 12px;
        background: rgba(8, 18, 42, 0.7); border: 1px solid rgba(56, 189, 248, 0.2);
        border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      }
      .model-status-row b, .model-status-row .key, .bracket-kv b {
        color: #38bdf8; font-weight: 600; font-size: 12.5px; letter-spacing: 0.02em;
      }
      .model-status-row span, .model-status-row .val, .bracket-kv span {
        color: #f1f5f9; font-weight: 500;
      }

      /* --- DateTime Badges --- */
      .datetime-badge {
        display: inline-flex; align-items: center; gap: 10px;
        padding: 6px 14px; margin: 6px 0;
        background: linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(99, 102, 241, 0.15));
        border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 9999px;
        color: #e0f2fe; font-size: 12px; font-weight: 500;
        box-shadow: 0 2px 10px rgba(14, 165, 233, 0.15);
      }
      .datetime-badge .date { color: #38bdf8; font-weight: 600; }
      .datetime-badge .time { color: #a5f3fc; opacity: 0.9; }
      .datetime-badge .date::before { content: '📅 '; }
      .datetime-badge .time::before { content: '🕒 '; }

      /* --- Status Cards & Thought / Action --- */
      .status-card, .scene-profile-card {
        margin: 10px 0; padding: 12px 16px;
        background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(147, 51, 234, 0.3);
        border-radius: 14px; box-shadow: 0 4px 16px rgba(0,0,0,0.3);
      }
      .status-body { white-space: pre-wrap; color: #e2e8f0; line-height: 1.6; }
      .action {
        color: #fde68a; font-style: italic; opacity: 0.95;
        padding: 2px 4px;
      }
      .thought {
        margin: 8px 0; padding: 6px 12px;
        border-left: 3px dotted rgba(192, 132, 252, 0.6);
        background: rgba(192, 132, 252, 0.06); border-radius: 0 8px 8px 0;
        color: #d8b4fe; font-style: italic;
      }

      /* --- Chat & Messaging Components --- */
      .cb-chathead { padding: 8px 12px; color: #a5f3fc; font-weight: 700; border-bottom: 1px solid #334155; margin-bottom: 8px; }
      .cb-msg { padding: 10px 14px; margin: 8px 0; border-radius: 14px; max-width: 80%; white-space: pre-wrap; font-size: 13px; line-height: 1.5; }
      .cb-msg small { display: block; font-size: 10px; opacity: 0.65; margin-top: 4px; text-align: right; }
      .cb-in { background: #1e293b; color: #f8fafc; border: 1px solid rgba(255,255,255,0.08); margin-right: auto; }
      .cb-out { background: linear-gradient(135deg, #4f46e5, #4338ca); color: #fff; margin-left: auto; box-shadow: 0 2px 10px rgba(79, 70, 229, 0.3); }
      .cb-livehead { padding: 10px 12px; border-bottom: 1px solid #334155; color: #f8fafc; font-weight: 600; }
      .cb-livehead b { background: #e11d48; color: #fff; padding: 2px 7px; border-radius: 4px; margin-right: 8px; font-size: 10px; }
      .cb-livechat { padding: 6px 10px; margin: 4px 0; background: rgba(15, 23, 42, 0.6); border-radius: 8px; font-size: 12.5px; }
      .cb-livechat b { color: #38bdf8; margin-right: 6px; }
      .cb-gift { padding: 8px 12px; margin: 6px 0; border-radius: 10px; background: linear-gradient(90deg, #9d174d, #c2410c); color: #fff; font-weight: 600; font-size: 12.5px; }
      .cb-clock { text-align: center; font-size: 32px; font-weight: 300; color: #e2e8f0; margin: 8px 0; }
      .cb-notice { padding: 12px 14px; background: #1e293b; border-radius: 12px; margin: 8px 0; border: 1px solid rgba(255,255,255,0.08); }
      .cb-notice small { color: #94a3b8; font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.05em; }
      .cb-notice h3 { margin: 4px 0; font-size: 14px; color: #38bdf8; }
      .cb-notice p { margin: 0; color: #cbd5e1; font-size: 12.5px; }
      .cb-quest { padding: 10px 12px; color: #fde68a; font-weight: 700; border-bottom: 1px solid rgba(245, 158, 11, 0.3); margin-bottom: 6px; }
      .cb-task { padding: 8px 10px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 12.5px; }
      .cb-task b { font-size: 11px; padding: 2px 6px; border-radius: 4px; margin-right: 8px; background: rgba(245, 158, 11, 0.2); color: #fbbf24; }
      .cb-task[data-state="ทำแล้ว"] b { background: rgba(16, 185, 129, 0.2); color: #34d399; }

      /* --- Headings, Brackets & Markdown --- */
      .bracket-topic, .markdown-heading {
        margin: 14px 0 8px; padding: 8px 14px;
        border-left: 4px solid #a855f7; border-radius: 0 10px 10px 0;
        background: linear-gradient(90deg, rgba(168, 85, 247, 0.2), transparent);
        color: #f3e8ff; font-size: 15px; font-weight: 700;
      }
      .markdown-list-item, .premium-list-item {
        display: flex; gap: 8px; align-items: flex-start;
        margin: 6px 0; color: #e2e8f0; font-size: 13px;
      }
      .markdown-list-marker, .premium-list-star { color: #fbbf24; font-weight: 700; }
      .markdown-blockquote {
        margin: 10px 0; padding: 10px 16px;
        border-left: 3px solid #818cf8; border-radius: 0 10px 10px 0;
        background: rgba(99, 102, 241, 0.1); color: #c7d2fe; font-style: italic;
      }
      .markdown-code, .premium-code {
        padding: 2px 7px; border-radius: 6px;
        background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(56, 189, 248, 0.3);
        color: #38bdf8; font-family: ui-monospace, monospace; font-size: 12px;
      }

      /* --- Premium Profile Components --- */
      .premium-profile {
        margin: 12px 0; padding: 16px;
        background: linear-gradient(145deg, #0f172a, #1e1b4b);
        border: 1px solid rgba(216, 180, 254, 0.3); border-radius: 18px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      }
      .premium-dialogue {
        padding: 12px 16px; margin: 10px 0;
        background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(168, 85, 247, 0.3);
        border-radius: 12px; color: #faf5ff; font-size: 14px;
      }
      .premium-quote-mark { color: #facc15; font-size: 20px; font-weight: 700; margin-right: 6px; }
      .premium-ooc {
        padding: 10px 14px; margin: 8px 0;
        background: rgba(19, 78, 74, 0.25); border: 1px solid rgba(45, 212, 191, 0.3);
        border-radius: 10px; color: #ccfbf1; font-size: 12px;
      }
      .premium-ooc-label { display: block; font-size: 9px; font-weight: 700; color: #2dd4bf; letter-spacing: 0.1em; margin-bottom: 2px; }

      /* --- HUD Drawers & UI Blueprint Kits --- */
      .hud-notification-wrap, .hud-character-wrap, .hud-slip-wrap { margin-bottom: 12px; }
      .hud-details-cyan {
        background: rgba(4, 13, 33, 0.88); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
        border: 2px solid #00c8ff; border-radius: 24px; padding: 14px 18px; color: #f0f9ff;
        box-shadow: 0 8px 32px rgba(0, 200, 255, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.15);
      }
      .hud-details-magenta {
        background: rgba(28, 4, 22, 0.88); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
        border: 2px solid #ff007f; border-radius: 24px; padding: 14px 18px; color: #fff;
        box-shadow: 0 8px 32px rgba(255, 0, 127, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15);
      }

      /* --- Versatile Headings --- */
      .heading-cyber-hud {
        margin: 14px 0 8px; padding: 12px 18px;
        background: linear-gradient(90deg, rgba(0,187,249,0.18), rgba(168,85,247,0.08) 70%, transparent);
        border-left: 5px solid #00f0ff; border-top: 1px solid rgba(0,240,255,0.25); border-bottom: 1px solid rgba(0,240,255,0.1);
        border-radius: 0 16px 16px 0; box-shadow: 0 4px 20px rgba(0,240,255,0.15);
      }
      .heading-fantasy-gold {
        margin: 14px 0 8px; padding: 12px 18px;
        background: linear-gradient(135deg, rgba(217,119,6,0.2), rgba(120,53,15,0.15) 50%, rgba(15,23,42,0.8));
        border: 1.5px solid #f59e0b; border-radius: 16px;
        box-shadow: 0 4px 24px rgba(245,158,11,0.2), inset 0 1px 0 rgba(254,243,199,0.3);
      }
      .heading-luxury-glass {
        margin: 14px 0 8px; padding: 12px 18px;
        background: linear-gradient(135deg, rgba(255,255,255,0.09), rgba(255,255,255,0.03));
        backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255,255,255,0.2); border-radius: 18px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.3);
      }
      .heading-terminal-matrix {
        margin: 14px 0 8px; padding: 10px 16px;
        background: rgba(2,6,23,0.92); border: 1px solid #22c55e; border-left: 5px solid #22c55e;
        border-radius: 0 12px 12px 0; box-shadow: 0 4px 20px rgba(34,197,94,0.15);
        font-family: ui-monospace, monospace;
      }
      .hud-footer-bar {
        margin-top: 14px; padding: 10px 16px;
        background: rgba(15,23,42,0.85); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
        border: 1px solid rgba(56,189,248,0.25); border-radius: 16px;
        box-shadow: 0 6px 24px rgba(0,0,0,0.35);
      }
    `;
    document.getElementById('cookbook-frame').srcdoc='<!doctype html><html lang="th"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data:; font-src data:; media-src data:; connect-src \'none\'; form-action \'none\'; base-uri \'none\'"><style>'+baseThemeCss+'\n'+safeCSS+'</style></head><body><main class="'+messageClass+'">'+sanitizeCookbookHTML(text)+'</main></body></html>';
    status.textContent='Raw Regex → Style tag → CSS · '+(counts.join(' • ')||'สูตรนี้ใช้ Style tag โดยไม่ต้องมี Regex')+' · ถ้า marker ไม่ตรงรูปแบบจะยังเหลือข้อความเดิม';
  }catch(e){if(revision===cookbookRevision) status.textContent='ตรวจไม่ได้: '+e.message;}
}
