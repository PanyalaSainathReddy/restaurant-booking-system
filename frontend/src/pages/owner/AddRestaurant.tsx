import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { CuisineType, LocationEnum } from "../../types/restaurant";
import api from "../../utils/api";
import { toast } from "react-hot-toast";

const addRestaurantSchema = z.object({
  name: z.string().min(1, "Restaurant name is required"),
  description: z.string().optional(),
  cuisine_types: z
    .array(z.nativeEnum(CuisineType))
    .min(1, "Select at least one cuisine type"),
  cost_for_two: z.number().min(1, "Cost for two is required"),
  image_url: z.string().optional(),
  is_vegetarian: z.boolean(),
  location: z.nativeEnum(LocationEnum),
  opening_time: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
  closing_time: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
});

type AddRestaurantForm = z.infer<typeof addRestaurantSchema>;

const AddRestaurant = () => {
  const navigate = useNavigate();
  const [selectedCuisines, setSelectedCuisines] = useState<CuisineType[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<AddRestaurantForm>({
    resolver: zodResolver(addRestaurantSchema),
    defaultValues: {
      cuisine_types: [],
    },
  });

  const addRestaurantMutation = useMutation({
    mutationFn: async (data: AddRestaurantForm) => {
      const response = await api.post("/restaurants/", data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Restaurant added successfully!");
      navigate("/owner/dashboard");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to add restaurant");
    },
  });

  const handleCuisineToggle = (cuisine: CuisineType) => {
    const newCuisines = selectedCuisines.includes(cuisine)
      ? selectedCuisines.filter((c) => c !== cuisine)
      : [...selectedCuisines, cuisine];

    setSelectedCuisines(newCuisines);
    setValue("cuisine_types", newCuisines);
  };

  const onSubmit = (data: AddRestaurantForm) => {
    addRestaurantMutation.mutate({
      ...data,
      cuisine_types: selectedCuisines,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Add New Restaurant
      </h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 bg-white p-6 rounded-lg shadow"
      >
        <Input
          label="Restaurant Name"
          error={errors.name?.message}
          {...register("name")}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={3}
            {...register("description")}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cuisine Types
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.values(CuisineType).map((cuisine) => (
              <label
                key={cuisine}
                className="flex items-center space-x-2 p-2 border rounded cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selectedCuisines.includes(cuisine)}
                  onChange={() => handleCuisineToggle(cuisine)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{cuisine}</span>
              </label>
            ))}
          </div>
          {errors.cuisine_types && (
            <p className="mt-1 text-sm text-red-600">
              {errors.cuisine_types.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            type="number"
            label="Cost for Two"
            error={errors.cost_for_two?.message}
            {...register("cost_for_two", { valueAsNumber: true })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <select
              {...register("location")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select Location</option>
              {Object.values(LocationEnum).map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
            {errors.location && (
              <p className="mt-1 text-sm text-red-600">
                {errors.location.message}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            type="time"
            label="Opening Time"
            error={errors.opening_time?.message}
            {...register("opening_time")}
          />

          <Input
            type="time"
            label="Closing Time"
            error={errors.closing_time?.message}
            {...register("closing_time")}
          />
        </div>

        <Input
          label="Image URL"
          error={errors.image_url?.message}
          {...register("image_url")}
        />

        <div className="flex items-center">
          <input
            type="checkbox"
            {...register("is_vegetarian")}
            className="h-4 w-4 text-blue-600 rounded border-gray-300"
          />
          <label className="ml-2 text-sm text-gray-600">
            Pure Vegetarian Restaurant
          </label>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/owner/dashboard")}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={addRestaurantMutation.isPending}>
            Add Restaurant
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddRestaurant;
