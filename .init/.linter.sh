#!/bin/bash
cd /home/kavia/workspace/code-generation/smart-notes-335902-335923/notes_app_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

