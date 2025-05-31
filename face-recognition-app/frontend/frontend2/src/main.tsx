import { createRoot } from 'react-dom/client'
import './index.css'
import AppLayout from './App'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SensorDisplay } from './components/Data'
import LogsTable from './components/LogsTable/page'
import React from 'react'



createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<SensorDisplay />} />
          <Route path="logs" element={<LogsTable />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
