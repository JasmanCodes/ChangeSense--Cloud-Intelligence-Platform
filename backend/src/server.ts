import dotenv from 'dotenv';
dotenv.config();

import { app } from './app.js';

const PORT = parseInt(process.env.PORT || '4000', 10);

const server = app.listen(PORT, () => {
  console.log(`[ChangeSense API] Server running on http://localhost:${PORT}`);
  console.log(`[ChangeSense API] Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('SIGTERM', () => {
  console.log('[ChangeSense API] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('[ChangeSense API] Closed all pending connections.');
    process.exit(0);
  });
});
