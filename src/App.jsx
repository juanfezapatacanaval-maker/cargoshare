import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Admin from './pages/Admin'
import Carrier from './pages/Carrier'
import Shipper from './pages/Shipper'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <iframe src="/landing.html" style={{width:'100%',height:'100vh',border:'none'}} title="CargoShare"/>
        }/>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/shipper" element={<Shipper />} />
        <Route path="/carrier" element={<Carrier />} />
        <Route path="/admin-cs-2025-x9k" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
export default App