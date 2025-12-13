#!/bin/bash

BASE_URL="http://localhost:4004"

echo "1. Testing Unauthorized Access (Should Fail)..."
RESP=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/odata/v4/catalog/Products")
if [[ "$RESP" == "401" || "$RESP" == "403" ]]; then
  echo "✅ PASS: Products endpoint returned $RESP (Unauthorized)"
else
  echo "❌ FAIL: Products endpoint returned $RESP (Expected 401/403)"
fi

RESP2=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/odata/v4/catalog/SalesOrders")
if [[ "$RESP2" == "401" || "$RESP2" == "403" ]]; then
  echo "✅ PASS: SalesOrders endpoint returned $RESP2 (Unauthorized)"
else
  echo "❌ FAIL: SalesOrders endpoint returned $RESP2 (Expected 401/403)"
fi

echo "---------------------------------------------------"
echo "2. Authenticating as Admin..."
TOKEN_RESP=$(curl -s -X POST -H "Content-Type: application/json" -d '{"username":"admin", "password":"Admin.123"}' "$BASE_URL/auth/login")
TOKEN=$(echo $TOKEN_RESP | grep -o '"token":"[^"]*' | grep -o '[^"]*$')

if [[ -z "$TOKEN" ]]; then
  echo "❌ FAIL: Could not obtain token. Response: $TOKEN_RESP"
  exit 1
else
  echo "✅ PASS: Token obtained."
fi

echo "---------------------------------------------------"
echo "3. Testing Authorized Access (Should Succeed)..."
RESP3=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$BASE_URL/odata/v4/catalog/Products")

if [[ "$RESP3" == "200" ]]; then
  echo "✅ PASS: Authorized access returned 200"
else
  echo "❌ FAIL: Authorized access returned $RESP3 (Expected 200)"
fi
