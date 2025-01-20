import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useLocation as useLocationContext } from "../../context/LocationContext";
import { Menu, Transition } from "@headlessui/react";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { XMarkIcon, Bars3Icon } from "@heroicons/react/24/outline";
import { LocationEnum } from "../../types/restaurant";
import Button from "../common/Button";

const AVAILABLE_LOCATIONS = Object.values(LocationEnum);

const Header = () => {
  const { user, owner, logoutUser, logoutOwner, isOwnerRoute } = useAuth();
  const { location: userLocation, setLocation } = useLocationContext();
  const navigate = useNavigate();
  const location = useLocation();

  const isHomePage = location.pathname === "/";
  const isSearchPage = location.pathname === "/search";
  const isPublicPage = isHomePage || isSearchPage;
  const isAuthPage =
    location.pathname.includes("/login") ||
    location.pathname.includes("/register") ||
    location.pathname.includes("/OwnerLogin") ||
    location.pathname.includes("/OwnerRegister");
  const isOwnerPage = location.pathname.includes("/owner");

  const handleLogout = async () => {
    if (isOwnerRoute()) {
      await logoutOwner();
      navigate("/OwnerLogin");
    } else {
      await logoutUser();
      navigate("/login");
    }
  };

  const renderAuthButtons = () => {
    if (isAuthPage) return null;

    // Owner pages and owner logged in
    if (isOwnerPage && owner) {
      return (
        <Button variant="outline" onClick={handleLogout}>
          Logout
        </Button>
      );
    }

    // User pages and user logged in (excluding owner routes)
    if (user && !location.pathname.includes("/Owner")) {
      return (
        <div className="flex items-center space-x-4">
          <Link
            to="/user/bookings"
            className="text-gray-700 hover:text-gray-900"
          >
            My Bookings
          </Link>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      );
    }

    // Public pages
    if (isPublicPage) {
      return (
        <div className="flex items-center space-x-4">
          <Link to="/login">
            <Button variant="outline">Login</Button>
          </Link>
          <Link to="/register">
            <Button>Sign Up</Button>
          </Link>
        </div>
      );
    }

    return null;
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left section with logo */}
          <div className="flex-1 flex items-center justify-start">
            <Link to="/" className="text-xl font-bold text-gray-800">
              Tomato
            </Link>
          </div>

          {/* Center section with location */}
          {isSearchPage && (
            <div className="flex-1 flex items-center justify-center">
              <Menu as="div" className="relative inline-block text-left">
                <Menu.Button className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">
                  <MapPinIcon className="h-5 w-5 mr-1" />
                  {userLocation}
                </Menu.Button>
                <Transition
                  enter="transition duration-100 ease-out"
                  enterFrom="transform scale-95 opacity-0"
                  enterTo="transform scale-100 opacity-100"
                  leave="transition duration-75 ease-out"
                  leaveFrom="transform scale-100 opacity-100"
                  leaveTo="transform scale-95 opacity-0"
                >
                  <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    {AVAILABLE_LOCATIONS.map((loc) => (
                      <Menu.Item key={loc}>
                        {({ active }) => (
                          <button
                            onClick={() => setLocation(loc)}
                            className={`${active ? "bg-gray-100" : ""} ${
                              userLocation === loc
                                ? "text-blue-600"
                                : "text-gray-900"
                            } group flex w-full items-center px-4 py-2 text-sm`}
                          >
                            {loc}
                          </button>
                        )}
                      </Menu.Item>
                    ))}
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          )}

          {/* Right section with auth buttons */}
          <div className="flex-1 flex items-center justify-end">
            <div className="hidden sm:flex sm:items-center sm:space-x-4">
              {renderAuthButtons()}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <XMarkIcon className="block h-6 w-6" />
                ) : (
                  <Bars3Icon className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`${isMobileMenuOpen ? "block" : "hidden"} sm:hidden`}>
          <div className="pt-2 pb-3 space-y-1">{renderAuthButtons()}</div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
