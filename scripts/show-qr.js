const readline = require('node:readline');
const qrcode = require('qrcode-terminal');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Invitation URL ta paste kore Enter chapo:\n> ', (url) => {
  console.log('\n');
  qrcode.generate(url.trim(), { small: true });
  rl.close();
});