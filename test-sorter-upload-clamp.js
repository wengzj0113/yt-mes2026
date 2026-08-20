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
  const barcode = 'TEST-CLAMP-' + Date.now();
  const batchNo = 'B20260520001';

  console.log('=== 1. 上传电芯数据 (包含超大数值 voltage: 1000000000, resistance: 1000000000000) ===');
  const uploadData = {
    barcode: barcode,
    batchNo: batchNo,
    capacity: 2660,
    voltage: 1000000000,
    resistance: 1000000000000,
    kValue: 1000000000,
    grade: '22',
    sortingTime: '2026-06-16 17:34:01'
  };
  
  const res = await request('POST', '/api/cells/sorter-upload', uploadData);
  console.log('接口响应状态码:', res.status);
  console.log('接口响应内容:', JSON.stringify(res.body));
}

main().catch(console.error);
