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
  const barcode = 'TEST-RANGE-' + Date.now();
  const batchNo = 'B20260520001';

  console.log('=== 1. 调用分选机上传接口 (上传容量范围 "2600-2650") ===');
  const uploadData = {
    barcode: barcode,
    batchNo: batchNo,
    capacity: '2600-2650',
    voltage: 3.7,
    internalResistance: 1.5,
    kValue: 0.05,
    grade: 'A'
  };
  
  const uploadRes = await request('POST', '/api/cells/sorter-upload', uploadData);
  console.log('接口响应状态码:', uploadRes.status);
  console.log('接口响应内容:', JSON.stringify(uploadRes.body));

  console.log('\n=== 2. 登录管理员账号 ===');
  const loginRes = await request('POST', '/api/auth/login', {
    username: 'admin',
    password: 'admin123'
  });
  const token = loginRes.body.data.accessToken;
  console.log('登录成功，获取 Token');

  console.log('\n=== 3. 查询电芯追溯信息 ===');
  const traceRes = await request('GET', `/api/cells/${barcode}/trace`, null, {
    'Authorization': 'Bearer ' + token
  });
  console.log('追溯结果:', JSON.stringify(traceRes.body));
}

main().catch(console.error);
