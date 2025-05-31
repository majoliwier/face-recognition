import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Button } from './components/ui/button'
import Page from './dashboard/page'
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      {/* <div className="flex flex-col items-center justify-center min-h-svh">
            <Button>Click me</Button>
      </div> */}

    <Page />
  
    </>
  )
}

export default App
