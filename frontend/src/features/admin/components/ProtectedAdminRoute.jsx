import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProtectedAdminRoute({ children }) {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/admin/me', { credentials: 'include' })
      .then((response) => {
        if (response.status === 401) {
          navigate('/admin/login', { replace: true });
          return false;
        }
        return response.ok;
      })
      .then(setAuthorized)
      .catch(() => setAuthorized(false));
  }, [navigate]);

  if (authorized === null) return <div className="admin-dashboard__status">Comprobando sesión...</div>;
  return authorized ? children : null;
}
