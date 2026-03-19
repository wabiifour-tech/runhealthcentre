#!/bin/bash
BASE_URL="https://runhealthcentre.vercel.app"
LOG_FILE="/home/z/my-project/test_results.md"

echo "# RUHC Production Test Results" > $LOG_FILE
echo "Date: $(date)" >> $LOG_FILE
echo "" >> $LOG_FILE

# Test 1: Health Check
echo "## 1. Health Check" >> $LOG_FILE
echo "\`\`\`" >> $LOG_FILE
curl -s "$BASE_URL/api/health" | jq . >> $LOG_FILE
echo "\`\`\`" >> $LOG_FILE
echo "" >> $LOG_FILE

# Test 2: Database Status
echo "## 2. Database Status" >> $LOG_FILE
echo "\`\`\`" >> $LOG_FILE
curl -s "$BASE_URL/api/db-status" | jq . >> $LOG_FILE
echo "\`\`\`" >> $LOG_FILE
echo "" >> $LOG_FILE

# Test 3: SuperAdmin Login
echo "## 3. SuperAdmin Login" >> $LOG_FILE
SUPERADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "wabithetechnurse@ruhc", "password": "#Abolaji7977"}')
echo "\`\`\`" >> $LOG_FILE
echo "$SUPERADMIN_RESPONSE" | jq . >> $LOG_FILE
echo "\`\`\`" >> $LOG_FILE
SUPERADMIN_MODE=$(echo "$SUPERADMIN_RESPONSE" | jq -r '.mode // "unknown"')
echo "**Mode:** $SUPERADMIN_MODE" >> $LOG_FILE
echo "" >> $LOG_FILE

# Test 4: Get All Users
echo "## 4. All Users" >> $LOG_FILE
echo "\`\`\`" >> $LOG_FILE
curl -s -X PUT "$BASE_URL/api/auth/login" | jq '.users | length' >> $LOG_FILE
echo "\`\`\`" >> $LOG_FILE
echo "" >> $LOG_FILE

# Test 5: Test login for all roles
echo "## 5. Role-Based Login Tests" >> $LOG_FILE
ROLES=("testdoctor@ruhc:DOCTOR" "sarahnurse@ruhc:NURSE" "chinedupharm@ruhc:PHARMACIST" "adebayolab@ruhc:LAB_TECHNICIAN" "fatimamatron@ruhc:MATRON" "oluwaseunrecords@ruhc:RECORDS_OFFICER" "chukwuemekaadmin@ruhc:ADMIN")
for role_info in "${ROLES[@]}"; do
  IFS=':' read -r email role <<< "$role_info"
  echo "### $role ($email)" >> $LOG_FILE
  RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"${email}\", \"password\": \"TestPass123\"}")
  echo "\`\`\`" >> $LOG_FILE
  echo "$RESPONSE" | jq '{success, mode, user: {name: .user.name, role: .user.role}}' >> $LOG_FILE
  echo "\`\`\`" >> $LOG_FILE
  MODE=$(echo "$RESPONSE" | jq -r '.mode // "unknown"')
  echo "**Mode:** $MODE" >> $LOG_FILE
  echo "" >> $LOG_FILE
done

# Test 6: Routing Requests
echo "## 6. Routing Requests" >> $LOG_FILE
echo "\`\`\`" >> $LOG_FILE
curl -s "$BASE_URL/api/routing?userId=user_1773321803723_h2k73dr3p&userRole=DOCTOR" | jq '.requests | length' >> $LOG_FILE
echo "\`\`\`" >> $LOG_FILE
echo "" >> $LOG_FILE

# Test 7: Notifications
echo "## 7. Notifications" >> $LOG_FILE
echo "\`\`\`" >> $LOG_FILE
curl -s "$BASE_URL/api/notifications?userRole=SUPER_ADMIN" | jq . >> $LOG_FILE
echo "\`\`\`" >> $LOG_FILE
echo "" >> $LOG_FILE

echo "Test completed. Results saved to $LOG_FILE"
