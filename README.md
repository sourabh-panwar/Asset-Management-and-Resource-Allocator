# IITR Smart Asset Management Platform

A robust, full-stack enterprise asset management and resource allocation platform developed to streamline inventory tracking, request fulfillment, and operational workflows for the Cultural Council of IIT Roorkee. This system replaces fragmented communication and manual registers with a real-time, role-based digital catalog.

---

## 🏛️ System Architecture Deep Dive

The platform is designed around a decoupled, highly cohesive **3-Tier Client-Server Architecture** optimized for data integrity, strict role isolation, and stateless scaling.

### 1. Presentation Layer (Client / Frontend)
* **Architecture:** Component-driven Single Page Application (SPA) built with **React.js** and bundled using **Vite**.
* **State & Flow:** Leverages synchronous and asynchronous component state hooks (`useState`, `useEffect`) to manage UI states. Custom operational buffers, dynamic loading states, and temporary button disabling are implemented across all forms to mitigate transactional latency and eliminate duplicate form submissions ("dead clicks").
* **Role-Based Access Control (RBAC):** Token payloads are decoded client-side to conditionally render views. Administrative actions (CRUD operations, global audit logging, analytics dashboards) are completely isolated from standard resource consumers, who only see the available inventory and personal booking histories.
* **Data Visualization:** Client-side analytics are driven by **Chart.js**, rendering live telemetry regarding category asset distribution and usage frequencies.

### 2. Application Layer (Server / Backend)
* **Architecture:** Event-driven, asynchronous I/O backend environment utilizing **Node.js** and the **Express.js** framework.
* **API Paradigm:** Implements a strict, stateless RESTful API design. All application states are manipulated via standardized HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`) mapping to strictly isolated semantic endpoints.
* **Authentication & Cryptography:** Implements stateless authentication via cryptographically signed **JSON Web Tokens (JWT)**. User credentials are systematically protected pre-database insertion using **bcryptjs** salted hashing algorithms, ensuring total password confidentiality.

### 3. Data Layer (Database Architecture)
* **Engine:** Relational Database Management System (RDBMS) driven by **PostgreSQL** (hosted via cloud-replicated serverless infrastructure on Neon.tech).
* **Normalization:** Enforces Third Normal Form (3NF) relational constraints across tables (`users`, `assets`, `bookings`, `audit_logs`, `asset_health_logs`, `notifications`) to mitigate data redundancy anomalies. Relational dependencies are tightly locked using strict Foreign Keys utilizing `ON DELETE CASCADE` mechanics.
* **ACID Transactions:** To prevent scheduling conflicts, race conditions, and phantom stock errors during high-concurrency periods, critical state updates are wrapped in rigorous database transactions (`BEGIN` / `COMMIT` / `ROLLBACK`). During booking approval, the status transition and inventory stock decrement are evaluated as a single atomic unit; a structural failure at any sub-step completely rolls back the operational pipeline, guaranteeing 100% data integrity.

---

## 🛠️ Technology Stack

* **Frontend:** React.js, Vite, Chart.js
* **Backend:** Node.js, Express.js
* **Database:** PostgreSQL (Neon.tech)
* **Security:** JWT (jsonwebtoken), bcryptjs, CORS Middleware

---

## 🗃️ Database Schema Outline

* **`users`**: Tracks identities, credentials, and access roles (`admin` vs `user`).
* **`assets`**: Real-time ledger recording tracking metrics (`total_quantity`, `available_quantity`) and asset physical condition (`Good`, `Fair`, `Needs Repair`).
* **`bookings`**: Transactional registry tracking specific quantity demands and booking lifecycles via finite state machine tracking (`pending` → `approved` → `return_pending` → `returned`).
* **`audit_logs`**: Append-only, historical administrative journal tracking security-sensitive state modifications.
* **`asset_health_logs`**: Granular lifecycle tracking containing physical condition revisions and damage log reporting.
* **`notifications`**: Asynchronous transactional notifications dispatched dynamically to users regarding request updates.

---

## 🔌 API Route Reference

### Authentication
* `POST /api/auth/register` - Create new identity.
* `POST /api/auth/login` - Authenticate credentials and return signed JWT.

### Inventory & Management
* `GET /api/assets` - Retrieve all available assets.
* `POST /api/assets` - [Admin] Append a new physical resource.
* `PUT /api/assets/:id` - [Admin] Modify parameters or log condition updates.
* `DELETE /api/assets/:id` - [Admin] Remove asset record from circulation.

### Booking & Allocation Workflows
* `GET /api/bookings` - Fetch allocation historical context (Filterable by `user_id`).
* `POST /api/bookings` - Submit an allocation or reservation request.
* `PUT /api/bookings/:id/approve` - [Admin] Atomically approve booking request and decrease available stock.
* `PUT /api/bookings/:id/reject` - [Admin] Reject request.
* `PUT /api/bookings/:id/request-return` - Trigger return workflow for active borrowings.
* `PUT /api/bookings/:id/approve-return` - [Admin] Atomically close allocation lifecycle and restore available stock counts.

### Auditing & Notifications
* `GET /api/audit-logs` - [Admin] Fetch full security trail.
* `GET /api/notifications/:userId` - Fetch active notifications for dashboard bell widgets.
* `PUT /api/notifications/:id/read` - Mark specific notification as acknowledged.

---

## ⚙️ Installation & Configuration

### Prerequisites
* Node.js (v16.x or higher)
* PostgreSQL Instance (or active Neon.tech connection string)

### 1. Repository Clonation
```bash
git clone <your-repository-url>
cd "ASSET MANAGER"