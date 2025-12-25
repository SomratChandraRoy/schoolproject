@echo off
echo ====================================================================
echo MedhaBangla AI System Verification
echo ====================================================================
echo.

echo [1/4] Testing Multi-Key Rotation System...
python test_multi_key_rotation.py
if %ERRORLEVEL% NEQ 0 (
    echo FAILED: Multi-key rotation test failed
    pause
    exit /b 1
)
echo.

echo [2/4] Testing Question Generation...
python test_generate_question.py
if %ERRORLEVEL% NEQ 0 (
    echo FAILED: Question generation test failed
    pause
    exit /b 1
)
echo.

echo [3/4] Testing API Endpoint...
python test_api_endpoint.py
if %ERRORLEVEL% NEQ 0 (
    echo FAILED: API endpoint test failed
    pause
    exit /b 1
)
echo.

echo [4/4] Checking Django Configuration...
python manage.py check
if %ERRORLEVEL% NEQ 0 (
    echo FAILED: Django check failed
    pause
    exit /b 1
)
echo.

echo ====================================================================
echo ALL TESTS PASSED!
echo ====================================================================
echo.
echo Your AI system is fully operational and ready to use!
echo.
echo Next steps:
echo   1. Start backend: python manage.py runserver
echo   2. Start frontend: cd ../frontend/medhabangla ^&^& npm start
echo   3. Generate questions in Quiz Management page
echo.
echo ====================================================================
pause
