import 'dotenv/config';
import { PORT, JWT_SECRET } from './config.constants';

if (!JWT_SECRET) {
  console.error('Missing JWT_SECRET in .env');
  process.exit(1);
}

import app from './app';

app.listen(PORT, () => {
  console.log(`Auth server running on http://localhost:${PORT}`);
});
