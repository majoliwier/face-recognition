// module.exports = {
//   temperatura: null,
//   alkohol: null
// };

// sensorData.js

const sensorData = {
  temperatura: 36.5,
  alkohol: 0.00,
}

setInterval(() => {
  sensorData.temperatura = parseFloat((35 + Math.random() * 3).toFixed(1)) // 35.0 - 38.0
  sensorData.alkohol = parseFloat((Math.random() * 0.4).toFixed(2)) // 0.00 - 0.40
}, 2000)

module.exports = sensorData