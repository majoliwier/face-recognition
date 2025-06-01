const mqtt = require("mqtt");
const { findMatchingUserMock } = require("./utils/faceUtils");
const sensorData = require("./config/sensorData");
const Log = require("./models/Log");
const User = require("./models/User")

const client = mqtt.connect("mqtt://broker.hivemq.com");

const tempTopic = "sensor/temperatura";
const alcTopic = "sensor/alkohol";

let current = {
  temperatura: null,
  alkohol: null,
};

client.on("connect", () => {
  console.log("Połączono z brokerem MQTT");
  client.subscribe(tempTopic);
  client.subscribe(alcTopic);
});

client.on("message", async (topic, message) => {
  const value = parseFloat(message.toString());

  if (isNaN(value)) {
    return;
  }

  if (topic === tempTopic) {
    current.temperatura = value;
    sensorData.temperatura = value;
  }

  if (topic === alcTopic) {
    current.alkohol = value;
    sensorData.alkohol = value;
  }

  console.log(` Odebrano [${topic}]: ${value}`);

  if (current.temperatura !== null && current.alkohol !== null) {

    await handleDataLog(current);

    current = { temperatura: null, alkohol: null };
  }

});


async function handleDataLog({ temperatura, alkohol }) {
  const dopuszczony = temperatura < 37.5 && alkohol < 0.2;

  try {
    const user = await findMatchingUserMock();
    console.log("Znaleziony użytkownik:", user.imie);

    const log = new Log({
      userId: user._id,
      temperatura,
      alkohol,
      dopuszczony,
    });

    await log.save();
    console.log(`Zapisano log dla ${user.imie}`);
  } catch (err) {
    console.error("Błąd zapisu logu:", err);
  }
}


module.exports = client;
