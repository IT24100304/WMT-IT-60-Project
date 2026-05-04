# Faculty of Computing

## BSc (Hons) in Software Engineering
### Year 2 Semester 2 (2026)

---

**SE2020 – Web and Mobile Technologies** &nbsp;&nbsp;&nbsp;&nbsp; **Group Assignment**

---

## Group Assignment: Full Stack Mobile Application

**Weight:** 20% (Marked out of 100 and scaled)  
**Group Size:** 6 Students  
**Duration:** 8 Weeks

---

## 1. Assignment Overview

Students must design and develop a Full Stack Mobile Application using:

- **Frontend:** React Native
- **Backend:** Node.js + Express.js
- **Database:** MongoDB

The system must be deployed to any hosting platform (AWS, Render, Railway, DigitalOcean, etc.).

Students may choose any system title/domain, but **approval is required**.

---

## 2. Core System Requirements (Mandatory)

Every group project MUST include:

### 1. User Authentication

- User Registration
- Login
- Password hashing
- JWT-based authentication
- Protected routes

### 2. Hosting Requirement

- Backend must be hosted online
- Mobile app must connect to hosted API
- Live demo must show deployed version
- *(Localhost demo not allowed for final evaluation)*

---

## 3. Workload Distribution (Equal for 6 Members)

Each member MUST handle a clearly defined module.

### Group – Authentication

Responsible for:

- User registration API
- Login API
- Password hashing
- JWT-based authentication

### Each Member – Core Entity CRUD

Responsible for:

- Full CRUD backend for main entity
- File upload
- Mobile UI front end
- API routes
- Controllers
- Integration with database
- Testing

> **Example:** Product Management (add/remove/update/delete products) or Task Management / Appointment Management System / User Management

---

## 4. Technical Requirements

### Backend Requirements

- RESTful APIs
- Proper folder structure
- Middleware usage
- Error handling
- Status codes

### 5. Mobile Requirements

- Proper navigation
- Functional components & hooks
- Clean UI
- Form validation
- API integration
- No hardcoded data

### Must Include (Documentation)

- Problem statement
- System architecture diagram
- Database schema diagram
- API endpoint table
- Team responsibility breakdown

---

## 6. Important Rules

- All 6 members must attend viva.
- If a student cannot explain their module → individual marks reduced.
- Plagiarism equals Zero marks.
- AI tools are allowed for learning support, not full system generation.
- No Firebase-only projects allowed (must use Node + MongoDB backend).

---

## 7. Example Project Ideas (Optional)

- Event Booking App
- Clinic Appointment System
- Food Ordering App
- Hostel Management App
- E-commerce Mobile App
- Fitness Tracking System

> You can use the same project that you are using for ITP project / ML&AI projects.

---

## Example Project: Hostel Management Mobile Application

*(React Native + Node.js + MongoDB + Hosted Backend)*

### Core System Overview

The system will allow:

- Students to register & login
- Admin to manage rooms
- Students to request rooms
- Admin to approve/reject bookings
- Image upload for room photos

---

### Main Entities

#### Entity 1: Room

*This is the primary entity*

**Fields:**

| Field | Details |
|---|---|
| `roomNumber` | Room identifier |
| `roomType` | Single / Double / Triple |
| `pricePerMonth` | Monthly rental price |
| `capacity` | Max occupants |
| `currentOccupancy` | Current occupant count |
| `description` | Room description |
| `image` | Room photo |
| `availabilityStatus` | Available / Occupied |

**CRUD Required:**

- Create Room (Admin)
- View Rooms (All users)
- Update Room (Admin)
- Delete Room (Admin)

---

#### Entity 2: Booking

*This links users to rooms.*

**Fields:**

| Field | Details |
|---|---|
| `userId` | Reference to User |
| `roomId` | Reference to Room |
| `bookingDate` | Date of booking |
| `startDate` | Move-in date |
| `endDate` | Move-out date |
| `status` | Pending / Approved / Rejected |

**CRUD Required:**

- Create booking request
- View booking history
- Update status (Admin approval)
- Cancel booking

---

### Student–Entity Assignment

| Student | Entity | Focus Area |
|---|---|---|
| Student 1 | Room | Room Management |
| Student 2 | Booking | Room Booking |
| Student 3 | Staff | Staff Management |
| Student 4 | Payment | Financial Management |
| Student 5 | Complaint | Maintenance System |
| Student 6 | Visitor | Security & Visitor Tracking |

---

### Member 1 – Entity 1 Lead (Room Management API)

**Responsible for:**

- Full CRUD for Room
  - Create room (Admin)
  - Get all rooms
  - Get single room
  - Update room
  - Delete room

**Business Logic:**

- Update availability status
- Adjust current occupancy

**Viva Focus:**

- Explain controller logic
- Explain route design
- Explain data validation

**Technical Responsibilities:**

- Navigation setup
- API integration
- Form validation
- State management
- Error message display

---

### Member 6 – Image Upload & Deployment Engineer

**Responsibilities:**

**Image Upload:**

- Upload room image (Multer)
- Validate file type & size
- Store in server/cloud
- Send image URL to frontend

**Deployment:**

- Deploy backend (AWS / Render / Railway)
- Configure environment variables
- Ensure MongoDB Atlas connection
- Test live API endpoints

**Viva Focus:**

- Explain deployment steps
- Explain environment config
- Explain image handling pipeline

---

## Individual Mark Sheet (Common for All 6 Members)

### A. Code / Technical Implementation – 40 Marks

*(Assessed from Git + System Testing + Module Ownership)*

| Student | Entity | Focus Area |
|---|---|---|
| Student 1 | Room | Room Management |
| Student 2 | Booking | Room Booking |
| Student 3 | Staff | Staff Management |
| Student 4 | Payment | Financial Management |
| Student 5 | Complaint | Maintenance System |
| Student 6 | Visitor | Security & Visitor Tracking |

---

### B. Individual Viva – 60 Marks

*(Each student questioned individually)*

| Criteria | Description | Marks |
|---|---|---|
| Explaining Own Module in Detail | Can explain logic, functions, flow clearly | 20 |
| Explain Integration with Other Modules | Understands how system connects | 10 |
| Backend & Database Concepts | Understands schema, routes, controllers | 10 |
| Mobile & API Interaction Logic | Understands request flow & UI behavior | 10 |
| Problem Solving & Debugging | Can answer "what if" and fix scenario questions | 10 |
| **Total** | | **60** |
