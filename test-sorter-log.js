const http = require('http');

function request(method, path, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    const req = http.request(opts, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, body: body ? JSON.parse(body) : null });
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function main() {
  const barcode = 'TEST-BARCODE-' + Date.now();
  const batchNo = 'B20260520001';

  console.log('=== 1. 调用分选机上传接口 (预期成功) ===');
  const uploadData1 = {
    barcode: barcode,
    batchNo: batchNo,
    capacity: 2000,
    voltage: 3.7,
    internalResistance: 1.5,
    kValue: 0.05,
    grade: 'A'
  };
  
  const uploadRes1 = await request('POST', '/api/cells/sorter-upload', uploadData1);
  console.log('接口响应状态码:', uploadRes1.status);
  console.log('接口响应内容:', JSON.stringify(uploadRes1.body));

  console.log('\n=== 2. 再次调用分选机上传接口 (预期失败，条码重复) ===');
  const uploadRes2 = await request('POST', '/api/cells/sorter-upload', uploadData1);
  console.log('接口响应状态码:', uploadRes2.status);
  console.log('接口响应内容:', JSON.stringify(uploadRes2.body));

  console.log('\n=== 3. 登录管理员账号 ===');
  const loginRes = await request('POST', '/api/auth/login', {
    username: 'admin',
    password: 'admin123'
  });
  const token = loginRes.body.data.accessToken;
  console.log('登录成功，获取 Token');

  console.log('\n=== 4. 查询接口日志 ===');
  const logsRes = await request('GET', '/api/system/sorter-logs?pageSize=5', null, {
    'Authorization': 'Bearer ' + token
  });
  
  console.log('日志列表:');
  const items = logsRes.body.data.items;
  items.forEach(item => {
    console.log(`- ID: ${item.id} | Endpoint: ${item.apiEndpoint} | Success: ${item.isSuccess} | Status: ${item.statusCode} | Time: ${item.createdAt}`);
    console.log(`  Request: ${item.requestBody}`);
    console.log(`  Response: ${item.responseBody}`);
  });
}

main().catch(console.error);
