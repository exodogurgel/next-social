import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/client";
import { Post } from "./post";

export async function Feed ({ username }: { username?: string }) {
  const { userId } = auth();

  let posts:any[] =[];

  if (username) {
    posts = await prisma.post.findMany({
      where: {
        user: {
          username: username,
        },
      },
      include: {
        user: true,
        likes: {
          select: {
            user_id: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });
  }

  if (!username && userId) {
    const following = await prisma.follower.findMany({
      where: {
        follower_id: userId,
      },
      select: {
        following_id: true,
      },
    });

    const followingIds = following.map((f) => f.following_id);
    const ids = [userId,...followingIds]

    posts = await prisma.post.findMany({
      where: {
        user_id: {
          in: ids,
        },
      },
      include: {
        user: true,
        likes: {
          select: {
            user_id: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });
  }
  return (
    <div className="p-4 bg-white shadow-md rounded-lg flex flex-col gap-12">
      {posts.length ? (posts.map(post=>(
        <Post key={post.id} post={post}/>
      ))) : "No posts found!"}
    </div>
  );
};

export default Feed;