import { execSync } from "child_process"
import fs from "fs"

const splittedVideos = fs.readdirSync("assets/dice/splits")

for(const video of splittedVideos){
    console.log(`Removing bg from ${video}`)
    const cmd = `ts-node scripts/remove_bg.ts`
    console.log(cmd)
    execSync (cmd, { stdio: 'inherit', env: {
        ...process.env,
        VIDEO_FILE: `assets/dice/splits/${video}`,
        OUT_FILE: `assets/dice/splits/c/${video}`
    } })
}