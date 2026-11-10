# SheFlow — Women's Cycle & Health Companion

SheFlow is an intelligent women's menstrual health and wellness companion web application developed strictly using **Spring Boot 3**, **React**, and **MySQL**.

---

## 🌸 Architecture & Technology Stack

- **Backend**: **Spring Boot 3.2.5** (Java 21, Spring Data JPA, Spring Security, Lombok, JJWT)
- **Frontend**: **React 18** (Vite, Tailwind CSS, Lucide Icons, Canvas Confetti)
- **Database**: **MySQL 8** (`sheflow_db`)

---

## 🚀 Quick Start Guide

### 1. Configure Environment

Copy the backend configuration template and set your credentials:
```bash
cp backend/src/main/resources/application.properties.example \
   backend/src/main/resources/application.properties
```
Edit `application.properties` and set your MySQL password and a strong JWT secret,  
**or** set the environment variables listed in `.env.example`.

### 2. Database Setup (MySQL)
Ensure MySQL is running on `localhost:3306`, then run the schema and seed scripts:
```sql
mysql -u root -p < database/sheflow_schema.sql
mysql -u root -p < database/sheflow_seed.sql
```

### 3. Run Both Services via Script
Double-click `run_sheflow.bat` or execute in PowerShell:
```powershell
.\run_sheflow.bat
```

### 4. Run Services Individually

**Backend (Spring Boot)**:
```powershell
cd backend
.\mvnw.cmd spring-boot:run
```
Backend runs at: `http://localhost:8080/api/v1`

**Frontend (React)**:
```powershell
cd sheflow-web
npm run dev
```
Frontend runs at: `http://localhost:3000`

---

## 🔑 Demo Account
A seed account is created by `database/sheflow_seed.sql`.
Check that file for the demo email/password, or register a new account via the Sign Up page.

---

## 📱 Application Flow & Features

1. **Landing Page (`/`)**:
   - Modern brand navigation (`Home`, `Features`, `Meet Flora`, `Emergency`, `Login`, `Get Started`).
   - Integrated Flora animated mascot video player (`flora-mascot.mp4`).
   - Core feature cards and interactive dashboard preview.
2. **Authentication Flow**:
   - **Sign Up (`/signup`)**: Validates regex password strength (`^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$`), email uniqueness, and confirm password matching.
   - **Login (`/login`)**: Authenticates via Spring Boot `/api/v1/auth/login`, sets JWT session tokens, includes one-click demo fill shortcut.
   - **Password Recovery (`/forgot-password`)**: 3-step OTP recovery flow (`/auth/forgot-password` → `/auth/verify-otp` → `/auth/reset-password`).
3. **Dashboard Suite (`/dashboard`)**:
   - **Overview (`/dashboard`)**: Recreates `media_1793946580274_30e358f0.jpg` with Cycle Day 14 Ovulation Phase card, interactive Water Intake gauge (5/8 glasses, 62%), July 2026 calendar with phase color dots, Today's Summary, Quick Actions, and Recent Activity.
   - **Flora AI Chatbot (`/dashboard/flora`)**: Recreates `media_1793946588855_4b244a43.jpg` with conversational AI stream, Suggested Questions chips, Urgent help shortcuts, Health Summary, and Recommendations.
   - **Products (`/dashboard/products`)**: Price comparison for Nua, Sirona, Pee Safe, Meftal Spas sorted cheapest first.
   - **Washrooms (`/dashboard/washrooms`)**: Clean washroom and pad vending machine locator with filters.
   - **Profile (`/dashboard/profile`)**: Health settings, cycle lengths, and preferences.
   - **Emergency Modal**: Hardcoded offline national helplines (Women Helpline 1091, National Emergency 112, Ambulance 102).
   - **Daily Log Modal**: Interactive logging for symptoms, mood (1-5 intensity), hydration, and medication.
   - **Logout**: Clears session tokens and redirects securely to Landing Page.
