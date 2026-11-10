@echo off
echo ========================================================
echo       SheFlow - Women's Health ^& Companion Suite
echo             Spring Boot + React + MySQL
echo ========================================================
echo.

REM ---- Set JAVA_HOME if not already set ----
REM Adjust this path to match your local JDK 21 installation.
if not defined JAVA_HOME (
    echo [WARN] JAVA_HOME is not set. Trying default JDK path...
    set "JAVA_HOME=C:\Program Files\Java\jdk-21"
)
set "Path=%JAVA_HOME%\bin;%Path%"

echo [1/2] Starting React Frontend on http://localhost:3000 ...
start "SheFlow React Frontend" cmd /k "cd sheflow-web && npm run dev"

echo [2/2] Starting Spring Boot Backend on http://localhost:8080 ...
start "SheFlow Spring Boot Backend" cmd /k "cd backend && .\mvnw.cmd spring-boot:run"

echo.
echo ========================================================
echo SheFlow is launching!
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8080/api/v1
echo Database: MySQL (sheflow_db)
echo.
echo See .env.example and backend\src\main\resources\application.properties.example
echo for configuration instructions.
echo ========================================================
