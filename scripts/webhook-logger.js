const express = require('express');
const app = express();
app.use(express.json({ limit: '5mb' }));

app.post('/webhooks/topic/:topic', (req, res) => {
  res.sendStatus(200); 
  const { topic } = req.params;
  const state = req.body.state || '';
  console.log(`\n📨 [${new Date().toLocaleTimeString()}] topic=${topic}  state=${state}`);
  console.log(JSON.stringify(req.body, null, 2).slice(0, 1500));
});

app.listen(3000, () =>
  console.log('👂 Webhook logger is running'));