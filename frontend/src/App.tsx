import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/auth/PrivateRoute";
import MainLayout from "./components/layout/MainLayout";
import Home from "./pages/public/Home";
import Login from "./pages/public/Login";
import Register from "./pages/public/Register";
import OwnerLogin from "./pages/public/OwnerLogin";
import OwnerRegister from "./pages/public/OwnerRegister";
import SearchRestaurants from "./pages/public/SearchRestaurants";
import NotFound from "./pages/public/NotFound";
import { LocationProvider } from "./context/LocationContext";
// Protected Owner Pages
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import AddRestaurant from "./pages/owner/AddRestaurant";
import RestaurantManagement from "./pages/owner/RestaurantManagement";
import TimeSlotTables from "./pages/owner/TimeSlotTables";
import EditRestaurant from "./pages/owner/EditRestaurant";
import RestaurantDetails from "./pages/user/RestaurantDetails";
import TableSelection from "./pages/user/TableSelection";
import MyBookings from "./pages/user/MyBookings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <LocationProvider>
          <AuthProvider>
            <Routes>
              <Route element={<MainLayout />}>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/search" element={<SearchRestaurants />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/OwnerLogin" element={<OwnerLogin />} />
                <Route path="/OwnerRegister" element={<OwnerRegister />} />

                {/* Protected user routes */}
                <Route element={<PrivateRoute type="user" />}>
                  <Route
                    path="/restaurants/:restaurantId"
                    element={<RestaurantDetails />}
                  />
                  <Route
                    path="/book/:restaurantId/slot/:slotId"
                    element={<TableSelection />}
                  />
                  <Route path="/user/bookings" element={<MyBookings />} />
                </Route>

                {/* Protected owner routes */}
                <Route element={<PrivateRoute type="owner" />}>
                  <Route path="/owner/dashboard" element={<OwnerDashboard />} />
                  <Route
                    path="/owner/add-restaurant"
                    element={<AddRestaurant />}
                  />
                  <Route
                    path="/owner/restaurants/:restaurantId/manage"
                    element={<RestaurantManagement />}
                  />
                  <Route
                    path="/owner/restaurants/:restaurantId/timeslots/:timeSlotId/tables"
                    element={<TimeSlotTables />}
                  />
                  <Route
                    path="/owner/restaurants/:restaurantId/edit"
                    element={<EditRestaurant />}
                  />
                </Route>

                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
            <Toaster position="top-right" />
          </AuthProvider>
        </LocationProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
