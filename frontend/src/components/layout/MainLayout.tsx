import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import FloatingOwnerButton from "./FloatingOwnerButton";
import { useAuth } from "../../hooks/useAuth";

const MainLayout = () => {
  const location = useLocation();
  const { owner } = useAuth();

  const isHomePage = location.pathname === "/";
  const isSearchPage = location.pathname === "/search";
  const isPublicPage = isHomePage || isSearchPage;
  const isOwnerAuthPage =
    location.pathname.includes("/OwnerLogin") ||
    location.pathname.includes("/OwnerRegister");

  const showFloatingButton =
    isPublicPage || (!location.pathname.includes("/owner") && !isOwnerAuthPage);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
      {showFloatingButton && <FloatingOwnerButton />}
    </div>
  );
};

export default MainLayout;
