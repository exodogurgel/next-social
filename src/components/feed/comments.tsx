import { prisma } from "@/lib/client";
import CommentList from "./comment-list";

export async function Comments({ postId }: { postId: number }) {

  const comments = await prisma.comment.findMany({
    where: {
      post_id: postId,
    },
    include: {
      user: true
    }
  })
  return (
    <div className="">
      {/* WRITE */}
      <CommentList comments={comments} postId={postId}/>
    </div>
  )
}