#!/bin/bash
# Security audit script for xrayradar-js (npm dependency audit)
# Run from repo root: ./scripts/security_audit.sh

echo "========================================="
echo "Security Audit for xrayradar-js"
echo "========================================="
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

EXIT_CODE=0
REPORT_DIR="${HOME}/.xrayradar-js-security-reports"
mkdir -p "$REPORT_DIR"

# Ensure we're in repo root (has package.json and packages/)
if [ ! -f "package.json" ] || [ ! -d "packages" ]; then
    echo -e "${RED}Run this script from the xrayradar-js repo root.${NC}"
    exit 1
fi

# 1. npm audit (dependency vulnerabilities)
echo -e "${YELLOW}[1/1] Running npm audit...${NC}"
AUDIT_JSON="${REPORT_DIR}/npm-audit-xrayradar-js.json"
npm audit --json > "$AUDIT_JSON" 2>/dev/null || true

if [ ! -s "$AUDIT_JSON" ]; then
    echo -e "${RED}✗ npm audit failed (e.g. network or lockfile issue)${NC}"
    EXIT_CODE=1
elif command -v jq &>/dev/null; then
    CRITICAL=$(jq -r '(.metadata.vulnerabilities.critical // 0)' "$AUDIT_JSON")
    HIGH=$(jq -r '(.metadata.vulnerabilities.high // 0)' "$AUDIT_JSON")
    MODERATE=$(jq -r '(.metadata.vulnerabilities.moderate // 0)' "$AUDIT_JSON")
    LOW=$(jq -r '(.metadata.vulnerabilities.low // 0)' "$AUDIT_JSON")
    TOTAL=$((CRITICAL + HIGH + MODERATE + LOW))
    if [ "$TOTAL" -eq 0 ]; then
        echo -e "${GREEN}✓ npm audit completed – no known vulnerabilities${NC}"
        echo "  Report: $AUDIT_JSON"
    else
        echo -e "${RED}  Vulnerabilities: ${CRITICAL} critical, ${HIGH} high, ${MODERATE} moderate, ${LOW} low${NC}"
        echo "  Report: $AUDIT_JSON"
        EXIT_CODE=1
    fi
else
    # No jq: treat non-zero npm audit exit as vulns (we already ran and redirected)
    if npm audit &>/dev/null; then
        echo -e "${GREEN}✓ npm audit completed – no known vulnerabilities${NC}"
        echo "  Report: $AUDIT_JSON"
    else
        echo -e "${RED}  Vulnerabilities found (install 'jq' for summary)${NC}"
        echo "  Report: $AUDIT_JSON"
        EXIT_CODE=1
    fi
fi

echo ""
echo "========================================="
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}Security audit PASSED${NC}"
else
    echo -e "${YELLOW}Security audit completed with findings${NC}"
    echo "  Review: $AUDIT_JSON"
    echo "  Fix: npm audit fix (or npm audit fix --force with care)"
fi
echo "========================================="
echo ""
echo "Reports: $REPORT_DIR"
echo "  cat $AUDIT_JSON | jq"
echo ""

exit $EXIT_CODE
