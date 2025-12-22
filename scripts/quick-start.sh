#!/bin/bash

# Quick Start Script for MedhaBangla (Linux/Mac)
# This script helps you get the project running quickly

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "MedhaBangla - Quick Start"
echo "========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR] Node.js is not installed!${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}[OK] Node.js is installed${NC}"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}[ERROR] Python is not installed!${NC}"
    echo "Please install Python from https://python.org/"
    exit 1
fi
echo -e "${GREEN}[OK] Python is installed${NC}"

echo ""
echo "What would you like to do?"
echo "1. Install dependencies (first time setup)"
echo "2. Start frontend only"
echo "3. Start backend only"
echo "4. Start both frontend and backend"
echo "5. Reset and reinstall everything"
echo "6. Exit"
echo ""

read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        echo ""
        echo "========================================="
        echo "Installing Dependencies"
        echo "========================================="
        echo ""

        echo "[1/4] Installing frontend dependencies..."
        cd frontend/medhabangla
        npm install
        echo -e "${GREEN}[OK] Frontend dependencies installed${NC}"

        echo ""
        echo "[2/4] Creating frontend .env file..."
        if [ ! -f ".env" ]; then
            cp .env.example .env
            echo -e "${GREEN}[OK] Created .env file - Please edit it with your API keys${NC}"
        else
            echo -e "${GREEN}[OK] .env file already exists${NC}"
        fi

        cd ../..

        echo ""
        echo "[3/4] Installing backend dependencies..."
        cd backend
        if [ ! -d "venv" ]; then
            echo "Creating virtual environment..."
            python3 -m venv venv
        fi
        source venv/bin/activate
        pip install -r requirements.txt
        echo -e "${GREEN}[OK] Backend dependencies installed${NC}"

        echo ""
        echo "[4/4] Creating backend .env file..."
        if [ ! -f ".env" ]; then
            cp .env.example .env
            echo -e "${GREEN}[OK] Created .env file - Please edit it with your API keys${NC}"
        else
            echo -e "${GREEN}[OK] .env file already exists${NC}"
        fi

        echo ""
        echo "[4/4] Running database migrations..."
        python manage.py migrate
        echo -e "${GREEN}[OK] Database migrations complete${NC}"

        cd ..

        echo ""
        echo "========================================="
        echo "Installation Complete!"
        echo "========================================="
        echo ""
        echo "Next steps:"
        echo "1. Edit backend/.env with your API keys"
        echo "2. Edit frontend/medhabangla/.env with your API keys"
        echo "3. Run this script again and choose option 4 to start both servers"
        echo ""
        ;;

    2)
        echo ""
        echo "========================================="
        echo "Starting Frontend"
        echo "========================================="
        echo ""
        cd frontend/medhabangla
        echo "Starting Vite dev server..."
        echo "Frontend will be available at: http://localhost:5173"
        echo ""
        npm run dev
        ;;

    3)
        echo ""
        echo "========================================="
        echo "Starting Backend"
        echo "========================================="
        echo ""
        cd backend
        source venv/bin/activate
        echo "Starting Django dev server..."
        echo "Backend will be available at: http://localhost:8000"
        echo "Admin panel: http://localhost:8000/admin"
        echo ""
        python manage.py runserver
        ;;

    4)
        echo ""
        echo "========================================="
        echo "Starting Both Frontend and Backend"
        echo "========================================="
        echo ""
        
        # Start backend in background
        echo "Starting backend..."
        cd backend
        source venv/bin/activate
        python manage.py runserver > /dev/null 2>&1 &
        BACKEND_PID=$!
        cd ..
        
        sleep 3
        
        # Start frontend in background
        echo "Starting frontend..."
        cd frontend/medhabangla
        npm run dev > /dev/null 2>&1 &
        FRONTEND_PID=$!
        cd ../..
        
        echo ""
        echo "========================================="
        echo "Both servers are running!"
        echo "========================================="
        echo ""
        echo "Frontend: http://localhost:5173"
        echo "Backend: http://localhost:8000"
        echo "Admin: http://localhost:8000/admin"
        echo ""
        echo "Press Ctrl+C to stop both servers..."
        
        # Wait for Ctrl+C
        trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
        wait
        ;;

    5)
        echo ""
        echo "========================================="
        echo "Reset and Reinstall"
        echo "========================================="
        echo ""
        echo -e "${YELLOW}[WARNING] This will delete:${NC}"
        echo "- node_modules"
        echo "- venv"
        echo "- package-lock.json"
        echo "- All cached files"
        echo ""
        read -p "Are you sure? (y/n): " confirm
        
        if [ "$confirm" != "y" ]; then
            echo "Cancelled."
            exit 0
        fi

        echo ""
        echo "Cleaning frontend..."
        cd frontend/medhabangla
        rm -rf node_modules package-lock.json dist
        echo -e "${GREEN}[OK] Frontend cleaned${NC}"

        cd ../..

        echo ""
        echo "Cleaning backend..."
        cd backend
        rm -rf venv db.sqlite3
        echo -e "${GREEN}[OK] Backend cleaned${NC}"

        cd ..

        echo ""
        echo "Cleanup complete! Run option 1 to reinstall."
        ;;

    6)
        echo "Exiting..."
        exit 0
        ;;

    *)
        echo -e "${RED}Invalid choice!${NC}"
        exit 1
        ;;
esac

echo ""
echo "Thank you for using MedhaBangla!"
