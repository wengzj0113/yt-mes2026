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
  const barcode = 'TEST-COMPAT-' + Date.now();
  const batchNo = 'B20260520001';

  console.log('=== 1. 上传电芯数据 (容量为数值 2660，内阻字段为 resistance: 19.8) ===');
  const uploadData = {
    barcode: barcode,
    batchNo: batchNo,
    capacity: 2660, // 数值类型
    voltage: 3.712,
    resistance: 19.8, // 别名字段
    kValue: 0,
    grade: '22',
    sortingTime: '2026-06-16 17:13:43'
  };
  
  const res = await request('POST', '/api/cells/sorter-upload', uploadData);
  console.log('接口响应状态码:', res.status);
  console.log('接口响应内容:', JSON.stringify(res.body));

  console.log('\n=== 2. 登录管理员账号 ===');
  const loginRes = await request('POST', '/api/auth/login', {
    username: 'admin',
    password: 'admin123'
  });
  const token = loginRes.body.data.accessToken;

  console.log('\n=== 3. 查询电芯追溯信息，验证容量是否转为字符串，内阻是否正确保存 ===');
  const traceRes = await request('GET', `/api/cells/${barcode}/trace`, null, {
    'Authorization': 'Bearer ' + token
  });
  console.log('追溯结果:', JSON.stringify(traceRes.body));
}

main().catch(console.error);
