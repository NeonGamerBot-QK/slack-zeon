import { Cron } from "croner";
import { ModifiedApp } from "./slackapp";
export interface SevenTimeline {
  success: boolean;
  posts: Post[];
  hasMore: boolean;
  totalCount: number;
}

export interface Post {
  id: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  imageUrl?: string;
  author: Author;
  likes: Like[];
  replies: (Reply | Replies2 | Replies3)[];
  hasLiked: boolean;
  likeCount: number;
}

export interface Replies3 {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: Author;
  likes: any[];
  hasLiked: boolean;
  likeCount: number;
}

export interface Replies2 {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: Author;
  likes: Like2[];
  hasLiked: boolean;
  likeCount: number;
}

export interface Reply {
  id: string;
  content: string;
  postId: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author: Author;
  likes: Like2[];
  hasLiked: boolean;
  likeCount: number;
}

export interface Like2 {
  id: string;
  postId?: any;
  replyId: string;
  userId: string;
  createdAt: string;
}

export interface Like {
  id: string;
  postId: string;
  replyId?: any;
  userId: string;
  createdAt: string;
}

export interface Author {
  id: string;
  username: string;
  avatar: Avatar;
}

export interface Avatar {
  bg: string;
  animal: string;
}
export function setupSeverCron(app: ModifiedApp) {
  new Cron("39-59 19-22 * * *", async () => {
    try {
      const data = await fetch("https://www.seven39.com/timeline", {
        method: "POST",
        headers: {
          accept: "text/x-component",
          "accept-language": "en-US,en;q=0.9",
          "content-type": "text/plain;charset=UTF-8",
          "next-action": "60b606c160f5b7d21bf51d88e469c19a14de9f9bbf",
          cookie: process.env.SEVEN39_TOKEN,
          "next-router-state-tree":
            "%5B%22%22%2C%7B%22children%22%3A%5B%22timeline%22%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2C%22%2Ftimeline%22%2C%22refresh%22%5D%7D%5D%7D%2Cnull%2Cnull%2Ctrue%5D",
        },
        body: "[]",
      }).then((r) => r.text());
      if (!data.includes(":1")) return;
      const dataa = JSON.parse(data.split("\n1:")[1]) as SevenTimeline;
      //  writeFileSync('data.json', JSON.stringify(dataa, null, 2))
      for (const post of dataa.posts) {
        await new Promise((r) => setTimeout(r, 10));
        if (app.dbs.seven39.get(post.id)) continue;
        const str = `${post.content}${post.imageUrl ? "\n" + post.imageUrl : ""}\nLikes: ${post.likeCount} - Author: ${post.author.username} - ${post.replies.length} - Created at: ${post.createdAt}`;
        await app.client.chat.postMessage({
          text: str,
          channel: `C08H3KGF27Q`,
        });
        // post.content)
        // console.log(`Likes: ${post.likeCount} - Author: ${post.author.username} - ${post.replies.length}`)
        app.dbs.seven39.set(post.id, true);
        await new Promise((r) => setTimeout(r, 100));
      }
    } catch (e) {
      console.error(e, "cookie ded");
    }
  });
}
