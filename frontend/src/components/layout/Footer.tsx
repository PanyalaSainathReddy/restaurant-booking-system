import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-white border-t">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between">
          {/* Brand */}
          <div className="mb-8 md:mb-0">
            <Link to="/" className="text-xl font-bold text-gray-800">
              Tomato
            </Link>
            <p className="mt-2 text-sm text-gray-500">
              Find and book the best restaurants in your city.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-4">
              <li>
                <Link
                  to="/search"
                  className="text-base text-gray-500 hover:text-gray-900"
                >
                  Find Restaurant
                </Link>
              </li>
              <li>
                <Link
                  to="/OwnerRegister"
                  className="text-base text-gray-500 hover:text-gray-900"
                >
                  List Your Restaurant
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8">
          <p className="text-base text-gray-400 text-center">
            © {new Date().getFullYear()} Tomato. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
