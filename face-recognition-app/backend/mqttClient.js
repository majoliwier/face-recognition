const mqtt = require("mqtt");
const { findMatchingUserMock } = require("./utils/faceUtils");
const sensorData = require("./config/sensorData");
const Log = require("./models/Log");
const User = require("./models/User")

const client = mqtt.connect("mqtt://broker.hivemq.com");

const tempTopic = "sensor/temperatura";
const alcTopic = "sensor/alkohol";
const triggerMesurementTopic = "sensor/pomiar";

let pendingUserId = null;

function setPendingUserId(id) {
  pendingUserId = id;
}

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
  const dopuszczony = temperatura < 37.5 && alkohol < 0.5;

  try {
    const user = await User.findById(pendingUserId);
    if (!user) {
      throw new Error(`Nie znaleziono użytkownika o ID ${pendingUserId}`);
    }
    console.log("Znaleziony użytkownik:", user.name);

    const log = new Log({
      userId: pendingUserId || null,
      temperatura,
      alkohol,
      dopuszczony,
    });

    await log.save();
    console.log(`Zapisano log dla ${user.name} (userId: ${pendingUserId})`);
    console.log(log);
  } catch (err) {
    console.error("Błąd zapisu logu:", err);
  } finally {
    pendingUserId = null;
  }
}


module.exports = {
  client,
  setPendingUserId
};

