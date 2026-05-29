require('dotenv').config();
const express = require('express');
const cors = require('cors');
const smsRouter = require('./routes/sms');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'taxi-sms-backend' });
});

app.use('/sms', smsRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Taxi SMS backend listening on http://0.0.0.0:${port}`);
  console.log(`Access from phone at: http://192.168.1.114:${port}`);
});
