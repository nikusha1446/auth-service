import { app } from './app.js';
import { env } from './config/env.js';

const main = (): void => {
  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
};

main();
