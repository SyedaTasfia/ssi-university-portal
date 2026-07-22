
require('dotenv').config();

const BASE = process.env.ACAPY_ADMIN_URL || 'http://localhost:8031';

async function call(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${await res.text()}`);
  return res.json();
}

(async () => {
 
  let schemaId;
  try {
    const r = await call('POST', '/schemas', {
      schema_name: 'university_student_id',
      schema_version: '1.0',
      attributes: ['student_name', 'student_id', 'department', 'email'],
    });
    schemaId = r.sent?.schema_id || r.schema_id;
    console.log('✅ Schema published:', schemaId);
  } catch (e) {
    console.log('ℹ️ Schema mone hoy age thekei achhe, khuje dekhchhi...');
    const ex = await call('GET', '/schemas/created?schema_name=university_student_id');
    schemaId = ex.schema_ids[ex.schema_ids.length - 1];
    console.log('✅ Found existing schema:', schemaId);
  }
  if (!schemaId) throw new Error('Schema ID paoa gelo na');

  
  console.log('⏳ Cred-def publish hochhe (public ledger-e 10-60 sec lagte pare)...');
  let credDefId;
  try {
    const r = await call('POST', '/credential-definitions', {
      schema_id: schemaId,
      tag: 'university',
      support_revocation: false,
    });
    credDefId = r.sent?.credential_definition_id || r.credential_definition_id;
    console.log('✅ Cred-def published:', credDefId);
  } catch (e) {
    console.log('ℹ️ Cred-def mone hoy age thekei achhe, khuje dekhchhi...');
    const ex = await call('GET',
      '/credential-definitions/created?schema_id=' + encodeURIComponent(schemaId));
    credDefId = ex.credential_definition_ids[0];
    console.log('✅ Found existing cred-def:', credDefId);
  }

  console.log('\n👉 Nicher dui line .env file-e boshao:\n');
  console.log('SCHEMA_ID=' + schemaId);
  console.log('CRED_DEF_ID=' + credDefId);
})().catch((e) => { console.error('❌', e.message); process.exit(1); });