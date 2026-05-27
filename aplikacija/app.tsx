import { useState, useMemo, useEffect } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Calendar,
  Users,
  Clock,
  Home,
  X,
  Check,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { format } from "date-fns";

// Types
interface Booking {
  id: string;
  guestName: string;
  roomType: "Suite" | "Deluxe" | "Standard";
  checkIn: string;
  checkOut: string;
  status: "Confirmed" | "Pending";
  email?: string;
  brojTelefona?: string;
}


export default function App() {
  const [bookings, setBookings] = useState<Booking[]>();
  useEffect(() => {
    fetch("http://localhost:5000/api/rezervacije")
      .then((response) => response.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          console.error("Backend nije vratio niz:", data);
          return;
        }

        const mapiraneRezervacije: Booking[] = data.map((res: any) => ({
          id: res.id ? res.id.toString() : Date.now().toString(),
          guestName: res.guest_name || "Nepoznati Gost",
          roomType: (res.room_type === "Suite"
            ? "Suite"
            : res.room_type === "Deluxe"
            ? "Deluxe"
            : "Standard") as Booking["roomType"],
          checkIn: res.check_in ? res.check_in.split('T')[0] : "2026-05-26",
          checkOut: res.check_out ? res.check_out.split('T')[0] : "2026-05-30",
          status: (res.status === "potvrdena" ? "Confirmed" : "Pending") as Booking["status"],
          email: res.email || "",
          brojTelefona: res.broj_telefona || "",
        }));
        setBookings(mapiraneRezervacije);
      })
      .catch((error) => console.error("Greška pri dohvaćanju s backenda:", error));
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    guestName: "",
    roomType: "Standard" as Booking["roomType"],
    checkIn: "",
    checkOut: "",
    status: "Pending" as Booking["status"],
    email: "",    
    brojTelefona: "",
  });

  // Calculate stats
  const stats = useMemo(() => {
    const sigurniBookings = bookings || [];
    const total = sigurniBookings.length;
    const confirmed = sigurniBookings.filter((b) => b && b.status === "Confirmed").length;
    const pending = sigurniBookings.filter((b) => b && b.status === "Pending").length;
    const availableRooms = 50 - total; // Assume 50 total rooms

    return { total, confirmed, pending, availableRooms };
  }, [bookings]);

  // Filter bookings
  const filteredBookings = useMemo(() => {
    const sigurniBookings = bookings || [];
    return sigurniBookings.filter((booking) => {
      if (!booking || !booking.guestName) return false;
      const matchesSearch = booking.guestName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "All" || booking.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchQuery, statusFilter]);

  // Form handlers
  const resetForm = () => {
    setFormData({
      guestName: "",
      roomType: "Standard",
      checkIn: "",
      checkOut: "",
      status: "Pending",
      email: "",  
      brojTelefona: "",
    });
    setEditingBooking(null);
  };

  const handleOpenModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

 const handleAddBooking = async () => {
    try {
      console.log("Ove podatke šaljemo na backend:", {
        guestName: formData.guestName,
        roomType: formData.roomType,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        status: formData.status,
        email: formData.email,
        brojTelefona: formData.brojTelefona
      });

      const response = await fetch("http://localhost:5000/api/rezervacije", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          guestName: formData.guestName,
          roomType: formData.roomType,
          checkIn: formData.checkIn,
          checkOut: formData.checkOut,
          status: formData.status,
          email: formData.email,      
          brojTelefona: formData.brojTelefona 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        const kompletnaRezervacija: Booking = {
          id: data.id,
          guestName: formData.guestName,
          roomType: formData.roomType,
          checkIn: formData.checkIn,
          checkOut: formData.checkOut,
          status: formData.status,
          email: formData.email,
          brojTelefona: formData.brojTelefona,
        };

        setBookings((prev) => [kompletnaRezervacija, ...(prev ?? [])]);
        setIsModalOpen(false); 
        resetForm(); 
        alert("Rezervacija s kontakt podacima uspješno dodana!");
      } else {
        alert("Greška prilikom spremanja rezervacije na backendu.");
      }
    } catch (error) {
      console.error("Greška pri dodavanju rezervacije:", error);
    }
  };

 const handleOpenEditModal = (booking: Booking) => {
  setFormData({
    guestName: booking.guestName,
    roomType: booking.roomType,
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    status: booking.status,
    email: booking.email || "",
    brojTelefona: booking.brojTelefona || "",
  });
  setEditingBooking(booking);
  setIsModalOpen(true);
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!editingBooking) {
    // Ako nema editingBooking, pozovi add
    await handleAddBooking();
    return;
  }

  // UPDATE
  try {
    const response = await fetch(
      `http://localhost:5000/api/rezervacije/${editingBooking.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      }
    );
    if (response.ok) {
      setBookings((prev) =>
        prev?.map((b) =>
          b.id === editingBooking.id ? { ...b, ...formData } : b
        ) ?? []
      );
      alert("Rezervacija uspješno ažurirana!");
    } else {
      alert("Greška pri ažuriranju.");
    }
  } catch (error) {
    console.error(error);
  }

  setIsModalOpen(false);
  resetForm();
};
//brisanje rezervacije
const handleDeleteBooking = async () => {
  if (!deletingId) return;
  try {
    const response = await fetch(`http://localhost:5000/api/rezervacije/${deletingId}`, {
      method: "DELETE",
    });
    if (response.ok) {
      setBookings((prev) => prev?.filter((b) => b.id !== deletingId) ?? []);
    } else {
      alert("Greška prilikom brisanja rezervacije na backendu.");
    }
  } catch (error) {
    console.error("Greška pri brisanju rezervacije:", error);
  } finally {
    setDeletingId(null);
  }
};

  return (
    <div className="min-h-screen bg-background font-[family-name:var(--font-family)]">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">
                  Hotel Booking Management
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage reservations and room bookings
                </p>
              </div>
            </div>
            <button
              onClick={handleOpenModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Booking
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Calendar className="w-5 h-5" />}
            label="Total Bookings"
            value={stats.total}
            bgColor="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            icon={<Check className="w-5 h-5" />}
            label="Confirmed"
            value={stats.confirmed}
            bgColor="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Pending"
            value={stats.pending}
            bgColor="bg-amber-50"
            iconColor="text-amber-600"
          />
          <StatCard
            icon={<Users className="w-5 h-5" />}
            label="Available Rooms"
            value={stats.availableRooms}
            bgColor="bg-slate-50"
            iconColor="text-slate-600"
          />
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by guest name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Status Filter */}
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground appearance-none cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Guest Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Room Type
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Check-in
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Check-out
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Calendar className="w-12 h-12 text-muted-foreground/40" />
                        <p className="text-muted-foreground">
                          No bookings found
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        {booking.guestName}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {booking.roomType}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {format(new Date(booking.checkIn), "MMM dd, yyyy")}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {format(new Date(booking.checkOut), "MMM dd, yyyy")}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={booking.status} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>handleOpenEditModal(booking)}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Edit booking"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                              onClick={() => setDeletingId(booking.id)}
                            className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            title="Delete booking"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add/Edit Booking Modal */}
      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card rounded-xl shadow-2xl border border-border max-w-lg w-full max-h-[90vh] overflow-y-auto z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <Dialog.Title className="text-xl font-semibold text-foreground">
                  {editingBooking ? "Edit Booking" : "Add New Booking"}
                </Dialog.Title>
                <Dialog.Close className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </Dialog.Close>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Guest Name */}
                <div>
                  <label
                    htmlFor="guestName"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Guest Name
                  </label>
                  <input
                    id="guestName"
                    type="text"
                    required
                    value={formData.guestName}
                    onChange={(e) =>
                      setFormData({ ...formData, guestName: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                    placeholder="Enter guest name"
                  />
                </div>

                {/* Email*/}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                    placeholder="Enter guest email"
                  />
                </div>

                {/* Broj telefona */}
                <div>
                  <label htmlFor="brojTelefona" className="block text-sm font-medium text-foreground mb-2">
                    Broj telefona
                  </label>
                  <input
                    id="brojTelefona"
                    type="text"
                    required
                    value={formData.brojTelefona}
                    onChange={(e) =>
                      setFormData({ ...formData, brojTelefona: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                    placeholder="Enter phone number"
                  />
                </div>

                {/* Room Type */}
                <div>
                  <label
                    htmlFor="roomType"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Room Type
                  </label>
                  <select
                    id="roomType"
                    required
                    value={formData.roomType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        roomType: e.target.value as Booking["roomType"],
                      })
                    }
                    className="w-full px-4 py-2.5 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground appearance-none cursor-pointer"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Deluxe">Deluxe</option>
                    <option value="Suite">Suite</option>
                  </select>
                </div>

                {/* Check-in Date */}
                <div>
                  <label
                    htmlFor="checkIn"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Check-in Date
                  </label>
                  <input
                    id="checkIn"
                    type="date"
                    required
                    value={formData.checkIn}
                    onChange={(e) =>
                      setFormData({ ...formData, checkIn: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                  />
                </div>

                {/* Check-out Date */}
                <div>
                  <label
                    htmlFor="checkOut"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Check-out Date
                  </label>
                  <input
                    id="checkOut"
                    type="date"
                    required
                    value={formData.checkOut}
                    onChange={(e) =>
                      setFormData({ ...formData, checkOut: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                  />
                </div>

                {/* Status */}
                <div>
                  <label
                    htmlFor="status"
                    className="block text-sm font-medium text-foreground mb-2"
                  >
                    Status
                  </label>
                  <select
                    id="status"
                    required
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as Booking["status"],
                      })
                    }
                    className="w-full px-4 py-2.5 bg-input-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground appearance-none cursor-pointer"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                  </select>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4">
                  <Dialog.Close asChild>
                    <button
                      type="button"
                      className="flex-1 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </Dialog.Close>
                <button 
                type="submit"
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm"
              >
                {editingBooking ? "Update Booking" : "Add Booking"}
              </button>
                </div>
              </form>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Delete Confirmation Modal */}
<Dialog.Root open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
  <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
    <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card rounded-xl shadow-2xl border border-border w-full max-w-sm z-50 p-6">
      <Dialog.Description className="text-sm text-muted-foreground mb-6">
        Jeste li sigurni da želite obrisati ovu rezervaciju? Ova radnja se ne može poništiti.
      </Dialog.Description>
      <div className="flex gap-3">
        <Dialog.Close asChild>
          <button className="flex-1 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium">
            Odustani
          </button>
        </Dialog.Close>
        <button
          onClick={handleDeleteBooking}
          className="flex-1 px-4 py-2.5 bg-destructive text-white rounded-lg hover:bg-destructive/90 transition-colors font-medium"
        >
          Obriši
        </button>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
    </div>
  );
}

// Components
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  bgColor: string;
  iconColor: string;
}

function StatCard({ icon, label, value, bgColor, iconColor }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center ${iconColor}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-2xl font-semibold text-foreground mt-1">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

interface StatusBadgeProps {
  status: "Confirmed" | "Pending";
}

function StatusBadge({ status }: StatusBadgeProps) {
  if (status === "Confirmed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
        Confirmed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
      Pending
    </span>
  );
}
