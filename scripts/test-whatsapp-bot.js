const http = require('http');

console.log('Sending GET request to http://localhost:3000/api/whatsapp/test to trigger automated bot tests...');

const req = http.get('http://localhost:3000/api/whatsapp/test', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.success) {
        console.log('\n✅ Bot automated tests passed successfully!\n');
        console.log('Logs from execution:');
        json.logs.forEach(log => console.log(`  - ${log}`));
        process.exit(0);
      } else {
        console.error('\n❌ Bot automated tests failed:', json.error);
        if (json.logs) {
          console.log('Logs up to failure:');
          json.logs.forEach(log => console.log(`  - ${log}`));
        }
        process.exit(1);
      }
    } catch (e) {
      console.error('\n❌ Failed to parse response JSON:', e.message);
      console.log('Raw response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error('\n❌ Network error requesting test endpoint. Is the Next.js dev server running on port 3000?', err.message);
  process.exit(1);
});
