import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import api from "../../utils/api";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface Table {
  id: string;
  table_number: string;
  capacity: number;
  time_slot_id: string;
  is_booked?: boolean;
  is_admin_reserved?: boolean;
  booking_details?: {
    customer_name: string;
    customer_email: string;
    booking_time: string;
    number_of_guests: number;
  };
}

interface TableStatus {
  id: string;
  is_booked: boolean;
  is_admin_reserved: boolean;
  booking_details?: {
    customer_name: string;
    customer_email: string;
    booking_time: string;
    number_of_guests: number;
  };
}

const tableSchema = z.object({
  number: z.string().min(1, "Table number is required"),
  capacity: z.number().min(1, "Capacity must be at least 1"),
});

type TableForm = z.infer<typeof tableSchema>;

const TimeSlotTables = () => {
  const { restaurantId, timeSlotId } = useParams();
  const queryClient = useQueryClient();
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAdminReserveModalOpen, setIsAdminReserveModalOpen] = useState(false);

  const { data: tables, isLoading: tablesLoading } = useQuery({
    queryKey: ["restaurantTables", restaurantId, timeSlotId],
    queryFn: async () => {
      const response = await api.get(
        `/restaurants/${restaurantId}/timeslots/${timeSlotId}/tables`
      );
      return response.data as Table[];
    },
  });

  const adminReserveMutation = useMutation({
    mutationFn: async (tableId: string) => {
      await api.post(
        `/restaurants/${restaurantId}/timeslots/${timeSlotId}/tables/${tableId}/admin-reserve`
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["restaurantTables", restaurantId, timeSlotId],
      });
      setIsAdminReserveModalOpen(false);
      setSelectedTable(null);
      toast.success("Table reserved successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to reserve table");
    },
  });

  const handleTableClick = (table: Table) => {
    setSelectedTable(table);
    if (table.is_booked) {
      setIsDetailsModalOpen(true);
    } else if (table.is_admin_reserved) {
      setIsDetailsModalOpen(true);
    } else {
      setIsAdminReserveModalOpen(true);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Tables Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage tables for this time slot
          </p>
        </div>
        <Link
          to={`/owner/restaurants/${restaurantId}/manage`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700"
        >
          Back to Time Slots
        </Link>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h2 className="text-lg font-medium text-gray-900">Tables</h2>
        </div>
        <div className="border-t border-gray-200">
          {tablesLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <div className="grid grid-cols-4 gap-6 p-6">
              {tables?.map((table) => (
                <button
                  key={table.id}
                  onClick={() => handleTableClick(table)}
                  className={`
                    aspect-square rounded-lg p-4 flex flex-col items-center justify-center
                    transition-colors duration-200
                    ${
                      table.is_booked
                        ? "bg-gray-500 hover:bg-gray-600"
                        : table.is_admin_reserved
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-green-500 hover:bg-green-600"
                    }
                    text-white
                  `}
                >
                  <span className="text-xl font-bold">
                    Table {table.table_number}
                  </span>
                  <span className="text-sm mt-2">
                    Capacity: {table.capacity}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Details Modal - Updated to handle both bookings and admin reservations */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedTable(null);
        }}
        title="Table Details"
      >
        {selectedTable && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Table Number
              </label>
              <p className="mt-1 text-lg font-medium">
                {selectedTable.table_number}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Capacity
              </label>
              <p className="mt-1">{selectedTable.capacity} persons</p>
            </div>
            {selectedTable.is_booked ? (
              <div>
                <div className="pt-4">
                  <p className="text-gray-600 font-medium">Booking Details</p>
                  {selectedTable.booking_details && (
                    <>
                      <p>
                        Customer: {selectedTable.booking_details.customer_name}
                      </p>
                      <p>
                        Email: {selectedTable.booking_details.customer_email}
                      </p>
                      <p>
                        Guests: {selectedTable.booking_details.number_of_guests}
                      </p>
                      <p>Time: {selectedTable.booking_details.booking_time}</p>
                    </>
                  )}
                </div>
              </div>
            ) : selectedTable.is_admin_reserved ? (
              <div className="pt-4">
                <p className="text-red-600 font-medium">
                  ⚠️ This table is reserved by admin
                </p>
              </div>
            ) : null}
            <div className="flex justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setSelectedTable(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Admin Reserve Modal - Only shown for available tables */}
      <Modal
        isOpen={isAdminReserveModalOpen}
        onClose={() => {
          setIsAdminReserveModalOpen(false);
          setSelectedTable(null);
        }}
        title="Table Details"
      >
        {selectedTable && !selectedTable.is_admin_reserved && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Table Number
              </label>
              <p className="mt-1 text-lg font-medium">
                {selectedTable.table_number}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Capacity
              </label>
              <p className="mt-1">{selectedTable.capacity} persons</p>
            </div>
            <div className="pt-4">
              <p className="text-green-600 font-medium">
                ✓ Available for booking
              </p>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdminReserveModalOpen(false);
                  setSelectedTable(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => adminReserveMutation.mutate(selectedTable.id)}
                isLoading={adminReserveMutation.isPending}
              >
                Reserve Table
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TimeSlotTables;
