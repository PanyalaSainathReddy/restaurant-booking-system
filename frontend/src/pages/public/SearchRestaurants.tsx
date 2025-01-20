import { useState } from "react";
import { useLocation } from "../../context/LocationContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import RestaurantCard from "../../components/restaurant/RestaurantCard";
import { useQuery } from "@tanstack/react-query";
import api from "../../utils/api";
import { Restaurant, CuisineType } from "../../types/restaurant";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const searchSchema = z
  .object({
    query: z.string().optional(),
    cuisine_types: z.array(z.nativeEnum(CuisineType)).optional(),
    isVegetarian: z.boolean().optional(),
    minCost: z.string().optional(),
    maxCost: z.string().optional(),
    minRating: z.string().optional(),
  })
  .partial();

type SearchFormData = z.infer<typeof searchSchema>;

const CUISINE_TYPES = Object.values(CuisineType);

const SearchRestaurants = () => {
  const { location } = useLocation();
  const [searchParams, setSearchParams] = useState<SearchFormData>({});
  const [selectedCuisines, setSelectedCuisines] = useState<CuisineType[]>([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  const { register, handleSubmit, setValue } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      ...searchParams,
      cuisine_types: [],
    },
  });

  const { data: restaurants, isLoading } = useQuery<Restaurant[]>({
    queryKey: ["restaurants", location, searchParams],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (location) params.append("location", location);
      if (searchParams.query) params.append("query", searchParams.query);

      if (selectedCuisines.length > 0) {
        params.append("cuisine_types", JSON.stringify(selectedCuisines));
      }

      if (searchParams.isVegetarian) {
        params.append("is_vegetarian", String(searchParams.isVegetarian));
      }
      if (searchParams.minCost) {
        params.append("min_cost", String(searchParams.minCost));
      }
      if (searchParams.maxCost) {
        params.append("max_cost", String(searchParams.maxCost));
      }
      if (searchParams.minRating) {
        params.append("min_rating", String(searchParams.minRating));
      }

      console.log("Params being sent:", Object.fromEntries(params.entries()));

      const response = await api.get(
        `/restaurants/search?${params.toString()}`
      );
      return response.data;
    },
  });

  const onSubmit = (data: SearchFormData) => {
    console.log("Selected cuisines before submit:", selectedCuisines);

    const formData = {
      ...data,
      cuisine_types: selectedCuisines,
      minCost: data.minCost ? Number(data.minCost) : undefined,
      maxCost: data.maxCost ? Number(data.maxCost) : undefined,
      minRating: data.minRating ? Number(data.minRating) : undefined,
    };

    // Filter out undefined values
    const filteredData = Object.fromEntries(
      Object.entries(formData).filter(
        ([_, value]) =>
          value !== undefined &&
          value !== "" &&
          (Array.isArray(value) ? value.length > 0 : true)
      )
    );

    console.log("Filtered data:", filteredData);
    setSearchParams(filteredData);
  };

  const handleCuisineToggle = (cuisine: CuisineType) => {
    const newCuisines = selectedCuisines.includes(cuisine)
      ? selectedCuisines.filter((c) => c !== cuisine)
      : [...selectedCuisines, cuisine];

    console.log("New cuisines after toggle:", newCuisines);
    setSelectedCuisines(newCuisines);
  };

  const handleRestaurantClick = (restaurantId: string) => {
    if (user) {
      navigate(`/restaurants/${restaurantId}`);
    } else {
      navigate("/login", { state: { from: `/restaurants/${restaurantId}` } });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="md:col-span-1 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Cuisine Type
              </label>
              <div className="mt-2 space-y-2">
                {Object.values(CuisineType).map((cuisine) => (
                  <label key={cuisine} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedCuisines.includes(cuisine)}
                      onChange={() => handleCuisineToggle(cuisine)}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      {cuisine}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Price Range
              </label>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <Input
                  label="Min Price"
                  type="number"
                  placeholder="Min"
                  {...register("minCost")}
                />
                <Input
                  label="Max Price"
                  type="number"
                  placeholder="Max"
                  {...register("maxCost")}
                />
              </div>
            </div>

            <Input
              type="number"
              label="Minimum Rating"
              min="0"
              max="5"
              step="0.5"
              {...register("minRating")}
            />

            <div className="flex items-center">
              <input
                type="checkbox"
                {...register("isVegetarian")}
                className="h-4 w-4 text-blue-600 rounded border-gray-300"
              />
              <label className="ml-2 text-sm text-gray-600">
                Vegetarian Only
              </label>
            </div>

            <Button type="submit" className="w-full">
              Apply Filters
            </Button>
          </form>
        </div>

        {/* Results Section */}
        <div className="md:col-span-3">
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <Input
              type="search"
              label="Quick Search"
              placeholder="Search restaurants..."
              defaultValue={searchParams.query}
              {...register("query")}
              className="w-full"
              onChange={(e) => {
                setSearchParams((prev) => ({ ...prev, query: e.target.value }));
              }}
            />
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {restaurants?.map((restaurant: Restaurant) => (
                <div
                  onClick={() => handleRestaurantClick(restaurant.id)}
                  className="cursor-pointer"
                >
                  <RestaurantCard key={restaurant.id} {...restaurant} />
                </div>
              ))}
              {restaurants?.length === 0 && (
                <div className="col-span-2 text-center py-8 text-gray-500">
                  No restaurants found
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchRestaurants;
