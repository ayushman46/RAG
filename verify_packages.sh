#!/bin/bash
# 🔍 PACKAGE VERIFICATION SCRIPT

echo "📦 Verifying all required packages..."
echo ""

# Counter
TOTAL=0
INSTALLED=0

# Function to check package
check_package() {
    TOTAL=$((TOTAL + 1))
    local package=$1
    local import_name=$2
    
    if python3 -c "import $import_name" 2>/dev/null; then
        echo "✅ $package"
        INSTALLED=$((INSTALLED + 1))
    else
        echo "❌ $package"
    fi
}

echo "🔗 LANGCHAIN PACKAGES"
echo "===================="
check_package "langchain" "langchain"
check_package "langchain-community" "langchain_community"
check_package "langchain-core" "langchain_core"
check_package "langchain-text-splitters" "langchain_text_splitters"
check_package "langchain-ollama" "langchain_ollama"
echo ""

echo "💾 DATABASE"
echo "=========="
check_package "chromadb" "chromadb"
echo ""

echo "🌐 WEB FRAMEWORK"
echo "================"
check_package "fastapi" "fastapi"
check_package "uvicorn" "uvicorn"
echo ""

echo "📄 DOCUMENT PROCESSING"
echo "====================="
check_package "pypdf" "pypdf"
check_package "beautifulsoup4" "bs4"
echo ""

echo "📡 HTTP & DATA"
echo "=============="
check_package "requests" "requests"
check_package "pydantic" "pydantic"
echo ""

echo "🤖 LLM INTEGRATION"
echo "=================="
check_package "ollama" "ollama"
echo ""

echo "🧠 EMBEDDINGS"
echo "============="
check_package "sentence-transformers" "sentence_transformers"
echo ""

echo "🛠️ UTILITIES"
echo "============"
check_package "python-dotenv" "dotenv"
check_package "tqdm" "tqdm"
echo ""

echo "📊 SUMMARY"
echo "=========="
echo "Installed: $INSTALLED / $TOTAL"

if [ $INSTALLED -eq $TOTAL ]; then
    echo "✅ All packages installed!"
    exit 0
else
    MISSING=$((TOTAL - INSTALLED))
    echo "❌ $MISSING packages missing - run: pip install -r requirements.txt"
    exit 1
fi
