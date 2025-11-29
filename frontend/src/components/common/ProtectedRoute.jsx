import { Navigate, useLocation } from 'react-router-dom';


const checkAuth = () => {
    const token = localStorage.getItem('token'); 
    return !!token; 
};

const ProtectedRoute = ({ children }) => {
    const location = useLocation(); 

    if (!checkAuth()) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }


    return children;
}; 

export default ProtectedRoute;