@echo off
echo Starting TimeLocus Backend (Spring Boot)...
start "Backend" cmd /c "cd timelocusbackend && .\mvnw spring-boot:run"

echo Starting TimeLocus Frontend (Next.js)...
start "Frontend" cmd /c "cd frontend && npm run dev"

echo All applications starting. You can now run 'ngrok http 3000' in a new terminal.
pause
