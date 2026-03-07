import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // No token? Boot them to the login page
    return <Navigate to="/login" replace />;
  }

  // If they have a token, render whatever component is inside this wrapper
  return <>{children}</>;
}
