import { useEffect, useState } from "react"
// import { io } from "socket.io-client"


type SensorData = {
  temperatura: number
  alkohol: number
}

export function SensorDisplay() {
  const [data, setData] = useState<SensorData | null>(null)

  useEffect(() => {
    const fetchData = () => {
      fetch("http://localhost:3000/api/sensor")
        .then((res) => res.json())
        .then((sensorData) => {
          setData(sensorData)
        })
        .catch((err) => {
          console.error("Błąd podczas pobierania:", err)
        })
    }

    fetchData() // od razu
    const interval = setInterval(fetchData, 2000) // co 2 sekundy

    return () => clearInterval(interval) // wyczyść po unmount
  }, [])

  if (!data) return <p>Loading data from sensor...</p>

  return (
    <div className="border rounded-xl p-4 bg-muted/50 shadow">
      <h2 className="text-lg font-semibold mb-2">Ostatni pomiar:</h2>
      <p>🌡️ Temperatura: <strong>{data.temperatura}°C</strong></p>
      <p>🍷 Alkohol: <strong>{data.alkohol}%</strong></p>
    </div>
  )
}
