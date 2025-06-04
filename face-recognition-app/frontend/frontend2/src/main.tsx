import { createRoot } from 'react-dom/client'
import './index.css'
import AppLayout from './App'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LogsTable from './components/LogsTable/page'
import React from 'react'
import Register from './components/Register/register'
import Recognition from './components/Dashboard/Recognition'
import UsersList from './components/Users/usersList'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Recognition />} />
          <Route path="logs" element={<LogsTable />} />
          <Route path='register' element={<Register/>} />
          <Route path="users" element={<UsersList/>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
