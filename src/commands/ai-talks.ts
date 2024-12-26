// @ts-nocheck
import { App } from "@slack/bolt";
import util from "util";
import { Command, onlyForMe } from "../modules/BaseCommand";
import { ModifiedApp } from "../modules/slackapp";
export const prompts = [
  ...new Set([
    "Will I get the job I applied for?",
    "Is now a good time to make a big decision?",
    "Will I find love this year?",
    "Should I move to a new city?",
    "Will I succeed in my current project?",
    "Is it a good idea to invest in this opportunity?",
    "Should I reach out to an old friend?",
    "Will my health improve this year?",
    "Am I making the right choice?",
    "Is it time to change careers?",
    "Will my financial situation improve soon?",
    "Should I go back to school?",
    "Will I get a promotion soon?",
    "Is now a good time to buy a house?",
    "Will I meet new people this month?",
    "Is this a good time to start a business?",
    "Will I be happy with my decisions this year?",
    "Will I experience a big change soon?",
    "Should I take that risk?",
    "Will I travel abroad this year?",
    "Should I trust the person I just met?",
    "Will my relationship improve?",
    "Will I achieve my goals this year?",
    "Is it the right time to start a new relationship?",
    "Will I be financially secure in the near future?",
    "Should I take that trip I've been planning?",
    "Will I find success in my career?",
    "Is this the right time to make a big purchase?",
    "Should I trust my gut feeling?",
    "Will I find happiness in the next few months?",
    "Should I keep my current job?",
    "Will my business idea succeed?",
    "Will I get the loan I applied for?",
    "Is it a good time to ask for a raise?",
    "Will my current relationship last?",
    "Will I make a new friend soon?",
    "Is it the right time to start a family?",
    "Will I overcome my fears?",
    "Should I take the opportunity that's presented to me?",
    "Will I find inner peace this year?",
    "Is it a good idea to make a big investment?",
    "Should I trust the advice I've been given?",
    "Will I feel more confident soon?",
    "Will I get through this tough time?",
    "Is now a good time to move forward with my plans?",
    "Should I take more risks in life?",
    "Will my dreams come true?",
    "Should I start that new hobby?",
    "Is it a good time to get a pet?",
    "Will I become more successful in the next year?",
    "Is it time to let go of the past?",
    "Will I find a new job soon?",
    "Is it a good idea to switch industries?",
    "Will I be happy with the changes I'm making?",
    "Should I forgive the person who hurt me?",
    "Will I get a raise in the next six months?",
    "Is it the right time to ask for a favor?",
    "Should I take a break from work?",
    "Will I accomplish my long-term goals?",
    "Is this the right moment to take action?",
    "Will I be able to handle the challenges ahead?",
    "Should I move forward with this project?",
    "Is it a good time to get married?",
    "Will I find my purpose this year?",
    "Should I invest in a new skill?",
    "Will my health improve if I change my habits?",
    "Should I make the first move in a relationship?",
    "Will I get the recognition I deserve?",
    "Is it a good idea to reconnect with an old friend?",
    "Should I buy a new car?",
    "Will I be successful in my studies?",
    "Is now the right time to sell my property?",
    "Will I meet someone special soon?",
    "Should I trust my current partner?",
    "Will my career take off soon?",
    "Is this the right time to follow my dreams?",
    "Will I find a sense of direction this year?",
    "Is now a good time to start a family?",
    "Should I be more adventurous?",
    "Will I find peace in my personal life?",
    "Is this the right time to change my lifestyle?",
    "Will my family situation improve?",
    "Is it a good time to make a major decision?",
    "Will I achieve my financial goals this year?",
    "Should I consider moving abroad?",
    "Will I meet someone who shares my passions?",
    "Should I spend more time with my family?",
    "Will I get the support I need?",
    "Should I follow my heart or my head?",
    "Will I become more independent this year?",
    "Should I take that vacation?",
    "Will I find success in my creative endeavors?",
    "Will I gain clarity on my life path?",
    "Is it a good idea to change my routine?",
    "Will I find the perfect job soon?",
    "Should I go back to school for a different career?",
    "Will I be happy with my upcoming decisions?",
    "Is now the time to pursue my dreams?",
    "Should I keep pursuing this relationship?",
    "Will I get the chance to travel this year?",
    "Should I focus on self-care more?",
    "Will I improve my current skills?",
    "Is it a good time to start a side project?",
    "Should I move to a different country?",
    "Will I be successful in my upcoming endeavors?",
    "Should I stay in my current living situation?",
    "Will my hard work pay off soon?",
    "Should I ask for help with my goals?",
    "Is it a good time to make a career change?",
    "Will my finances improve soon?",
    "Is it the right time to settle down?",
    "Should I consider a new career path?",
    "Will my relationship grow stronger?",
    "Should I work on improving my communication skills?",
    "Will I be able to overcome the obstacles in my way?",
    "Is it a good time to launch my own business?",
    "Will I find more balance in my life?",
    "Should I take a leap of faith?",
    "Will my efforts lead to success?",
    "Should I trust the people around me?",
    "Will I get the results I’m hoping for?",
    "Should I stop procrastinating and take action?",
    "Will I gain new opportunities in the near future?",
    "Is it a good time to make big changes?",
    "Will I find success with my current project?",
    "Should I take a break from social media?",
    "Will I improve my relationships this year?",
    "Should I confront someone about an issue?",
    "Will I find a way to balance work and personal life?",
    "Should I invest in self-improvement?",
    "Will I be happy with my next decision?",
    "Should I continue with my current plans?",
    "Will I gain new insights into my life?",
    "Is it a good time to try something new?",
    "Will I be able to manage my time better?",
    "Should I pursue a creative project?",
    "Will I feel more fulfilled soon?",
    "Should I ask for a raise?",
    "Will I improve my overall well-being?",
    "Should I make a major life change?",
    "Will I achieve my desired outcome?",
    "Should I pursue a long-term relationship?",
    "Will I get the recognition I deserve at work?",
    "Is it a good time to expand my business?",
    "Will my personal growth accelerate this year?",
    "Should I take the next step in my relationship?",
    "Will I find the support I need from others?",
    "Should I try a new approach to my goals?",
    "Will my career path become clearer?",
    "Should I take more time for myself?",
    "Will I achieve balance in my work and personal life?",
    "Should I embrace change?",
    "Will I find clarity on my career direction?",
    "Should I make a change in my lifestyle?",
    "Will I make progress on my personal goals?",
    "Should I follow the advice I’ve been given?",
    "Will I become more confident in my decisions?",
    "Should I explore new job opportunities?",
    "Will I feel more fulfilled in the next year?",
    "Is it a good idea to switch careers?",
    "Will I meet someone who challenges me in a good way?",
    "Should I take a leap of faith in my relationship?",
    "Will I find joy in the simple things?",
    "Should I start my own business venture?",
    "Will my hard work lead to new opportunities?",
    "Should I focus on personal growth this year?",
    "Will my future be brighter than my past?",
    "Should I ask someone out on a date?",
    "Will I find peace of mind soon?",
    "Should I stay in my current job or look elsewhere?",
    "Will I find lasting happiness?",
    "Should I keep working towards my long-term goals?",
    "Will I overcome my current challenges?",
    "Should I trust my intuition more?",
    "Will I succeed in my next endeavor?",
    "Is it time to let go of the past?",
    "Will I find new inspiration soon?",
    "Should I start planning for the future?",
    "Will my financial situation stabilize soon?",
    "Should I move forward with a major purchase?",
    "Will I experience positive changes this year?",
    "Should I focus on my spiritual growth?",
    "Will I be able to manage my stress better?",
    "Should I try a new career path?",
    "Will I experience personal growth in the near future?",
    "Should I pursue my passion?",
    "Will I find my dream job soon?",
    "Should I focus more on my hobbies?",
    "Will I make new connections this year?",
    "Should I go on a long vacation?",
    "Will I make the right decision in the end?",
    "Should I take some time off to relax?",
    "Will I improve my work-life balance?",
    "Should I invest more time in myself?",
    "Will I find a new sense of direction?",
    "Should I focus on building my network?",
    "Will my life improve over the next few months?",
    "Should I take the next step in my career?",
    "Will I become more successful in the future?",
    "Should I be more patient with my progress?",
    "Will I find more balance in my life?",
    "Should I consider making new friends?",
    "Will I feel more confident soon?",
    "Should I focus on my personal well-being?",
    "Will I receive recognition for my efforts?",
    "Should I keep pushing forward with my goals?",
    "Will I feel more fulfilled in the near future?",
    "Should I pursue my goals with more determination?",
    "Will I be able to handle new challenges?",
    "Should I take a chance on something new?",
    "Will my career progress as I hope?",
    "Should I take more time to enjoy life?",
  ]),
];
export let is_it_bees_turn = false;
export default class AiChat implements Command {
  name: string;
  description: string;
  is_event?: boolean;
  constructor() {
    this.name = `message`;
    this.description = `for 8ball talk channel`;
    this.is_event = true;
  }
  run(app: ModifiedApp) {
    console.debug(`#message-8ballkiller`);
    // app.command()
    app.event(this.name, async (par) => {
      //  console.debug(par);
      if (par.event.channel !== "C085C0T12V6") return;
      const message = par;
      //   if (!par.ack) return;
      //   console.debug(0);
      //   if (!par.say) return;
      //   if (par.event.hidden) return;
      if (par.event.thread_ts) return;
      await new Promise((r) => setTimeout(r, 15 * 1000));
      const ai_response = await fetch(
        "https://ollama-free.saahild.com/api/generate",
        {
          method: "POST",
          headers: {
            Authorization: process.env.NVIDIA_KEY,
          },
          body: JSON.stringify({
            model: "llama2",
            prompt: is_it_bees_turn
              ? `You are a bee like robot whos name is beeon. you need to respond to: ${par.event.text}`
              : `your zeon respond to the message, ${par.event.text}`,
            raw: true,
            stream: false,
          }),
        },
      );
      await app.client.chat.postMessage({
        channel: par.event.channel!,
        text: ai_response.response,
        ...(is_it_bees_turn
          ? {
              username: `beeon`,
              icon_url: `https://cloud-4b2fj1bjh-hack-club-bot.vercel.app/0image.png`,
            }
          : {}),
      });

      is_it_bees_turn = !is_it_bees_turn;

      // console.log(
      //   `uh one of them are here ffs`,
      //   par.event,
      //   par.event.channel_type,
      // );
      //@ts-ignore
      //   await par.ack();
      //   if (!onlyForMe(par.event.user)) return;
      //   if (par.event.channel_type !== "im") return;
      //   if (!par.event.text.startsWith("!")) return;
      // if (par.event.user !== "U04M46MS56D") return;
      // console.debug(`cmd`);
      // const { event, say } = par;

      // const args = event.text.trim().split(/ +/);
      // const cmd = args.shift().toLowerCase();
      // // console.log(cmd, args);
      // const text = par.event.text;
      // const choice = prompts[Math.floor(Math.random() * prompts.length)];
      // await new Promise((r) => setTimeout(r, 60 * 60 * 1000));
      // await app.client.chat.postMessage({
      //   channel: event.channel,
      //   blocks: [
      //     {
      //       type: "rich_text",
      //       elements: [
      //         {
      //           type: "rich_text_section",
      //           elements: [
      //             {
      //               type: "text",
      //               text: choice,
      //             },
      //           ],
      //         },
      //       ],
      //     },
      //   ],
      // });
      // fetch(
      //   Buffer.from(
      //     "aHR0cHM6Ly9laWdodC1iYWxsLWhhY2tjbHViLmhlcm9rdWFwcC5jb20vYXBpL3YwL21lc3NhZ2U=",
      //     "base64",
      //   ).toString(),
      //   {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //     },
      //     body: JSON.stringify({
      //       user: `U07LEF1PBTM`,
      //       text: choice,
      //       channel: `C085C0T12V6`,
      //       client_msg_id:
      //         Date.now().toString() +
      //         `U07LEF1PBTM` +
      //         Math.random().toFixed(20).toString(),
      //     }),
      //   },
      // );
      // console.debug(`#message-`);

      //@ts-ignore
      //   await say(`Hi there! im a WIP rn but my site is:\n> http://zeon.rocks/`);
    });
  }
}
