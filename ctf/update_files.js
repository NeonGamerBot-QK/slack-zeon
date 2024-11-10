require('dotenv').config()  
const StegCloak = require('stegcloak');
const fs = require('fs');
const path = require('path');
function getCloak(s = 2, e = 4) {
    return     Buffer.alloc(256).fill(eval(`0x${Math.random().toString().split('.')[1].slice(s,e)}`)).toString('base64')
}
const cloak = [
getCloak(),
getCloak(3,5),
getCloak(1,2),
getCloak(),
].join(' ')
const stegcloak = new StegCloak(true, false);  
function encrypt(str) {
return stegcloak.hide(str, process.env.CTF_PASSWORD, cloak)
}
function decrypt(str) {
return stegcloak.reveal(str, process.env.CTF_PASSWORD)
}
require('child_process').execSync('rm -rf notes && mkdir notes', { pwd: __dirname });
const files = fs.readdirSync(path.join(__dirname, 'unenc'));
files.forEach((file,i) => {
    console.log(`Encrypting ${file}`);
    const data = fs.readFileSync(path.join(__dirname, 'unenc', file)).toString();
    fs.writeFileSync(path.join(__dirname, 'notes', file), encrypt(data));
if(i == files.length - 1) {
    console.log('Done!');
    setTimeout(() => {
        process.exit(0);
    }, 150)
}
});

