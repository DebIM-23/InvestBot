#!/bin/bash

# Start Python FastAPI in background
cd /app/python
python3 -m uvicorn data_fetcher:app --host 0.0.0.0 --port 8000 &
PYTHON_PID=$!

# Wait a moment for Python to start
sleep 3

# Start Node.js API
cd /app
node init-db.js
node server.js

# If Node crashes, kill Python too
kill $PYTHON_PID
