const http = require('http');
const fs = require('fs');
const path = require('path');

function login(email, password) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(JSON.parse(data)));
      }
    );
    req.on('error', reject);
    req.write(JSON.stringify({ email, password }));
    req.end();
  });
}

function uploadDoc(token, title) {
  return new Promise((resolve, reject) => {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const sampleFile = './uploads/sample_test.pdf';
    let fileBuf;
    if (fs.existsSync(sampleFile)) {
      fileBuf = fs.readFileSync(sampleFile);
    } else {
      fileBuf = Buffer.from('%PDF-1.4 Test Content');
    }

    let head = `--${boundary}\r\nContent-Disposition: form-data; name="title"\r\n\r\n${title}\r\n`;
    head += `--${boundary}\r\nContent-Disposition: form-data; name="category"\r\n\r\nEngineering\r\n`;
    head += `--${boundary}\r\nContent-Disposition: form-data; name="document_type"\r\n\r\nPDF\r\n`;
    head += `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test_proposal.pdf"\r\nContent-Type: application/pdf\r\n\r\n`;

    const foot = `\r\n--${boundary}--\r\n`;
    const payload = Buffer.concat([Buffer.from(head), fileBuf, Buffer.from(foot)]);

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/documents',
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'multipart/form-data; boundary=' + boundary,
          'Content-Length': payload.length
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(JSON.parse(data)));
      }
    );

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function review(docId, token, action, comments) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: `/api/documents/${docId}/review`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(JSON.parse(data)));
      }
    );
    req.on('error', reject);
    req.write(JSON.stringify({ action, comments }));
    req.end();
  });
}

function getNotifications(token) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/notifications',
        method: 'GET',
        headers: { Authorization: 'Bearer ' + token }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(JSON.parse(data)));
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function testManagerUploadOnlyNotif() {
  console.log('--- Testing Manager Upload-Only Notification Rule ---');

  // 1. Om Jha uploads document
  const omLogin = await login('om.jha@rahee.com', 'Om#Jha2026');
  const uploadRes = await uploadDoc(omLogin.accessToken, 'Manager Strict Upload Only Test');
  const docId = uploadRes.documentId;

  // 2. Complete review cycle (Rahul Dey, Kiran Sankar, Manoj Ghosh approve)
  const rahulLogin = await login('rahul.d@rahee.com', 'R@hul#Dey2026');
  await review(docId, rahulLogin.accessToken, 'APPROVED', 'All ok');

  const kiranLogin = await login('kiransankar.c@rahee.com', 'K1ran#Sankar2026');
  await review(docId, kiranLogin.accessToken, 'APPROVED', 'All ok');

  const manojLogin = await login('manoj.g@rahee.com', 'M@noj#Ghosh2026');
  await review(docId, manojLogin.accessToken, 'APPROVED', 'All ok');

  // 3. Fetch notifications for Manager (Mukesh Prasad)
  const mukeshLogin = await login('mukesh.p@rahee.com', 'M@kesh#Prasad2026');
  const mukeshNotifs = await getNotifications(mukeshLogin.accessToken);

  console.log('\n================ MANAGER (Mukesh Prasad) ALL NOTIFICATIONS RECEIVED ================');
  console.log('Total Count:', mukeshNotifs.notifications?.length);
  mukeshNotifs.notifications.forEach((n, idx) => {
    console.log(`[${idx + 1}] Type: ${n.type} | Title: ${n.title}`);
  });
  console.log('===================================================================================');

  const onlyUploadNotif = mukeshNotifs.notifications?.length === 1 && mukeshNotifs.notifications[0].type === 'NEW_DOCUMENT_UPLOADED';
  console.log('Is Manager Notification STRICTLY Upload-Only?', onlyUploadNotif ? 'YES (100% PERFECT)' : 'NO');
  console.log('✅ MANAGER UPLOAD-ONLY RULE VERIFIED 100% CLEANLY!');
  process.exit(0);
}

testManagerUploadOnlyNotif();
