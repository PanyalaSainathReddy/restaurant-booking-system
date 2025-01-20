import { StarIcon } from "@heroicons/react/24/solid";
import { Link } from "react-router-dom";
import { CuisineType, LocationEnum } from "../../types/restaurant";

interface RestaurantCardProps {
  id: string;
  name: string;
  description: string | null;
  cuisine_types: CuisineType[];
  rating: number;
  cost_for_two: number;
  image_url: string | null;
  is_vegetarian: boolean;
  location: LocationEnum;
  opening_time: string;
  closing_time: string;
}

const RestaurantCard = ({
  id,
  name,
  description,
  cuisine_types,
  rating,
  cost_for_two,
  image_url,
  is_vegetarian,
  location,
  opening_time,
  closing_time,
}: RestaurantCardProps) => {
  return (
    <Link to={`/restaurants/${id}`} className="block">
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="relative h-48 w-full">
          <img
            src={image_url || "/restaurant-placeholder.jpg"}
            alt={name}
            className="w-full h-full object-cover rounded-t-lg"
          />
          {is_vegetarian && (
            <div className="absolute top-2 right-2 bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
              Pure Veg
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
            <div className="flex items-center bg-green-50 px-2 py-1 rounded">
              <span className="text-green-700 font-medium">{rating}</span>
              <StarIcon className="h-4 w-4 text-green-700 ml-1" />
            </div>
          </div>
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {description || ""}
          </p>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <span>{cuisine_types.join(", ")}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-gray-600">₹{cost_for_two} for two</span>
            <span className="text-gray-500">{location}</span>
          </div>
          <div className="mt-2 flex items-center text-sm text-gray-500">
            <span>
              Open: {opening_time} - {closing_time}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RestaurantCard;
