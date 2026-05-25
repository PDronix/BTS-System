import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminPage from './pages/AdminPage';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/"/>;
}

function PublicRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? <Navigate to="/dashboard"/> : children;
}

function AdminRoute({ children }) {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const canAdmin = ['ADMIN','MANAGER'].includes(user.role);
  if (!token) return <Navigate to="/"/>;
  if (!canAdmin) return <Navigate to="/dashboard"/>;
  return children;
}

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/"          element={<PublicRoute><Login/></PublicRoute>}/>
        <Route path="/register"  element={<PublicRoute><Register/></PublicRoute>}/>
        <Route path="/dashboard" element={<PrivateRoute><Dashboard/></PrivateRoute>}/>
        <Route path="/admin"     element={<AdminRoute><AdminPage/></AdminRoute>}/>
      </Routes>
    </HashRouter>
  );
}
export default App;
