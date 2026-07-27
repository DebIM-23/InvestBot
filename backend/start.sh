#!/bin/bash
cd /app/python && python3 -m uvicorn data_fetcher:app --host 0.0.0.0 --port 8000 &
sleep 3
cd /app && node init-db.js && node server.js
