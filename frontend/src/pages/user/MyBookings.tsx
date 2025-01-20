import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import Button from "../../components/common/Button";

interface Booking {
  id: string;
  restaurant: {
    id: string;
    name: string;
    location: string;
  };
  time_slot: {
    start_time: string;
    end_time: string;
  };
  table: {
    table_number: string;
    capacity: number;
  };
  number_of_guests: number;
  date: string;
  status: string;
  created_at: string;
}

const MyBookings = () => {
  const navigate = useNavigate();

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["userBookings"],
    queryFn: async () => {
      const response = await api.get("/restaurants/bookings");
      return response.data;
    },
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage your restaurant bookings
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading your bookings...</div>
        ) : bookings && bookings.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="p-6 hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {booking.restaurant.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {booking.restaurant.location}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      booking.status
                    )}`}
                  >
                    {booking.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Date & Time
                    </p>
                    <p className="mt-1">
                      {new Date(booking.date).toLocaleDateString()}
                    </p>
                    <p className="mt-1">
                      {new Date(
                        `1970-01-01T${booking.time_slot.start_time}`
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      -
                      {new Date(
                        `1970-01-01T${booking.time_slot.end_time}`
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Table Details
                    </p>
                    <p className="mt-1">Table {booking.table.table_number}</p>
                    <p className="mt-1">{booking.number_of_guests} guests</p>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate(`/restaurants/${booking.restaurant.id}`)
                    }
                  >
                    View Restaurant
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 px-4">
            <p className="text-gray-500 mb-4">
              You don't have any bookings yet
            </p>
            <Button onClick={() => navigate("/search")}>
              Find a Restaurant
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
