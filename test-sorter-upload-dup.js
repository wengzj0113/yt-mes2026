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
  const barcode = 'TEST-DUP-CHECK-' + Date.now();
  const batchNo = 'B20260520001';

  console.log('=== 1. 第一次上传电芯数据 (容量为 "2600-2650"，内阻为 21.5) ===');
  const uploadData1 = {
    barcode: barcode,
    batchNo: batchNo,
    capacity: '2600-2650',
    voltage: 3.7,
    internalResistance: 21.5,
    kValue: 0.05,
    grade: 'A'
  };
  
  const res1 = await request('POST', '/api/cells/sorter-upload', uploadData1);
  console.log('接口响应状态码:', res1.status);
  console.log('接口响应内容:', JSON.stringify(res1.body));

  console.log('\n=== 2. 第二次上传相同电芯数据 (容量修改为 "2700-2750"，内阻修改为 22.8，预期覆盖不报错) ===');
  const uploadData2 = {
    barcode: barcode,
    batchNo: batchNo,
    capacity: '2700-2750',
    voltage: 3.8,
    internalResistance: 22.8,
    kValue: 0.06,
    grade: 'A'
  };
  
  const res2 = await request('POST', '/api/cells/sorter-upload', uploadData2);
  console.log('接口响应状态码:', res2.status);
  console.log('接口响应内容:', JSON.stringify(res2.body));

  console.log('\n=== 3. 登录管理员账号 ===');
  const loginRes = await request('POST', '/api/auth/login', {
    username: 'admin',
    password: 'admin123'
  });
  const token = loginRes.body.data.accessToken;

  console.log('\n=== 4. 查询电芯追溯信息，验证内阻和容量是否正确覆盖 ===');
  const traceRes = await request('GET', `/api/cells/${barcode}/trace`, null, {
    'Authorization': 'Bearer ' + token
  });
  console.log('追溯结果:', JSON.stringify(traceRes.body));
}

main().catch(console.error);
