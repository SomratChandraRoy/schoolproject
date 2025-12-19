@echo off
echo Installing frontend dependencies...
npm install
echo Installing additional dependencies for MedhaBangla...
npm install react-router-dom
npm install @tanstack/react-query
npm install axios
npm install tailwindcss postcss autoprefixer
npm install @headlessui/react
npm install react-icons
npx tailwindcss init -p
echo Installation complete!
pause