const express = require("express");
const cors = require("cors");
const sensorData = require("./sensorData");
require("./mqttClient");

require("./db");
const Log = require("./models/Log");

const app = express();
app.use(cors());



app.get("/api/sensor", (req, res) => {
  res.json({
    temperatura: sensorData.temperatura,
    alkohol: sensorData.alkohol
  });
});


app.post("/api/log", async (req, res) => {
  const { userId } = req.body;

  const temperatura = sensorData.temperatura;
  const alkohol = sensorData.alkohol;

  const dopuszczony = temperatura < 37.5 && alkohol < 0.2;

  const log = new Log({ userId, temperatura, alkohol, dopuszczony });
  await log.save();

  res.json({ dopuszczony, temperatura, alkohol });
});


app.get("/api/logs", async (req, res) => {
  // const logs = await Log.find().sort({ czas: -1 })
  // res.json(logs)
})



const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serwer działa na http://localhost:${PORT}`);
});