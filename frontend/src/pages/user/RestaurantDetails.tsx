import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "../../utils/api";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";
import { Restaurant } from "../../types/restaurant";
import { useAuth } from "../../context/AuthContext";

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  restaurant_id: string;
}

const bookingSchema = z.object({
  date: z.string(),
  guests: z
    .number()
    .min(1, "At least 1 guest required")
    .max(20, "Maximum 20 guests allowed"),
});

type BookingForm = z.infer<typeof bookingSchema>;

const RestaurantDetails = () => {
  const navigate = useNavigate();
  const { restaurantId } = useParams();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [guestCount, setGuestCount] = useState<number>(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingForm>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      date: selectedDate,
      guests: 1,
    },
  });

  const { data: restaurant, isLoading: restaurantLoading } =
    useQuery<Restaurant>({
      queryKey: ["restaurant", restaurantId],
      queryFn: async () => {
        const response = await api.get(`/restaurants/${restaurantId}`);
        return response.data;
      },
    });

  const { data: availableSlots, isLoading: slotsLoading } = useQuery<
    TimeSlot[]
  >({
    queryKey: ["availableSlots", restaurantId, selectedDate, guestCount],
    queryFn: async () => {
      const response = await api.get(
        `/restaurants/${restaurantId}/available-slots`,
        {
          params: {
            date: selectedDate,
            guests: guestCount,
          },
        }
      );
      return response.data;
    },
  });

  const onSubmit = (data: BookingForm) => {
    setSelectedDate(data.date);
    setGuestCount(data.guests);
  };

  const handleBookingClick = (slotId: string) => {
    if (!user) {
      navigate("/login", { state: { from: `/restaurants/${restaurantId}` } });
      return;
    }
    navigate(`/book/${restaurantId}/slot/${slotId}`);
  };

  if (restaurantLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Button
          variant="outline"
          onClick={() => navigate("/search")}
          className="flex items-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L4.414 9H17a1 1 0 110 2H4.414l5.293 5.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
          </svg>
          Back to Search
        </Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Restaurant Details Section - Left Side */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg sticky top-8">
            <div className="px-4 py-5 sm:px-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {restaurant?.name}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {restaurant?.description}
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <dl className="space-y-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Location
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {restaurant?.location}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Cuisine Types
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {restaurant?.cuisine_types.join(", ")}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Cost for Two
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    ₹{restaurant?.cost_for_two}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Timings</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {restaurant?.opening_time} - {restaurant?.closing_time}
                  </dd>
                </div>
                {restaurant?.is_vegetarian && (
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Pure Veg
                    </span>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>

        {/* Booking Section - Right Side */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Form */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">
                Book a Table
              </h2>
              {!user && (
                <p className="mt-2 text-sm text-gray-500">
                  Please login to book a table
                </p>
              )}
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="mt-6 space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    type="date"
                    label="Select Date"
                    min={new Date().toISOString().split("T")[0]}
                    error={errors.date?.message}
                    {...register("date")}
                  />
                  <Input
                    type="number"
                    label="Number of Guests"
                    min="1"
                    max="20"
                    error={errors.guests?.message}
                    {...register("guests", { valueAsNumber: true })}
                  />
                </div>
                <Button type="submit">Check Availability</Button>
              </form>
            </div>
          </div>

          {/* Available Slots */}
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900">
                Available Slots
              </h2>
              <div className="mt-6">
                {slotsLoading ? (
                  <div className="text-center py-4">
                    Loading available slots...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableSlots?.map((slot) => (
                      <Button
                        key={slot.id}
                        variant="outline"
                        onClick={() => handleBookingClick(slot.id)}
                      >
                        {slot.start_time} - {slot.end_time}
                      </Button>
                    ))}
                    {availableSlots?.length === 0 && (
                      <div className="col-span-2 text-center py-4 text-gray-500">
                        No slots available for the selected date and guest count
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetails;
