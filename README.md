# 🌟 Finderr (Backend) — Freelance Marketplace API

Welcome to the Backend of Finderr — a Fiverr-inspired freelance marketplace web application.
This project was built using Node.js + Express + MongoDB as part of a full-stack web development course.

---

## ✨ Features

* RESTful API for all frontend functionality:

  * User Authentication (Signup, Login, Logout)
  * Manage Gigs (CRUD)
  * Manage Orders
  * Reviews System
  * User Profile Management
  * Categories and Tags Management

---

## 🚰 Technologies Used

* Node.js
* Express.js
* MongoDB + Mongoose
* JWT Authentication
* dotenv
* CORS

---

## 📁 Project Structure

```
Finderr-Backend/
├── api/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
├── config/
├── middlewares/
├── server.js
├── package.json
└── .env.example
```

---

## 🚀 Getting Started

### Prerequisites

* Node.js (v18+ recommended)
* MongoDB (Local or Atlas)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/OrAntebi/Finderr-Backend.git
   cd Finderr-Backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:

   ```env
   MONGO_URL=mongodb+srv://<username>:<password>@cluster-url/dbname
   JWT_SECRET=yourSecretKey
   PORT=3030
   ```

4. Run the server:

   ```bash
   npm run dev
   ```

---

## 📬 API Base URL

```
http://localhost:3030/api
```

---

## 👥 Team

* [Or Antebi](https://www.linkedin.com/in/orantebi/)
* [Shay Isso](https://www.linkedin.com/in/shayisso/)
* [Farhan Ganayim](https://www.linkedin.com/in/farhan-ganayim-4b1647173/)
