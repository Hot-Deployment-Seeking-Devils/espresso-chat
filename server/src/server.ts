import path from 'path';
import dotenv from 'dotenv';

import { connectDB } from './config/database';
import { createChatServer } from './chatServer';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// connect to mongodb
connectDB();

const PORT = Number(process.env.PORT) || 3002;

const { httpServer } = createChatServer({ portLabel: PORT });

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
