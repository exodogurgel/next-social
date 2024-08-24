"use server"

import { auth } from "@clerk/nextjs/server"
import { prisma } from "./client"
import { z } from "zod"
import { revalidatePath } from "next/cache"

export async function switchFollow(userId: string) {
  const { userId: currentUserId } = auth()

  if (!currentUserId) {
    throw new Error("User is not authenticated!")
  }

  try {
    const existingFollow = await prisma.follower.findFirst({
      where: {
        follower_id: currentUserId,
        following_id: userId,
      }
    })

    if (existingFollow) {
      await prisma.follower.delete({
        where: {
          id: existingFollow.id
        }
      })
    } else {
      const existingFollowRequest = await prisma.followRequest.findFirst({
        where: {
          sender_id: currentUserId,
          receiver_id: userId,
        }
      })

      if (existingFollowRequest) {
        await prisma.followRequest.delete({
          where: {
            id: existingFollowRequest.id,
          }
        })
      } else {
        await prisma.followRequest.create({
          data: {
            sender_id: currentUserId,
            receiver_id: userId,
          }
        })
      }
    }
  } catch (error) {
    console.log(error)
    throw new Error("Something went wrong!")
  }
}

export async function switchBlock(userId: string) {
  const { userId: currentUserId } = auth();

  if (!currentUserId) {
    throw new Error("User is not Authenticated!!");
  }

  try {
    const existingBlock = await prisma.block.findFirst({
      where: {
        blocker_id: currentUserId,
        blocked_id: userId,
      },
    });

    if (existingBlock) {
      await prisma.block.delete({
        where: {
          id: existingBlock.id,
        },
      });
    } else {
      await prisma.block.create({
        data: {
          blocker_id: currentUserId,
          blocked_id: userId,
        },
      });
    }
  } catch (err) {
    console.log(err);
    throw new Error("Something went wrong!");
  }
};

export async function acceptFollowRequest(userId: string) {
  const { userId: currentUserId } = auth();

  if (!currentUserId) {
    throw new Error("User is not Authenticated!!");
  }

  try {
    const existingFollowRequest = await prisma.followRequest.findFirst({
      where: {
        sender_id: userId,
        receiver_id: currentUserId,
      },
    });

    if (existingFollowRequest) {
      await prisma.followRequest.delete({
        where: {
          id: existingFollowRequest.id,
        },
      });

      await prisma.follower.create({
        data: {
          follower_id: userId,
          following_id: currentUserId,
        },
      });
    }
  } catch (err) {
    console.log(err);
    throw new Error("Something went wrong!");
  }
};

export async function declineFollowRequest(userId: string) {
  const { userId: currentUserId } = auth();

  if (!currentUserId) {
    throw new Error("User is not Authenticated!!");
  }

  try {
    const existingFollowRequest = await prisma.followRequest.findFirst({
      where: {
        sender_id: userId,
        receiver_id: currentUserId,
      },
    });

    if (existingFollowRequest) {
      await prisma.followRequest.delete({
        where: {
          id: existingFollowRequest.id,
        },
      });
    }
  } catch (err) {
    console.log(err);
    throw new Error("Something went wrong!");
  }
};

export async function updateProfile(
  prevState: { success: boolean; error: boolean },
  payload: { formData: FormData; cover: string }
) {
  const { formData, cover } = payload;
  const fields = Object.fromEntries(formData);

  const filteredFields = Object.fromEntries(
    Object.entries(fields).filter(([_, value]) => value !== "")
  );

  const Profile = z.object({
    cover: z.string().optional(),
    name: z.string().max(60).optional(),
    surname: z.string().max(60).optional(),
    description: z.string().max(255).optional(),
    city: z.string().max(60).optional(),
    school: z.string().max(60).optional(),
    work: z.string().max(60).optional(),
    website: z.string().max(60).optional(),
  });

  const validatedFields = Profile.safeParse({ cover, ...filteredFields });

  if (!validatedFields.success) {
    console.log(validatedFields.error.flatten().fieldErrors);
    return { success: false, error: true };
  }

  const { userId } = auth();

  if (!userId) {
    return { success: false, error: true };
  }

  try {
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: validatedFields.data,
    });
    return { success: true, error: false };
  } catch (err) {
    console.log(err);
    return { success: false, error: true };
  }
};

export async function switchLike(postId: number) {
  const { userId } = auth();

  if (!userId) throw new Error("User is not authenticated!");

  try {
    const existingLike = await prisma.like.findFirst({
      where: {
        post_id: postId,
        user_id: userId,
      },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });
    } else {
      await prisma.like.create({
        data: {
          post_id: postId,
          user_id: userId,
        },
      });
    }
  } catch (err) {
    console.log(err);
    throw new Error("Something went wrong");
  }
};

export async function addComment(postId: number, description: string) {
  const { userId } = auth();

  if (!userId) throw new Error("User is not authenticated!");

  try {
    const createdComment = await prisma.comment.create({
      data: {
        description,
        user_id: userId,
        post_id: postId,
      },
      include: {
        user: true,
      },
    });

    return createdComment;
  } catch (err) {
    console.log(err);
    throw new Error("Something went wrong!");
  }
};

export async function addPost(formData: FormData, img: string) {
  const description = formData.get("description") as string;

  const Desc = z.string().min(1).max(255);

  const validatedDesc = Desc.safeParse(description);

  if (!validatedDesc.success) {
    //TODO
    console.log("description is not valid");
    return;
  }
  const { userId } = auth();

  if (!userId) throw new Error("User is not authenticated!");

  try {
    await prisma.post.create({
      data: {
        description: validatedDesc.data,
        user_id: userId,
        image: img,
      },
    });

    revalidatePath("/");
  } catch (err) {
    console.log(err);
  }
}

export async function addStory (img: string) {
  const { userId } = auth();

  if (!userId) throw new Error("User is not authenticated!");

  try {
    const existingStory = await prisma.story.findFirst({
      where: {
        user_id: userId,
      },
    });

    if (existingStory) {
      await prisma.story.delete({
        where: {
          id: existingStory.id,
        },
      });
    }
    const createdStory = await prisma.story.create({
      data: {
        user_id: userId,
        image: img,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      include: {
        user: true,
      },
    });

    return createdStory;
  } catch (err) {
    console.log(err);
  }
};

export const deletePost = async (postId: number) => {
  const { userId } = auth();

  if (!userId) throw new Error("User is not authenticated!");

  try {
    await prisma.post.delete({
      where: {
        id: postId,
        user_id: userId,
      },
    });
    revalidatePath("/")
  } catch (err) {
    console.log(err);
  }
};