
type SensorData = {
  imie: string,
  temperatura: string
  alkohol: string
}


export function SensorDisplay({imie,temperatura,alkohol} : SensorData) {
  
  return (
    <>
    <div className="border rounded-xl p-4 bg-muted/50 shadow">
      <h2 className="text-lg font-semibold mb-2">Measurement:</h2>
      <p>Name: <strong>{imie}</strong></p>
      <p>Temperature: <strong>{temperatura}°C</strong></p>
      <p>Alcohol: <strong>{alkohol}%</strong></p>
      
    </div>



    </>
  )
}
