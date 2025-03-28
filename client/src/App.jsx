import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Register from './Register'
import axios from 'axios';
import { UserContextProvider } from './UserContext'
import Route from './Route'

function App() {
  axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
  axios.defaults.withCredentials = import.meta.env.VITE_WITH_CREDENTIALS === "true";

  return (
    <UserContextProvider>
      <Route/>

    </UserContextProvider>

  )
}

export default App
