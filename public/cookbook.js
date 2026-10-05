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

function renderCookbookLibrary() {
  const main = document.getElementById('view-recipes');
  let panel = document.getElementById('cookbook-library');
  if (!panel) {
    panel = document.createElement('section'); panel.id = 'cookbook-library';
    panel.className = 'glass-card rounded-3xl p-6 space-y-4';
    main.prepend(panel);
  }
  panel.replaceChildren();
  const header = document.createElement('div');
  header.className = 'flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between';
  const intro = document.createElement('div');
  intro.innerHTML = '<h2 class="text-xl font-bold text-cyan-300">Cookbook · สูตรครบชุด</h2><p class="mt-1 text-sm text-slate-300">สูตรเป็นแกนหลักของเวิร์กโฟลว์: เปิด แก้ Pattern, Tag, CSS และทดลอง Preview ครบชุดได้ที่นี่</p>';
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
  panel.append(list);
}

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
    showToast(error.message || 'สร้างสูตรไม่สำเร็จ');
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

    const note = document.createElement('div');
    note.className = 'p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-amber-200/90 flex items-center gap-2';
    note.innerHTML = `
      <svg class="w-3.5 h-3.5 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      <span>แท็บตั้งค่า: แท็กตกแต่ง → CSS ส่วนกลาง → Regex · ลำดับประมวลผล: Raw Regex → แทน Style tag → แสดงผล CSS</span>
    `;
    panel.append(note);

    cookbookBundle.inputField = cookbookField(panel, 'ข้อความ Character สำหรับทดลอง (ไม่ใช่แท็บตั้งค่า)', bundle.recipe.openingExample);
    cookbookBundle.inputField.rows = id === 'premium-scene-profile' ? 12 : 3;
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
    copy.innerHTML = '<span class="flex items-center gap-1.5"><svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>คัดลอกชุดตั้งค่า</span></span>';
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

    for (const [id, label] of [['cookbook-raw', 'หลัง Raw Regex'], ['cookbook-expanded', 'หลังขยาย Style tags']]) {
      const details = document.createElement('details');
      details.className = 'bg-slate-950/40 p-3 rounded-xl border border-white/5';
      const title = document.createElement('summary');
      title.className = 'text-xs font-semibold text-slate-300 cursor-pointer';
      title.textContent = label;
      const pre = document.createElement('pre');
      pre.id = id;
      pre.className = 'text-xs whitespace-pre-wrap break-all p-3 bg-slate-950/60 rounded-lg mt-2 text-cyan-200 code-font';
      details.append(title, pre);
      panel.append(details);
    }

    const frame = document.createElement('iframe');
    frame.id = 'cookbook-frame';
    frame.title = 'ภาพตัวอย่างหลังใส่ Global CSS';
    frame.setAttribute('sandbox', '');
    frame.setAttribute('referrerpolicy', 'no-referrer');
    frame.className = 'w-full rounded-2xl bg-slate-950 border border-white/10 shadow-inner';
    frame.style.height = '420px';
    panel.append(frame);

    await runCookbook();
  } catch (e) {
    if (revision === cookbookRevision) panel.textContent = e.message;
  }
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
  const allowed=new Set(['DIV','SPAN','SECTION','ARTICLE','HEADER','FOOTER','P','B','I','EM','STRONG','SMALL','H1','H2','H3','H4','CODE','PRE','BR','HR','BLOCKQUOTE','DETAILS','SUMMARY','UL','OL','LI','DEL','TABLE','THEAD','TBODY','TR','TH','TD']);
  const clean=(node)=>{
    if(node.nodeType===Node.TEXT_NODE) return document.createTextNode(node.textContent);
    if(node.nodeType!==Node.ELEMENT_NODE) return document.createTextNode('');
    if(!allowed.has(node.tagName)) return document.createTextNode(node.textContent);
    const result=document.createElement(node.tagName.toLowerCase());
    for(const a of ['class','data-state']) if(node.hasAttribute(a)) result.setAttribute(a,node.getAttribute(a));
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
    `;
    document.getElementById('cookbook-frame').srcdoc='<!doctype html><html lang="th"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data:; font-src data:; media-src data:; connect-src \'none\'; form-action \'none\'; base-uri \'none\'"><style>'+baseThemeCss+'\n'+safeCSS+'</style></head><body><main class="'+messageClass+'">'+sanitizeCookbookHTML(text)+'</main></body></html>';
    status.textContent='Raw Regex → Style tag → CSS · '+(counts.join(' • ')||'สูตรนี้ใช้ Style tag โดยไม่ต้องมี Regex')+' · ถ้า marker ไม่ตรงรูปแบบจะยังเหลือข้อความเดิม';
  }catch(e){if(revision===cookbookRevision) status.textContent='ตรวจไม่ได้: '+e.message;}
}
