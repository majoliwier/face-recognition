const express = require("express");
const cors = require("cors");
const sensorData = require("./config/sensorData");
require("./mqttClient");

require("./config/db");
const Log = require("./models/Log");
const User = require("./models/User")

const app = express();
app.use(cors());
app.use(express.json()); 

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
  try {
    const logs = await Log.find().populate("userId", "imie");
    res.json(logs);
  } catch (err) {
    console.error("❌ Błąd pobierania logów:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});


app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error("❌ Błąd pobierania Users:", err);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

app.get("/api/dev/clear", async (req, res) => {
  try {
    await Log.deleteMany({});
    await User.deleteMany({});
    res.send("Kolekcje zostały wyczyszczone.");
  } catch (err) {
    console.error("Błąd przy czyszczeniu kolekcji:", err);
    res.status(500).send("=Błąd serwera");
  }
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Serwer działa na http://localhost:${PORT}`);
});