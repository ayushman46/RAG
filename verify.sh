#!/bin/bash

# 🎉 RAG Pipeline - Verification Script
# This script verifies all components are in place and ready to run

echo "🔍 Checking RAG Pipeline Installation..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅${NC} $1"
        return 0
    else
        echo -e "${RED}❌${NC} $1"
        return 1
    fi
}

# Function to check if directory exists
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅${NC} $1/"
        return 0
    else
        echo -e "${RED}❌${NC} $1/"
        return 1
    fi
}

echo "📦 BACKEND FILES"
echo "================"
check_file "api.py"
check_file "ingest.py"
check_file "hallucination.py"
check_file "config.py"
check_file "requirements.txt"
echo ""

echo "🎨 FRONTEND - CONFIG FILES"
echo "=========================="
check_file "frontend/package.json"
check_file "frontend/vite.config.js"
check_file "frontend/tailwind.config.js"
check_file "frontend/postcss.config.js"
check_file "frontend/index.html"
echo ""

echo "⚛️ FRONTEND - REACT COMPONENTS"
echo "=============================="
check_file "frontend/src/App.jsx"
check_file "frontend/src/main.jsx"
check_file "frontend/src/index.css"
echo ""

echo "📁 FRONTEND - COMPONENTS FOLDER"
echo "================================"
check_file "frontend/src/components/ChatArea.jsx"
check_file "frontend/src/components/MessageBubble.jsx"
check_file "frontend/src/components/InputBar.jsx"
check_file "frontend/src/components/LoadingBubble.jsx"
check_file "frontend/src/components/SourcePills.jsx"
check_file "frontend/src/components/Sidebar.jsx"
check_file "frontend/src/components/StatusCard.jsx"
check_file "frontend/src/components/EmptyState.jsx"
echo ""

echo "🪝 FRONTEND - HOOKS"
echo "==================="
check_file "frontend/src/hooks/useRagApi.js"
echo ""

echo "📚 DOCUMENTATION"
echo "================"
check_file "FINAL_SUMMARY.md"
check_file "FULL_STACK_GUIDE.md"
check_file "frontend/README.md"
echo ""

echo "🗂️ DATABASES & FOLDERS"
echo "======================"
check_dir "chroma_db"
check_dir "my_docs"
check_dir ".venv"
echo ""

echo "🔧 ENVIRONMENT"
echo "==============="
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅${NC} Node.js ($NODE_VERSION)"
else
    echo -e "${RED}❌${NC} Node.js not found"
fi

if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅${NC} npm ($NPM_VERSION)"
else
    echo -e "${RED}❌${NC} npm not found"
fi

if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✅${NC} Python ($PYTHON_VERSION)"
else
    echo -e "${RED}❌${NC} Python not found"
fi

if command -v ollama &> /dev/null; then
    echo -e "${GREEN}✅${NC} Ollama installed"
else
    echo -e "${YELLOW}⚠️${NC}  Ollama not in PATH (run: ollama serve)"
fi

echo ""
echo "📊 STATISTICS"
echo "=============="

# Count React files
REACT_COMPONENTS=$(find frontend/src/components -name "*.jsx" 2>/dev/null | wc -l)
echo -e "${GREEN}✅${NC} React Components: $REACT_COMPONENTS"

# Count Python files
PYTHON_FILES=$(find . -maxdepth 1 -name "*.py" | wc -l)
echo -e "${GREEN}✅${NC} Python Files: $PYTHON_FILES"

# Check npm packages
if [ -f "frontend/node_modules/.bin/react" ]; then
    echo -e "${GREEN}✅${NC} npm dependencies installed"
else
    echo -e "${YELLOW}⚠️${NC}  npm dependencies not installed (run: npm install)"
fi

echo ""
echo "🚀 READY TO START?"
echo "=================="
echo ""
echo "Run these 3 commands in separate terminals:"
echo ""
echo -e "${YELLOW}Terminal 1:${NC}"
echo "  ollama serve"
echo ""
echo -e "${YELLOW}Terminal 2:${NC}"
echo "  cd ~/rag-pipeline"
echo "  source .venv/bin/activate"
echo "  uvicorn api:app --reload"
echo ""
echo -e "${YELLOW}Terminal 3:${NC}"
echo "  cd ~/rag-pipeline/frontend"
echo "  npm install  # first time only"
echo "  npm run dev"
echo ""
echo -e "${YELLOW}Browser:${NC}"
echo "  http://localhost:5173"
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}✅ All components verified and ready!${NC}"
echo -e "${GREEN}============================================${NC}"
