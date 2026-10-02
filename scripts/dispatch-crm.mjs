import {loadConfig} from '../server/config.mjs';
import {openDatabase} from '../server/database.mjs';
import {dispatchCRM} from '../integrations/crm.mjs';

loadConfig();
const DB = await openDatabase();
try { console.log(await dispatchCRM({DB},{url:process.env.CRM_WEBHOOK_URL,token:process.env.CRM_WEBHOOK_TOKEN})); }
finally { DB.close(); }
