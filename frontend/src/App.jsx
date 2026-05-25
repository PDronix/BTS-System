import { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminPage from './pages/AdminPage';

function App() {
  const [token] = useState(localStorage.getItem('token'));
  const user  = JSON.parse(localStorage.getItem('user') || '{}');
  const canAdmin = ['ADMIN','MANAGER'].includes(user.role);

  return (
    <HashRouter>
      <Routes>
        <Route path="/"          element={token ? <Navigate to="/dashboard"/> : <Login/>}/>
        <Route path="/register"  element={token ? <Navigate to="/dashboard"/> : <Register/>}/>
        <Route path="/dashboard" element={token ? <Dashboard/> : <Navigate to="/"/>}/>
        <Route path="/admin"     element={token && canAdmin ? <AdminPage/> : <Navigate to="/"/>}/>
      </Routes>
    </HashRouter>
  );
}

export default App;
