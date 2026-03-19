# RUHC Production Test Results
Date: Thu Mar 12 13:59:49 UTC 2026

## 1. Health Check
```
{
  "status": "healthy",
  "timestamp": "2026-03-12T13:59:50.867Z",
  "service": "Redeemer's University Health Centre (RUHC) HMS",
  "version": "1.0.0"
}
```

## 2. Database Status
```
{
  "status": "connected",
  "message": "Database connected successfully",
  "environment": {
    "DATABASE_URL": true,
    "DIRECT_DATABASE_URL": true,
    "TURSO_DATABASE_URL": false,
    "TURSO_AUTH_TOKEN": false,
    "LIBSQL_URL": false,
    "NEXT_PHASE": "not set",
    "NODE_ENV": "production"
  },
  "databaseHost": "unknown",
  "timestamp": "2026-03-12T13:59:52.557Z"
}
```

## 3. SuperAdmin Login
```
{
  "success": true,
  "user": {
    "id": "super-admin-001",
    "email": "wabithetechnurse@ruhc",
    "name": "Wabi The Tech Nurse",
    "role": "SUPER_ADMIN",
    "department": "Administration",
    "initials": "WT",
    "isFirstLogin": false
  },
  "rememberToken": null,
  "mode": "database"
}
```
**Mode:** database

## 4. All Users
```
13
```

## 5. Role-Based Login Tests
### DOCTOR (testdoctor@ruhc)
```
{
  "success": true,
  "mode": "database",
  "user": {
    "name": "Test Doctor",
    "role": "DOCTOR"
  }
}
```
**Mode:** database

### NURSE (sarahnurse@ruhc)
```
{
  "success": true,
  "mode": "database",
  "user": {
    "name": "Sarah Nurse",
    "role": "NURSE"
  }
}
```
**Mode:** database

### PHARMACIST (chinedupharm@ruhc)
```
{
  "success": true,
  "mode": "database",
  "user": {
    "name": "Chinedu Pharm",
    "role": "PHARMACIST"
  }
}
```
**Mode:** database

### LAB_TECHNICIAN (adebayolab@ruhc)
```
{
  "success": true,
  "mode": "database",
  "user": {
    "name": "Adebayo Lab",
    "role": "LAB_TECHNICIAN"
  }
}
```
**Mode:** database

### MATRON (fatimamatron@ruhc)
```
{
  "success": true,
  "mode": "database",
  "user": {
    "name": "Fatima Matron",
    "role": "MATRON"
  }
}
```
**Mode:** database

### RECORDS_OFFICER (oluwaseunrecords@ruhc)
```
{
  "success": true,
  "mode": "database",
  "user": {
    "name": "Oluwaseun Records",
    "role": "RECORDS_OFFICER"
  }
}
```
**Mode:** database

### ADMIN (chukwuemekaadmin@ruhc)
```
{
  "success": true,
  "mode": "database",
  "user": {
    "name": "Chukwuemeka Admin",
    "role": "ADMIN"
  }
}
```
**Mode:** database

## 6. Routing Requests
```
2
```

## 7. Notifications
```
{
  "success": true,
  "notifications": [
    {
      "id": "notif-1773323476627-djbmexzu5",
      "userId": null,
      "targetRoles": "[\"ADMIN\",\"SUPER_ADMIN\"]",
      "type": "user_registration",
      "title": "New User Registration",
      "message": "A new user has registered and is awaiting approval",
      "data": null,
      "priority": "high",
      "read": false,
      "createdAt": "2026-03-12 13:51:16.627"
    }
  ],
  "unreadCount": "1"
}
```

