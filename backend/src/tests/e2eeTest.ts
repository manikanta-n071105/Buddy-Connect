import { encryptPayload, decryptPayload, encryptField, decryptField } from '../utils/encryption';

async function runE2EETest() {
  console.log('--- 1. Testing Payload Encryption & Decryption ---');
  const sampleRequest = {
    username: 'mani07',
    action: 'SUBMIT_REPORT',
    meta: {
      timestamp: Date.now(),
      records: [1, 2, 3]
    }
  };

  const encryptedReq = encryptPayload(sampleRequest);
  console.log('Encrypted Payload:', {
    __e2ee: encryptedReq.__e2ee,
    ivLength: encryptedReq.iv.length,
    dataPreview: encryptedReq.data.slice(0, 30) + '...'
  });

  const decryptedReq = decryptPayload(encryptedReq);
  console.log('Decrypted Request:', decryptedReq);
  const reqMatches = JSON.stringify(sampleRequest) === JSON.stringify(decryptedReq);
  console.log('Payload Roundtrip Match:', reqMatches ? '✅ PASSED' : '❌ FAILED');

  console.log('\n--- 2. Testing Database Field-Level Encryption (Data at Rest) ---');
  const sensitivePhone = '+91 9999999999';
  const encryptedDbField = encryptField(sensitivePhone);
  console.log('Stored in DB:', encryptedDbField);
  const decryptedDbField = decryptField(encryptedDbField);
  console.log('Read from DB:', decryptedDbField);
  const dbMatches = sensitivePhone === decryptedDbField;
  console.log('DB Field Roundtrip Match:', dbMatches ? '✅ PASSED' : '❌ FAILED');

  console.log('\n--- 3. Testing Non-encrypted Field Backwards Compatibility ---');
  const legacyField = 'Plain Old Text In DB';
  const legacyDecrypted = decryptField(legacyField);
  console.log('Legacy field gracefully untouched:', legacyDecrypted === legacyField ? '✅ PASSED' : '❌ FAILED');

  if (reqMatches && dbMatches && legacyDecrypted === legacyField) {
    console.log('\n🎉 ALL E2EE SECURITY CHECKS PASSED SUCCESSFULLY!');
  } else {
    process.exit(1);
  }
}

runE2EETest();

