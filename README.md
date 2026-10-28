# The Royal Palace Inn — Boutique Hotel Website & Booking System

A production-ready hotel web application for **The Royal Palace Inn** (Jaipur, Rajasthan, India), featuring real physical room inventory control (6 rooms), database-backed availability calculations, direct WhatsApp booking enquiries, and a secure owner admin dashboard.

---

## 1. Property Overview

- **Hotel Name:** The Royal Palace Inn
- **Property Scale:** Intimate boutique hotel with exactly **6 physical rooms**
- **Hotel Contact & WhatsApp Number:** `+91 7700 869 635` (normalized: `917700869635`)
- **Location:** 14, Heritage Palace Enclave, Civil Lines, Jaipur, Rajasthan 302006, India
- **Currency:** Indian Rupees (INR - ₹)
- **Room Categories & Starting Rates:**
  1. **Superior King Suite** — ₹2,490 per night
  2. **Deluxe Double Room** — ₹3,850 per night
  3. **Luxury Quadruple Room** — ₹4,199 per night

---

## 2. Key Architecture & Features

### A. Real Physical Room Inventory (6 Rooms)
Unlike generic booking sites that assume infinite inventory, The Royal Palace Inn tracks precisely 6 physical rooms:
- **Room 101:** Gulab Suite (Ground Floor)
- **Room 102:** Champa Suite (Ground Floor)
- **Room 103:** Mogra Room (Ground Floor)
- **Room 201:** Neelkamal Room (First Floor)
- **Room 202:** Sheesh Mahal Quad (First Floor)
- **Room 203:** Rajputana Quad (First Floor)

Rooms can be dynamically reassigned across the 3 categories, marked for maintenance, or blocked for private use from the Admin Dashboard.

### B. Database-Backed Concurrency & Availability Engine
- Powered by persistent SQLite (`better-sqlite3`) with WAL journal mode and foreign key constraints.
- Real-time availability algorithm accurately accounts for check-in / check-out boundary conditions:
  $$\text{Overlap Condition: } \text{booking.check\_in} < \text{req.check\_out} \text{ AND } \text{booking.check\_out} > \text{req.check\_in}$$
- Server-side transaction logic prevents double-booking or overbooking when multiple guests enquire simultaneously.
- Statuses tracked: `pending`, `confirmed`, `checked_in`, `checked_out`, `cancelled`, `no_show`.

### C. Direct WhatsApp Reservation Handover
- Every booking enquiry is recorded in the backend database first, generating a unique booking reference (`RPI-YYYY-XXXX`).
- Automatically formats a complete reservation request:
  ```
  Hello The Royal Palace Inn,

  I would like to request a room booking.

  Guest Name: [Customer Name]
  Phone: [Customer Phone]
  Room Category: [Selected Room Type]
  Number of Rooms: [Room Count]
  Check-in: [Check-in Date]
  Check-out: [Check-out Date]
  Total Nights: [Number of Nights]
  Adults: [Adult Count]
  Children: [Child Count]
  Rate per Night: ₹[Rate]
  Estimated Total: ₹[Total]
  Special Requests: [Customer Notes]
  Booking Reference: [Reference]

  Please confirm room availability and the final payable amount.

  Thank you.
  ```
- Direct launch via `https://wa.me/917700869635?text=...`.
- Transparent customer guidance informing guests that they must tap **Send** in WhatsApp, and that their reservation will be reviewed and confirmed by the hotel.

### D. Secure Owner Admin Dashboard (`/admin`)
- Accessible via `/admin` or through the top/footer staff portal buttons.
- Server-side JWT authentication with `bcryptjs` password hashing.
- Brute-force rate limiting on the login endpoint.
- **Default Owner Credentials:**
  - **Username:** `admin`
  - **Password:** `RoyalPalace2026!`
  *(Can be updated anytime directly in the dashboard)*
- Features:
  - **Dashboard Overview:** Live occupancy rate of the 6 rooms, movements today, pending enquiry alerts, total revenue.
  - **Bookings Manager:** Search, filter, view details, assign physical rooms, change statuses, manage payment status, and export to CSV.
  - **Physical Rooms Manager:** Full control over the 6 rooms, operational statuses, and maintenance notes.
  - **Categories & Rates:** Modify pricing, occupancy, bed types, descriptions, and amenities.
  - **Occupancy Calendar Matrix:** 6 rooms $\times$ days of the month visual grid with color-coded occupancies and blocks.
  - **Hotel Settings:** Full customization of hotel profile, policies, taxes, hero banner, and contact info.
  - **WhatsApp & Payments:** Customize message templates, select Mode A vs Mode B, and set UPI / payment instructions.
  - **Gallery Manager:** Add, view, or remove hotel photographs.
  - **Audit Trail:** Chronological security log of all admin operations.

---

## 3. Installation & Local Development

### Prerequisites
- Node.js (v18 or higher; v22 recommended)
- npm or yarn

### Setup
```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables (optional for local dev)
cp .env.example .env

# 3. Start the full-stack development server
npm run dev
```

The application runs on `http://localhost:3000`.

---

## 4. Environment Variables (`.env`)

```ini
PORT=3000
NODE_ENV=development
JWT_SECRET="YOUR_SECURE_RANDOM_SECRET_KEY"

# Optional external PostgreSQL/Supabase database
# If left blank, the built-in SQLite database (data/royal_palace.db) is used automatically.
DATABASE_URL=""

# Optional Payment Gateway
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""

# Optional WhatsApp Business Platform (Mode B)
WHATSAPP_PHONE_NUMBER_ID=""
WHATSAPP_CLOUD_API_TOKEN=""
```

---

## 5. Build and Production Deployment

```bash
# 1. Type check and build frontend assets
npm run build

# 2. Run the production full-stack server
npm start
```
