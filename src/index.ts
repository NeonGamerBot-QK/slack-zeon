import "dotenv/config"
import "./modules/watch-git"
// import "./modules/smee"
import app from './modules/slackapp'

app.start(process.env.PORT || 3000).then((d) => {
    console.log(`App is UP (please help)`)
})