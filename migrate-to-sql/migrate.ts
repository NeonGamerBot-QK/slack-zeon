import Keyv from 'keyv';
import KeyvPostgres from '@keyv/postgres';


// keyv.on('ready', () => {
//     console.log('ready')
// })
// // keyv.get('e').then(d => console.log(d)).catch(console.error);

const DB_NAME = process.argv.slice(2)[0]
if (!DB_NAME) {
    console.error("Please provide a database name as an argument.");
    process.exit(1);
}
const json_instance = require(`./data/${DB_NAME}.json`)
const keyv = new Keyv(new KeyvPostgres({ uri: process.env.PSQL_URL!, table: DB_NAME }));
keyv.on('error', console.error);
; (async () => {
    for (const [key, value] of Object.entries(json_instance)) {
        await keyv.set(key, value);
        console.log(`Migrated key: ${key}`);
    }
    console.log(`Migration complete`)
})()
