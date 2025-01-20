import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

type PrivateRouteProps = {
  type: "user" | "owner";
};

const PrivateRoute = ({ type }: PrivateRouteProps) => {
  const { user, owner, loading, authChecked } = useAuth();
  const location = useLocation();
  console.log(user);

  if (loading || !authChecked) {
    return <div>Loading...</div>;
  }

  if (type === "owner" && !owner) {
    return <Navigate to="/OwnerLogin" state={{ from: location }} replace />;
  }

  if (type === "user" && !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
