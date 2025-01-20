import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import api from "../../utils/api";
import Button from "../../components/common/Button";
import Modal from "../../components/common/Modal";
import { useAuth } from "../../context/AuthContext";

interface Table {
  id: string;
  table_number: string;
  capacity: number;
}

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  date: string;
}

interface BookingData {
  time_slot_id: string;
  table_id: string;
  number_of_guests: number;
  date: string;
  restaurant_id: string;
}

const TableSelection = () => {
  const { restaurantId, slotId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const guests = Number(searchParams.get("guests"));
  const date = searchParams.get("date") || "";

  // Query for time slot details
  const { data: timeSlot } = useQuery<TimeSlot>({
    queryKey: ["timeSlot", slotId],
    queryFn: async () => {
      const response = await api.get(
        `/restaurants/${restaurantId}/timeslots/${slotId}`
      );
      return response.data;
    },
  });

  // Query for available tables
  const { data: tables, isLoading } = useQuery<Table[]>({
    queryKey: ["availableTables", restaurantId, slotId, guests],
    queryFn: async () => {
      const response = await api.get(
        `/restaurants/${restaurantId}/timeslots/${slotId}/available-tables`,
        { params: { guests } }
      );
      return response.data;
    },
  });

  const bookingMutation = useMutation({
    mutationFn: async (tableId: string) => {
      const bookingData = {
        time_slot_id: slotId,
        table_id: tableId,
        number_of_guests: guests,
        date: date,
      };

      const response = await api.post(
        `/restaurants/${restaurantId}/bookings`,
        bookingData
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success("Table booked successfully!");
      navigate("/user/bookings");
    },
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.detail || "Failed to book table";
      toast.error(errorMessage);
      setIsConfirmModalOpen(false);
      setSelectedTable(null);
    },
  });

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
    setIsConfirmModalOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
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
          Back
        </Button>
      </div>

      {timeSlot && (
        <div className="bg-white shadow-sm rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Selected Time Slot
              </h3>
              <p className="text-sm text-gray-500">
                Please select a table for your reservation
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold text-gray-900">
                {timeSlot.start_time} - {timeSlot.end_time}
              </p>
              <p className="text-sm text-gray-500">{date}</p>
              <p className="text-sm text-gray-500">{guests} guests</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            Available Tables
          </h2>
          {isLoading ? (
            <div className="text-center py-4">Loading available tables...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tables?.map((table) => (
                <button
                  key={table.id}
                  onClick={() => handleTableClick(table)}
                  className="aspect-square rounded-lg p-4 flex flex-col items-center justify-center bg-green-500 hover:bg-green-600 transition-colors duration-200 text-white"
                >
                  <span className="text-xl font-bold">
                    Table {table.table_number}
                  </span>
                  <span className="text-sm mt-2">
                    Capacity: {table.capacity}
                  </span>
                </button>
              ))}
              {tables?.length === 0 && (
                <div className="col-span-full text-center py-4 text-gray-500">
                  No tables available for the selected number of guests
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => {
          setIsConfirmModalOpen(false);
          setSelectedTable(null);
        }}
        title="Confirm Booking"
      >
        {selectedTable && timeSlot && (
          <div className="space-y-4">
            <div>
              <p className="text-lg font-medium">Booking Details</p>
              <div className="mt-2 space-y-2">
                <p>Table: {selectedTable.table_number}</p>
                <p>Capacity: {selectedTable.capacity} persons</p>
                <p>Guests: {guests}</p>
                <p>Date: {date}</p>
                <p>
                  Time: {timeSlot.start_time} - {timeSlot.end_time}
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsConfirmModalOpen(false);
                  setSelectedTable(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => bookingMutation.mutate(selectedTable.id)}
                isLoading={bookingMutation.isPending}
              >
                Confirm Booking
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TableSelection;
