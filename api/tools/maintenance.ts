import { connectDb } from '../src/db.js';
import { loadConfig } from '../src/config.js';
import { createStorage } from '../src/media.js';
import { cleanupMedia } from '../src/media-cleanup.js';
const {db,client}=await connectDb(loadConfig());
try {const result=await cleanupMedia(db,createStorage(),new Date());console.log(result);if(result.failed)process.exitCode=1;}
finally{await client.close();}
