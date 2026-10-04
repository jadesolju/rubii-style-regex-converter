async function verifyAll() {
  console.log('========================================');
  console.log('   LOCAL SYSTEM VERIFICATION REPORT');
  console.log('========================================\n');

  let passed = 0;
  let total = 0;

  async function check(name, fn) {
    total++;
    try {
      const ok = await fn();
      if (ok) {
        console.log(`[PASS] ${name}`);
        passed++;
      } else {
        console.log(`[FAIL] ${name}`);
      }
    } catch (e) {
      console.log(`[ERROR] ${name}: ${e.message}`);
    }
  }

  const port = process.env.PORT ?? 3333;
  const baseUrl = `http://127.0.0.1:${port}`;

  // 1. Health check
  await check('1. Health Check Endpoint (/healthz)', async () => {
    const res = await fetch(`${baseUrl}/healthz`);
    const json = await res.json();
    return res.status === 200 && json.status === 'ok';
  });

  // 2. Web UI Delivery
  await check('2. Web UI Delivery (GET /)', async () => {
    const res = await fetch(`${baseUrl}/`);
    const text = await res.text();
    return res.status === 200 && text.includes('Regex Studio') && text.includes('glass-card') && text.includes('<svg');
  });

  // 3. Lessons API with audience filtering
  await check('3. Lessons API with Audience filter (/v1/lessons)', async () => {
    const resUser = await fetch(`${baseUrl}/v1/lessons?audience=app_user`);
    const jsonUser = await resUser.json();
    const resDev = await fetch(`${baseUrl}/v1/lessons?audience=developer`);
    const jsonDev = await resDev.json();
    return jsonUser.data.length > 0 && jsonDev.data.length > 0;
  });

  // 4. Patterns API
  await check('4. Patterns Catalog API (/v1/patterns)', async () => {
    const res = await fetch(`${baseUrl}/v1/patterns`);
    const json = await res.json();
    return json.data.length >= 3 && json.data.some(p => p.id === 'affection-number');
  });

  // 5. Recipes API
  await check('5. Recipes Blueprint API (/v1/recipes)', async () => {
    const res = await fetch(`${baseUrl}/v1/recipes`);
    const json = await res.json();
    return json.data.length >= 3;
  });

  // 6. Recipe Export Bundle
  await check('6. Recipe Bundle Exporter (/v1/recipes/dialogue-and-actions/export)', async () => {
    const res = await fetch(`${baseUrl}/v1/recipes/dialogue-and-actions/export`);
    const json = await res.json();
    return json.data?.recipe?.id === 'dialogue-and-actions' && json.data?.patterns?.length > 0;
  });

  // 7. Regex Sandbox Live Worker Test with Capture & Replacement
  await check('7. Regex Sandbox Live Worker Match & Replace (/v1/regex/test)', async () => {
    const res = await fetch(`${baseUrl}/v1/regex/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pattern: 'Affection[:：]\\s*(\\d{1,3})',
        flags: 'gi',
        replacement: 'Affection: $1',
        input: 'Affection: 92'
      })
    });
    const json = await res.json();
    const match = json.data?.matches?.[0];
    const output = json.data?.output;
    return match?.match === 'Affection: 92' && match?.captures?.[0] === '92' && output === 'Affection: 92';
  });

  // 8. ReDoS Safety & Worker Protection
  await check('8. ReDoS & Timeout Protection Handler', async () => {
    const res = await fetch(`${baseUrl}/v1/regex/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pattern: '^(a+)+$',
        flags: '',
        replacement: '',
        input: 'a'.repeat(16000) + '!'
      })
    });
    const json = await res.json();
    return res.status === 422 && json.error?.code === 'REGEX_TIMEOUT';
  });

  console.log(`\n========================================`);
  console.log(`   RESULT: ${passed} / ${total} TESTS PASSED`);
  console.log(`========================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

verifyAll();
