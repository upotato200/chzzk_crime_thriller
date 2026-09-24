// Isolated local preview: no external AI calls, no Chzzk credentials, no public listener.
import {createApp,configuration} from '../profiler/server/index.js';
import {openDatabase} from '../profiler/server/db.js';
const config=configuration({PORT:'3000',PUBLIC_URL:'http://localhost:3000',ALLOW_DEV_LOGIN:'true',MOCK_AI:'true'});
const db=await openDatabase({url:'',filename:'data/preview.sqlite'});
const runtime=await createApp({config,db});
const server=runtime.app.listen(3000,'127.0.0.1',()=>console.log('Local preview: http://localhost:3000 (mock AI, localhost only)'));
const stop=()=>{server.close(()=>void runtime.close());server.closeAllConnections()};process.on('SIGINT',stop);process.on('SIGTERM',stop);
