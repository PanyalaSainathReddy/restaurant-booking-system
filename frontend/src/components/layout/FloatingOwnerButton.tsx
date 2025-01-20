import { Link } from "react-router-dom";

const FloatingOwnerButton = () => {
  return (
    <Link
      to="/OwnerLogin"
      target="_blank"
      className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-lg transition-colors duration-200 flex items-center space-x-2"
    >
      <span>Are you a restaurant owner?</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    </Link>
  );
};

export default FloatingOwnerButton;
