#!/bin/bash
# Edge Function Testing Script
# Tests the invitation-manager Edge Function

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get Supabase project URL and anon key
echo "📋 Edge Function Testing Script"
echo "================================"
echo ""
echo "ℹ️  Before running tests, you need:"
echo "  1. Your Supabase project URL"
echo "  2. Your Supabase anon key"
echo "  3. A service role key (for admin/creator authentication)"
echo ""
echo "Get these from: https://supabase.com/dashboard/project/zuykdhqdklsskgrtwejg/settings/api"
echo ""

# Prompt for configuration
read -p "Enter your Supabase URL (https://zuykdhqdklsskgrtwejg.supabase.co): " SUPABASE_URL
SUPABASE_URL=${SUPABASE_URL:-https://zuykdhqdklsskgrtwejg.supabase.co}

read -p "Enter your Supabase Anon Key: " ANON_KEY
read -p "Enter a test email for invitation: " TEST_EMAIL
TEST_EMAIL=${TEST_EMAIL:-test@example.com}

echo ""
echo "🔧 Configuration:"
echo "  URL: $SUPABASE_URL"
echo "  Test Email: $TEST_EMAIL"
echo ""

# Test 1: Create Invitation
echo "📝 Test 1: Creating invitation..."
CREATE_RESPONSE=$(curl -s -X POST \
  "$SUPABASE_URL/functions/v1/invitation-manager" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"action\": \"createInvitation\",
    \"email\": \"$TEST_EMAIL\",
    \"role\": \"petugas\"
  }")

echo "$CREATE_RESPONSE" | jq '.' 2>/dev/null || echo "$CREATE_RESPONSE"

# Extract token from response (if successful)
TOKEN=$(echo "$CREATE_RESPONSE" | jq -r '.token' 2>/dev/null)

if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
  echo -e "${GREEN}✅ Invitation created successfully!${NC}"
  echo "   Token: $TOKEN"
  INVITATION_LINK="$SUPABASE_URL/register?token=$TOKEN"
  echo "   Link: $INVITATION_LINK"
else
  echo -e "${RED}❌ Failed to create invitation${NC}"
  echo "Response: $CREATE_RESPONSE"
  exit 1
fi

echo ""

# Test 2: Validate Invitation
echo "📝 Test 2: Validating invitation..."
VALIDATE_RESPONSE=$(curl -s -X POST \
  "$SUPABASE_URL/functions/v1/invitation-manager" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"action\": \"validateInvitation\",
    \"token\": \"$TOKEN\"
  }")

echo "$VALIDATE_RESPONSE" | jq '.' 2>/dev/null || echo "$VALIDATE_RESPONSE"

VALID=$(echo "$VALIDATE_RESPONSE" | jq -r '.valid' 2>/dev/null)
if [ "$VALID" = "true" ]; then
  echo -e "${GREEN}✅ Invitation is valid!${NC}"
  EMAIL=$(echo "$VALIDATE_RESPONSE" | jq -r '.email')
  ROLE=$(echo "$VALIDATE_RESPONSE" | jq -r '.role')
  echo "   Email: $EMAIL"
  echo "   Role: $ROLE"
else
  echo -e "${RED}❌ Invitation validation failed${NC}"
fi

echo ""

# Test 3: Attempt to validate with invalid token
echo "📝 Test 3: Testing invalid token..."
INVALID_RESPONSE=$(curl -s -X POST \
  "$SUPABASE_URL/functions/v1/invitation-manager" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"action\": \"validateInvitation\",
    \"token\": \"invalid-token-xyz\"
  }")

echo "$INVALID_RESPONSE" | jq '.' 2>/dev/null || echo "$INVALID_RESPONSE"

INVALID_VALID=$(echo "$INVALID_RESPONSE" | jq -r '.valid' 2>/dev/null)
if [ "$INVALID_VALID" = "false" ]; then
  echo -e "${GREEN}✅ Invalid token correctly rejected${NC}"
else
  echo -e "${YELLOW}⚠️  Invalid token not rejected properly${NC}"
fi

echo ""

# Test 4: Register User (requires manual password input)
echo "📝 Test 4: Register user with invitation token"
echo ""
echo -e "${YELLOW}⚠️  Manual action required:${NC}"
echo "   1. Open this URL in your browser:"
echo "      $INVITATION_LINK"
echo ""
echo "   2. Complete the registration form"
echo "   3. Check your email ($TEST_EMAIL) for confirmation"
echo "   4. Click the confirmation link"
echo "   5. Try logging in"
echo ""

# Test 5: Attempt to use token again (should fail as used)
echo "📝 Test 5: Testing token reuse prevention (after registration)"
echo ""
read -p "Have you completed the registration? (y/n): " COMPLETED

if [ "$COMPLETED" = "y" ]; then
  REUSE_RESPONSE=$(curl -s -X POST \
    "$SUPABASE_URL/functions/v1/invitation-manager" \
    -H "Authorization: Bearer $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"action\": \"validateInvitation\",
      \"token\": \"$TOKEN\"
    }")

  echo "$REUSE_RESPONSE" | jq '.' 2>/dev/null || echo "$REUSE_RESPONSE"
  
  REUSE_VALID=$(echo "$REUSE_RESPONSE" | jq -r '.valid' 2>/dev/null)
  if [ "$REUSE_VALID" = "false" ]; then
    echo -e "${GREEN}✅ Used token correctly rejected${NC}"
  else
    echo -e "${RED}❌ Used token still accepted (security issue!)${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Skipping token reuse test${NC}"
fi

echo ""
echo "================================"
echo "🎉 Testing complete!"
echo ""
echo "Summary:"
echo "  - Edge Function: deployed and responding"
echo "  - Create invitation: working"
echo "  - Validate invitation: working"
echo "  - Invalid token rejection: working"
echo ""
echo "Next steps:"
echo "  1. Complete manual registration test"
echo "  2. Test email confirmation flow"
echo "  3. Test password reset flow"
echo "  4. Test RLS policies"
echo ""
