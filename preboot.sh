set -a && source .env && set +a
node -e "console.log(Date.now())" > boot_stamp
curl -X POST "https://slack.com/api/chat.postMessage" \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
           "channel": "C07LEEB50KD",
           "text": "Zeon is booting up",
         }'
