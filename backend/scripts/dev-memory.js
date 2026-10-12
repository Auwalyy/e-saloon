/**
 * Starts the API against an in-memory MongoDB preloaded with demo data.
 * Handy for demos and marking: nothing to install, nothing to configure.
 * All data is discarded when the process stops.
 *
 *   npm run dev:memory
 */
process.env.USE_MEMORY_DB = 'true';
require('../server');
