// re create it from scratch because :3
const OwnerPlusRepo = {
  owner: "Discord-Datamining",
  repo: "Discord-Datamining",
};
import { ModifiedApp } from "./slackapp";

export async function theDataFromDiscordIsMine(app: ModifiedApp) {
  const { Octokit } = await import("octokit");
  const db = app.dbs.ddm;
  // create octokit client
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN!,
  });
  const gh = octokit;
  async function sendCommit(commit: any) {
    console.debug(`#0`);
    await app.client.chat.postMessage({
      channel: "C080T3WUTK4",
      blocks: getBlocks(commit),
      text: `discord datamining update?`,
    });
  }
  function getCommitComments(commit_sha) {
    return octokit.rest.repos.listCommentsForCommit({
      ...OwnerPlusRepo,
      commit_sha,
    });
  }
  async function CommitHandler() {
    const commits = (await gh.rest.repos.listCommits(OwnerPlusRepo)).data;
    const commitsWithComments = commits.filter(
      (commit) => commit.commit.comment_count >= 1,
    );
    for (const commit of commitsWithComments.reverse()) {
      const buildNumber = parseBuildNumber(commit.commit.message);
      const comments = (await getCommitComments(commit.sha)).data;
      const commentsWithImages = comments.map((comment) => ({
        ...comment,
        images: parseMDImage(comment.body),
      }));
      const transformedComments = commentsWithImages.map((comment) => ({
        _id: comment.id,

        // what
        id: comment.id,
        title: commit.commit.message,
        buildNumber,
        timestamp: comment.created_at,
        url: comment.html_url,
        description: comment.body,
        user: {
          username: comment.user?.login,
          id: comment.user?.id,
          avatarURL: comment.user?.avatar_url,
          url: comment.user?.html_url,
        },
        images: comment.images,
      }));
      const [firstComment, ...subComments] = transformedComments;
      const foundCommit = await db.get(firstComment.id);
      if (!foundCommit) {
        console.log(`Needs to store: ${firstComment.buildNumber}`);
        try {
          const doc = await db.set(firstComment.id, {
            ...firstComment,
            comments: subComments,
          });
          console.log(
            `Stored Commit ${firstComment.id} for Build ${firstComment.buildNumber}`,
          );
          //   const servers = [
          //     {
          //       _id: "782677691689205790",
          //       channel: "1213339538563399720",
          //       lastSentComment:
          //         client.db.get("782677691689205790").lastSentComment,
          //       // role: ""
          //     },
          //   ]; // await Server.find();
          //   for (const server of servers) {
          await sendCommit(firstComment);
          //   }
        } catch (error) {
          console.error(
            `Error storing commit (${firstComment.id}) for build ${firstComment.buildNumber}`,
            error.stack,
          );
        }
      } else {
        console.log(
          `Need to store additional comments for ${foundCommit.buildNumber}`,
        );
        try {
          for (const comment of subComments) {
            if (foundCommit.id === comment.id) return;
            if (foundCommit.comments?.find((c) => c.id === comment.id)) return;
            // await foundCommit.update({
            // 	$push: { comments: comment },
            // });////////

            // const servers = await Server.find();
            // for (const server of servers) {
            //   await sendCommit($, comment, server);
            // }
          }
        } catch (error) {
          console.error(
            `Error updating commit (${foundCommit.id}) for build ${foundCommit.buildNumber}`,
            error.stack,
          );
        }
      }
    }
  }
  async function pushAllCommitsInDb() {
    const commits = await gh.paginate(gh.rest.repos.listCommits, {
      ...OwnerPlusRepo,
      per_page: 100,
      since: new Date("2024-01-01"),
    });
    const commitsWithComments = commits.filter(
      (commit) => commit.commit.comment_count >= 1,
    );
    for (const commit of commitsWithComments.reverse()) {
      const buildNumber = parseBuildNumber(commit.commit.message);
      const comments = (await getCommitComments(commit.sha)).data;
      const commentsWithImages = comments.map((comment) => ({
        ...comment,
        images: parseMDImage(comment.body),
      }));
      const transformedComments = commentsWithImages.map((comment) => ({
        _id: comment.id,
        id: comment.id,
        title: commit.commit.message,
        buildNumber,
        timestamp: comment.created_at,
        url: comment.html_url,
        description: comment.body,
        user: {
          username: comment.user?.login,
          id: comment.user?.id,
          avatarURL: comment.user?.avatar_url,
          url: comment.user?.html_url,
        },
        images: comment.images,
      }));
      const [firstComment, ...subComments] = transformedComments;
      const foundCommit = await db.get(firstComment.id);
      if (!foundCommit) {
        console.log(`Needs to store: ${firstComment.buildNumber}`);
        try {
          const doc = await db.set(firstComment.id, {
            ...firstComment,
            comments: subComments,
          });
        } catch (error) {
          console.error(
            `Error storing commit (${firstComment.id}) for build ${firstComment.buildNumber}`,
            error.stack,
          );
        }
      }
    }
  }
}
function parseMDImage(body) {
  //@ts-ignore
  const regex = /!\[[^\]]*\]\((?<filename>.*?)?\)/g;
  return [...body.matchAll(regex)].map((m) => m.groups.filename);
}
export function parseBuildNumber(title) {
  const regex = /Build ([0-9]*)/;
  const exec = regex.exec(title);
  return exec?.[1] ?? "";
}

function getBlocks(commit: any) {
  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "{title}".replace("{title}", commit.title.slice(0, 256)),
        emoji: true,
      },
    },
    {
      type: "divider",
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text:
            commit.description.length > 4091
              ? `${commit.description.substr(0, 4091)}…\n\`\`\``
              : commit.description,
        },
      ],
    },
    {
      type: "section",
      /// button link to commit
      text: {
        type: "mrkdwn",
        text: `View Commit: \n<${commit.url}|${commit.url}>`,
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "Discord Datamining Bot",
        },
      ],
    },
  ];
}
