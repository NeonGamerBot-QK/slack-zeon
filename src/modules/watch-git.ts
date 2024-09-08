import { exec } from "child_process"

const timer = setInterval(() => {
    exec (`git pull`, (error, stdout) => {
      let response = error?.stdout ? error?.stdout[0].toString() : stdout
      if (!error) {
        if (!response?.includes('Already up to date.')) {
          console.log(`New git stuff wowie`)
          console.log(response)
          setTimeout(() => {
            process.exit()
          }, 1000)
        }
      }
    })
  }, 15000)

  export const stop = ():void => clearInterval(timer)