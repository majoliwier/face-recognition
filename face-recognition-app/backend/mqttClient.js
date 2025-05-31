const mqtt = require("mqtt");
const sensorData = require("./sensorData");

const client = mqtt.connect("mqtt://broker.hivemq.com");

client.on("connect", () => {
  console.log("Połączono z brokerem MQTT");
  client.subscribe("czujnik/temperatura");
  client.subscribe("czujnik/alkohol");
});

client.on("message", (topic, message) => {
  const value = parseFloat(message.toString());
  if (topic === "czujnik/temperatura") {
    sensorData.temperatura = value;
  }
  if (topic === "czujnik/alkohol") {
    sensorData.alkohol = value;
  }
  console.log(`Odebrano [${topic}]: ${value}`);
});

module.exports = client;
