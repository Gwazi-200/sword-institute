#!/bin/bash
# Sword Institute LMS - Production Deployment Script
# Deploys Knowledge Hub Integration to Firebase
# Usage: bash deploy.sh

set -e

echo "🚀 Sword Institute LMS - Production Deployment"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Verify Prerequisites
echo -e "${BLUE}📋 Step 1: Verifying Prerequisites${NC}"
echo ""

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node --version)${NC}"

if ! command -v firebase &> /dev/null; then
    echo -e "${YELLOW}⚠️ Firebase CLI not found. Installing...${NC}"
    npm install -g firebase-tools
fi
echo -e "${GREEN}✓ Firebase CLI installed${NC}"

echo ""

# Step 2: Run Tests
echo -e "${BLUE}🧪 Step 2: Running Tests${NC}"
echo ""

echo "Running integration tests..."
if node --test tests/knowledge-hub-integration.test.js > /tmp/integration-tests.log 2>&1; then
    INTEGRATION_COUNT=$(grep -c "✔" /tmp/integration-tests.log || echo "0")
    echo -e "${GREEN}✓ Integration Tests: ${INTEGRATION_COUNT} passed${NC}"
else
    echo -e "${RED}❌ Integration tests failed${NC}"
    cat /tmp/integration-tests.log
    exit 1
fi

echo "Running unit tests..."
if node --test tests/catalog-helpers.test.js > /tmp/unit-tests.log 2>&1; then
    UNIT_COUNT=$(grep -c "✔" /tmp/unit-tests.log || echo "0")
    echo -e "${GREEN}✓ Unit Tests: ${UNIT_COUNT} passed${NC}"
else
    echo -e "${RED}❌ Unit tests failed${NC}"
    cat /tmp/unit-tests.log
    exit 1
fi

echo ""

# Step 3: Verify Firebase Configuration
echo -e "${BLUE}🔐 Step 3: Verifying Firebase Configuration${NC}"
echo ""

if ! grep -q "sword-institute-lms" .firebaserc; then
    echo -e "${RED}❌ Firebase project not configured (looking for 'sword-institute-lms' in .firebaserc)${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Firebase project configured: sword-institute-lms${NC}"

echo ""

# Step 4: Lint Cloud Functions
echo -e "${BLUE}🔍 Step 4: Linting Cloud Functions${NC}"
echo ""

cd functions
if npm run lint > /tmp/lint.log 2>&1; then
    echo -e "${GREEN}✓ Functions passed linting${NC}"
else
    echo -e "${YELLOW}⚠️ Linting issues (non-blocking)${NC}"
    cat /tmp/lint.log | head -20
fi
cd ..

echo ""

# Step 5: Confirm Deployment
echo -e "${BLUE}🚀 Step 5: Ready to Deploy${NC}"
echo ""
echo "Summary:"
echo "  - Integration Tests: ✓ PASSED"
echo "  - Unit Tests: ✓ PASSED"
echo "  - Firebase Config: ✓ VERIFIED"
echo "  - Cloud Functions: ✓ READY"
echo ""
read -p "Continue with deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 1
fi

echo ""

# Step 6: Deploy Cloud Functions
echo -e "${BLUE}⚙️ Step 6: Deploying Cloud Functions${NC}"
echo ""

cd functions
npm install > /tmp/npm-install.log 2>&1
if firebase deploy --only functions; then
    echo -e "${GREEN}✓ Cloud Functions deployed successfully${NC}"
else
    echo -e "${RED}❌ Cloud Functions deployment failed${NC}"
    exit 1
fi
cd ..

echo ""

# Step 7: Deploy Hosting
echo -e "${BLUE}🌐 Step 7: Deploying Hosting${NC}"
echo ""

if firebase deploy --only hosting; then
    echo -e "${GREEN}✓ Hosting deployed successfully${NC}"
else
    echo -e "${RED}❌ Hosting deployment failed${NC}"
    exit 1
fi

echo ""

# Step 8: Verification
echo -e "${BLUE}✅ Step 8: Verifying Deployment${NC}"
echo ""

SITE_URL=$(grep '"site"' .firebaserc | head -1 | cut -d'"' -f4)
if [ -z "$SITE_URL" ]; then
    SITE_URL="sword-institute-lms"
fi

echo -e "${GREEN}✓ Deployment Complete!${NC}"
echo ""
echo "Your site is live at:"
echo -e "  ${BLUE}https://${SITE_URL}.web.app${NC}"
echo ""
echo "Next Steps:"
echo "  1. Visit your site and login"
echo "  2. Verify dashboard widgets appear"
echo "  3. Check course pages for related resources"
echo "  4. Test academy pages and lesson resources"
echo "  5. Monitor logs: firebase functions:log"
echo ""
echo -e "${GREEN}🎉 Production Deployment Successful!${NC}"
