#!/bin/bash

# 의존성 설치
echo "Installing frontend dependencies..."
npm install

# 빌드 유효성 검증
echo "Building client for production check..."
npm run build

# 기존 Vite 포트 5173 프로세스 종료
echo "Checking and cleaning up port 5173..."
lsof -t -i:5173 | xargs kill -9 2>/dev/null || true

# 백그라운드로 개발 서버 가동
echo "Starting Vite development server in the background..."
nohup npm run dev > dev-server.log 2>&1 &

echo "hactto-client가 백그라운드로 성공적으로 실행되었습니다. (Port: 5173)"
