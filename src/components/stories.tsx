import { prisma } from "@/lib/client";
import { auth } from "@clerk/nextjs/server";
import { StoryList } from "./story-list";

export async function Stories() {
  const { userId: currentUserId } = auth();

  if (!currentUserId) return null;

  const stories = await prisma.story.findMany({
    where: {
      expires_at: {
        gt: new Date(),
      },
      OR: [
        {
          user: {
            followers: {
              some: {
                follower_id: currentUserId,
              },
            },
          },
        },
        {
          user_id: currentUserId,
        },
      ],
    },
    include: {
      user: true,
    },
  });
  return (
    <div className="p-4 bg-white rounded-lg shadow-md overflow-scroll text-xs scrollbar-hide">
      <div className="flex gap-8 w-max">
        <StoryList stories={stories} userId={currentUserId}/>
      </div>
    </div>
  );
}