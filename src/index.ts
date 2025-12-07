import { app } from './app.js';
import { env } from './config/env.js';
import { db } from './config/database.js';

const main = async (): Promise<void> => {
  try {
    await db.$connect();
    console.log('Database connected');

    app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
};

main();
