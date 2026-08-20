const http = require('http');

function api(method, path, data, token, contentType) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (contentType) headers['Content-Type'] = contentType;
    if (token) headers['Authorization'] = 'Bearer ' + token;
    
    const opts = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: headers
    };
    
    const req = http.request(opts, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: body });
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  // Login
  const loginRes = await new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost', port: 3001, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.write(JSON.stringify({ username: 'admin', password: 'admin123' }));
    req.end();
  });
  const token = loginRes.data.accessToken;
  console.log('Token obtained\n');

  // Test: Send request with wrong content type (text/plain)
  console.log('=== Test: text/plain content-type ===');
  const t1 = await api('POST', '/api/processes/electrode/submit', 
    JSON.stringify({ batchNo: 'test001', tabWeldingPull: 50 }), token, 'text/plain');
  console.log('Status:', t1.status, '| Body:', t1.body.substring(0, 200));

  // Test: Send empty body
  console.log('\n=== Test: empty body ===');
  const t2 = await api('POST', '/api/processes/electrode/submit', '', token, 'application/json');
  console.log('Status:', t2.status, '| Body:', t2.body.substring(0, 200));

  // Test: Send batchNo as null
  console.log('\n=== Test: batchNo as null ===');
  const t3 = await api('POST', '/api/processes/electrode/submit',
    JSON.stringify({ batchNo: null, tabWeldingPull: 50 }), token, 'application/json');
  console.log('Status:', t3.status, '| Body:', t3.body.substring(0, 200));

  // Test: Send batchNo as number
  console.log('\n=== Test: batchNo as number ===');
  const t4 = await api('POST', '/api/processes/electrode/submit',
    JSON.stringify({ batchNo: 12345, tabWeldingPull: 50 }), token, 'application/json');
  console.log('Status:', t4.status, '| Body:', t4.body.substring(0, 300));

  // Test: send tabWeldingPull as string
  console.log('\n=== Test: tabWeldingPull as string ===');
  const t5 = await api('POST', '/api/processes/electrode/submit',
    JSON.stringify({ batchNo: 'test001', tabWeldingPull: 'abc' }), token, 'application/json');
  console.log('Status:', t5.status, '| Body:', t5.body.substring(0, 300));

  // Test: send content-type missing  
  console.log('\n=== Test: no content-type ===');
  const t6 = await api('POST', '/api/processes/electrode/submit',
    JSON.stringify({ batchNo: 'test001', tabWeldingPull: 50 }), token, '');
  console.log('Status:', t6.status, '| Body:', t6.body.substring(0, 200));
}

main().catch(console.error);
