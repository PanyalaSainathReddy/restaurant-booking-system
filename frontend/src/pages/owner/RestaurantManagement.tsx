import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import api from "../../utils/api";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";
import Modal from "../../components/common/Modal";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TrashIcon } from "@heroicons/react/24/outline";

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  date: string;
}

interface Table {
  id: string;
  table_number: string;
  capacity: number;
  time_slot_id: string;
}

// Type definitions
interface TimeSlotForm {
  start_time: string;
}

// Form schema
const timeSlotSchema = z.object({
  start_time: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
});

// Update the form schema
const tableSchema = z.object({
  table_number: z.string().min(1, "Table number is required"),
  capacity: z.number().min(1, "Capacity must be at least 1"),
});

// Use type inference from the schema instead of a separate interface
type TableForm = z.infer<typeof tableSchema>;

const RestaurantManagement = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isTimeSlotModalOpen, setIsTimeSlotModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isEditTableModalOpen, setIsEditTableModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const {
    register: registerTimeSlot,
    handleSubmit: handleTimeSlotSubmit,
    formState: { errors: timeSlotErrors },
    reset: resetTimeSlotForm,
  } = useForm<TimeSlotForm>({
    resolver: zodResolver(timeSlotSchema),
  });

  const {
    register: registerTable,
    handleSubmit: handleTableSubmit,
    formState: { errors: tableErrors },
    reset: resetTableForm,
  } = useForm<TableForm>({
    resolver: zodResolver(tableSchema),
  });

  // Fetch time slots
  const { data: timeSlots, isLoading: timeSlotsLoading } = useQuery({
    queryKey: ["timeSlots", restaurantId, selectedDate],
    queryFn: async () => {
      const response = await api.get(
        `/restaurants/${restaurantId}/available-slots?date=${selectedDate}`
      );
      return response.data as TimeSlot[];
    },
  });

  // Add time slot mutation
  const addTimeSlotMutation = useMutation({
    mutationFn: async (data: TimeSlotForm) => {
      // Convert the date to ISO string format
      const formattedDate = new Date(selectedDate).toISOString();

      const response = await api.post(
        `/restaurants/${restaurantId}/slots?date=${formattedDate}&start_time=${data.start_time}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["timeSlots", restaurantId, selectedDate],
      });
      setIsTimeSlotModalOpen(false);
      resetTimeSlotForm();
      toast.success("Time slot added successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to add time slot");
    },
  });

  // Delete time slot mutation
  const deleteTimeSlotMutation = useMutation({
    mutationFn: async (slotId: string) => {
      await api.delete(`/restaurants/${restaurantId}/slots/${slotId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["timeSlots", restaurantId, selectedDate],
      });
      toast.success("Time slot deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to delete time slot");
    },
  });

  // Add these queries after existing queries
  const { data: restaurantTables, isLoading: tablesLoading } = useQuery({
    queryKey: ["restaurantTables", restaurantId],
    queryFn: async () => {
      const response = await api.get(`/restaurants/${restaurantId}/tables`);
      return response.data as Table[];
    },
  });

  const addTableMutation = useMutation({
    mutationFn: async (data: TableForm) => {
      const response = await api.post(`/restaurants/${restaurantId}/tables`, {
        table_number: data.table_number,
        capacity: data.capacity,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["restaurantTables", restaurantId],
      });
      setIsTableModalOpen(false);
      resetTableForm();
      toast.success("Table added successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to add table");
    },
  });

  const deleteTableMutation = useMutation({
    mutationFn: async (tableId: string) => {
      await api.delete(`/restaurants/${restaurantId}/tables/${tableId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["restaurantTables", restaurantId],
      });
      toast.success("Table deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to delete table");
    },
  });

  const editTableMutation = useMutation({
    mutationFn: async (data: TableForm & { id: string }) => {
      const response = await api.put(
        `/restaurants/${restaurantId}/tables/${data.id}`,
        {
          table_number: data.table_number,
          capacity: data.capacity,
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["restaurantTables", restaurantId],
      });
      setIsEditTableModalOpen(false);
      setSelectedTable(null);
      resetTableForm();
      toast.success("Table updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Failed to update table");
    },
  });

  const onTimeSlotSubmit = (data: TimeSlotForm) => {
    addTimeSlotMutation.mutate(data);
  };

  // Update the form submission
  const onTableSubmit = (data: TableForm) => {
    addTableMutation.mutate(data);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Restaurant Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage time slots for your restaurant
          </p>
        </div>
        <Link
          to="/owner/dashboard"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Time Slots Section */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Time Slots</h2>
            <Input
              label="Date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="mt-2"
            />
          </div>
          <Button onClick={() => setIsTimeSlotModalOpen(true)}>
            Add Time Slot
          </Button>
        </div>
        <div className="border-t border-gray-200 p-4">
          {timeSlotsLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {timeSlots?.map((slot) => (
                <div key={slot.id} className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      navigate(
                        `/owner/restaurants/${restaurantId}/timeslots/${slot.id}/tables`
                      )
                    }
                    className="text-left p-4 flex-grow"
                  >
                    <p className="font-medium">
                      {slot.start_time} - {slot.end_time}
                    </p>
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => deleteTimeSlotMutation.mutate(slot.id)}
                    className="px-3"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Time Slot Modal */}
      <Modal
        isOpen={isTimeSlotModalOpen}
        onClose={() => {
          setIsTimeSlotModalOpen(false);
          resetTimeSlotForm();
        }}
        title="Add Time Slot"
      >
        <form
          onSubmit={handleTimeSlotSubmit(onTimeSlotSubmit)}
          className="space-y-4"
        >
          <Input
            type="time"
            label="Start Time"
            error={timeSlotErrors.start_time?.message?.toString()}
            {...registerTimeSlot("start_time")}
          />
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsTimeSlotModalOpen(false);
                resetTimeSlotForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={addTimeSlotMutation.isPending}>
              Add Time Slot
            </Button>
          </div>
        </form>
      </Modal>

      {/* Restaurant Tables Section */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">
            Restaurant Tables
          </h2>
          <Button onClick={() => setIsTableModalOpen(true)}>Add Table</Button>
        </div>
        <div className="border-t border-gray-200 p-4">
          {tablesLoading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <div className="grid grid-cols-4 gap-4">
              {restaurantTables?.map((table) => (
                <div
                  key={table.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">Table {table.table_number}</p>
                    <p className="text-sm text-gray-500">
                      Capacity: {table.capacity}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedTable(table);
                        setIsEditTableModalOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => deleteTableMutation.mutate(table.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table Modal */}
      <Modal
        isOpen={isTableModalOpen}
        onClose={() => {
          setIsTableModalOpen(false);
          resetTableForm();
        }}
        title="Add Table"
      >
        <form onSubmit={handleTableSubmit(onTableSubmit)} className="space-y-4">
          <Input
            type="text"
            label="Table Number"
            error={tableErrors.table_number?.message?.toString()}
            {...registerTable("table_number")}
          />
          <Input
            type="number"
            label="Capacity"
            error={tableErrors.capacity?.message?.toString()}
            {...registerTable("capacity", { valueAsNumber: true })}
          />
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsTableModalOpen(false);
                resetTableForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={addTableMutation.isPending}>
              Add Table
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Edit Table Modal */}
      <Modal
        isOpen={isEditTableModalOpen}
        onClose={() => {
          setIsEditTableModalOpen(false);
          setSelectedTable(null);
          resetTableForm();
        }}
        title="Edit Table"
      >
        <form
          onSubmit={handleTableSubmit((data) => {
            if (selectedTable) {
              editTableMutation.mutate({ ...data, id: selectedTable.id });
            }
          })}
          className="space-y-4"
        >
          <Input
            type="text"
            label="Table Number"
            defaultValue={selectedTable?.table_number}
            error={tableErrors.table_number?.message?.toString()}
            {...registerTable("table_number")}
          />
          <Input
            type="number"
            label="Capacity"
            defaultValue={selectedTable?.capacity}
            error={tableErrors.capacity?.message?.toString()}
            {...registerTable("capacity", { valueAsNumber: true })}
          />
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditTableModalOpen(false);
                setSelectedTable(null);
                resetTableForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={editTableMutation.isPending}>
              Update Table
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RestaurantManagement;
