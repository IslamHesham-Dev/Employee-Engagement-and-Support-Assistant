# 🧪 HRHelpDesk Backend Testing Guide - Postman

## 📋 Setup Instructions

1. **Install Postman**: Download from https://www.postman.com/downloads/
2. **Base URL**: `http://localhost:3000`
3. **Server Status**: Backend must be running on port 3000

---

## 🔍 Test Cases

### 1. Health Check
**Purpose**: Verify server is running

**Request**:
- **Method**: `GET`
- **URL**: `http://localhost:3000/health`
- **Headers**: None required

**Expected Response**:
```json
{
    "status": "OK",
    "timestamp": "2024-12-18T07:30:45.123Z"
}
```

**Status Code**: `200 OK`

---

### 2. User Registration
**Purpose**: Create a new user account

**Request**:
- **Method**: `POST`
- **URL**: `http://localhost:3000/api/auth/register`
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
      "email": "john.doe@iscore.com",
      "password": "SecurePass123!",
      "firstName": "John",
      "lastName": "Doe",
      "employeeId": "EMP001",
      "role": "EMPLOYEE"
  }
  ```

**Expected Response**:
```json
{
    "message": "User created",
    "user": {
        "id": "clq1x2y3z4a5b6c7d8e9f0",
        "email": "john.doe@iscore.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "EMPLOYEE",
        "employeeId": "EMP001"
    }
}
```

**Status Code**: `201 Created`

---

### 3. User Login
**Purpose**: Authenticate user and get JWT token

**Request**:
- **Method**: `POST`
- **URL**: `http://localhost:3000/api/auth/login`
- **Headers**: 
  ```
  Content-Type: application/json
  ```
- **Body** (raw JSON):
  ```json
  {
      "email": "john.doe@iscore.com",
      "password": "SecurePass123!"
  }
  ```

**Expected Response**:
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
        "id": "clq1x2y3z4a5b6c7d8e9f0",
        "email": "john.doe@iscore.com",
        "firstName": "John",
        "lastName": "Doe",
        "role": "EMPLOYEE",
        "employeeId": "EMP001"
    }
}
```

**Status Code**: `200 OK`

---

## 🚨 Error Test Cases

### 4. Registration with Duplicate Email
**Request**:
- **Method**: `POST`
- **URL**: `http://localhost:3000/api/auth/register`
- **Body**: Same email as previous registration

**Expected Response**:
```json
{
    "error": "User with email already exists"
}
```

**Status Code**: `400 Bad Request`

---

### 5. Login with Invalid Credentials
**Request**:
- **Method**: `POST`
- **URL**: `http://localhost:3000/api/auth/login`
- **Body**:
  ```json
  {
      "email": "john.doe@iscore.com",
      "password": "WrongPassword"
  }
  ```

**Expected Response**:
```json
{
    "error": "Invalid credentials"
}
```

**Status Code**: `401 Unauthorized`

---

## 📝 Test Different User Roles

### 6. Create HR Manager
**Request**:
- **Method**: `POST`
- **URL**: `http://localhost:3000/api/auth/register`
- **Body**:
  ```json
  {
      "email": "hr.manager@iscore.com",
      "password": "HRPass123!",
      "firstName": "Sarah",
      "lastName": "Wilson",
      "employeeId": "HR001",
      "role": "HR_MANAGER"
  }
  ```

### 7. Create Admin User
**Request**:
- **Method**: `POST`
- **URL**: `http://localhost:3000/api/auth/register`
- **Body**:
  ```json
  {
      "email": "admin@iscore.com",
      "password": "AdminPass123!",
      "firstName": "System",
      "lastName": "Admin",
      "employeeId": "ADM001",
      "role": "ADMIN"
  }
  ```

---

## ✅ Quick Test Sequence

1. **Health Check** → Should return `200 OK`
2. **Register Employee** → Should return `201 Created`
3. **Login with Employee** → Should return `200 OK` with JWT token
4. **Register HR Manager** → Should return `201 Created`
5. **Register Admin** → Should return `201 Created`
6. **Try duplicate registration** → Should return `400 Bad Request`
7. **Try wrong password** → Should return `401 Unauthorized`

---

## 🔧 Troubleshooting

**Server not responding?**
- Check if backend server is running: `npm run dev` in `/backend` folder
- Verify Docker containers: `docker-compose ps` should show postgres and redis running

**Database errors?**
- Restart Docker: `docker-compose down && docker-compose up -d`
- Check database connection in `.env` file

**CORS errors?**
- Verify `CORS_ORIGIN` in `.env` matches your testing tool

---

## 📊 What Each Test Validates

- **Health Check**: Server connectivity
- **Registration**: Database write operations, password hashing
- **Login**: Database read operations, password verification, JWT generation
- **Error Cases**: Proper error handling and status codes
- **Role Creation**: Database schema validation for different user types


