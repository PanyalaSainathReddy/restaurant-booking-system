import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Restaurant } from "../../types/restaurant";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/common/Button";
import { toast } from "react-hot-toast";
import { useState } from "react";
import Modal from "../../components/common/Modal";
import { RestaurantOwner } from "../../types/auth";

const OwnerDashboard = () => {
  const { owner } = useAuth() as { owner: RestaurantOwner | null };
  const queryClient = useQueryClient();
  const [restaurantToDelete, setRestaurantToDelete] =
    useState<Restaurant | null>(null);

  // Fetch owner's restaurants
  const { data: restaurants, isLoading } = useQuery({
    queryKey: ["ownerRestaurants"],
    queryFn: async () => {
      const response = await api.get("/restaurants/owner/me");
      return response.data as Restaurant[];
    },
  });

  // Delete restaurant mutation
  const deleteRestaurantMutation = useMutation({
    mutationFn: async (restaurantId: string) => {
      await api.delete(`/restaurants/${restaurantId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ownerRestaurants"] });
      toast.success("Restaurant deleted successfully");
      setRestaurantToDelete(null);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.detail || "Failed to delete restaurant"
      );
    },
  });

  // Toggle restaurant active status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({
      id,
      is_active,
    }: {
      id: string;
      is_active: boolean;
    }) => {
      await api.patch(`/restaurants/${id}`, { is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ownerRestaurants"] });
      toast.success("Restaurant status updated successfully");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.detail || "Failed to update restaurant status"
      );
    },
  });

  const handleDeleteConfirm = () => {
    if (restaurantToDelete) {
      deleteRestaurantMutation.mutate(restaurantToDelete.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Restaurant Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {owner?.full_name}
          </p>
        </div>
        <Link
          to="/owner/add-restaurant"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add New Restaurant
        </Link>
      </div>

      {/* Restaurant List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {restaurants?.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              You haven't added any restaurants yet.
            </p>
            <Link
              to="/owner/add-restaurant"
              className="mt-4 inline-flex items-center text-blue-600 hover:text-blue-500"
            >
              Add your first restaurant
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {restaurants?.map((restaurant) => (
              <li key={restaurant.id}>
                <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12">
                      <img
                        className="h-12 w-12 rounded-md object-cover"
                        src={
                          restaurant.image_url || "/restaurant-placeholder.jpg"
                        }
                        alt={restaurant.name}
                      />
                    </div>
                    <div className="ml-4">
                      <h2 className="text-lg font-medium text-gray-900">
                        {restaurant.name}
                      </h2>
                      <div className="mt-1 flex items-center">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            restaurant.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {restaurant.is_active ? "Active" : "Inactive"}
                        </span>
                        <span className="ml-2 text-sm text-gray-500">
                          {restaurant.location}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Button
                      variant={restaurant.is_active ? "outline" : "primary"}
                      onClick={() =>
                        toggleStatusMutation.mutate({
                          id: restaurant.id,
                          is_active: !restaurant.is_active,
                        })
                      }
                    >
                      {restaurant.is_active ? "Deactivate" : "Activate"}
                    </Button>
                    <Link
                      to={`/owner/restaurants/${restaurant.id}/edit`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </Link>
                    <Link
                      to={`/owner/restaurants/${restaurant.id}/manage`}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Manage
                    </Link>
                    <button
                      onClick={() => setRestaurantToDelete(restaurant)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!restaurantToDelete}
        onClose={() => setRestaurantToDelete(null)}
        title="Delete Restaurant"
      >
        <div className="mt-2">
          <p className="text-sm text-gray-500">
            Are you sure you want to delete {restaurantToDelete?.name}? This
            action cannot be undone.
          </p>
        </div>

        <div className="mt-4 flex justify-end space-x-3">
          <Button variant="outline" onClick={() => setRestaurantToDelete(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDeleteConfirm}
            isLoading={deleteRestaurantMutation.isPending}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default OwnerDashboard;
