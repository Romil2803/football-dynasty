const fs = require('fs');

const data = fs.readFileSync('C:\\Users\\01\\.gemini\\antigravity-ide\\brain\\c9d7f56a-3051-4aec-a926-dee54fc0bfa7\\.system_generated\\logs\\transcript.jsonl', 'utf-8');
const lines = data.split('\n');
for (const line of lines) {
  if (line.includes('USER') && line.includes('UPGRADE FOOTBALL DYNASTY')) {
    try {
      const obj = JSON.parse(line);
      console.log(obj.content);
      break;
    } catch (e) {}
  }
}
