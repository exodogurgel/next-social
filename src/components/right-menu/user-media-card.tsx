import { prisma } from "@/lib/client";
import { User } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

export async function UserMediaCard({ user }: { user: User }) {
  const postsWithMedia = await prisma.post.findMany({
    where: {
      user_id: user.id,
      image: {
        not: null,
      },
    },
    take: 8,
    orderBy: {
      created_at: "desc",
    },
  });

  return (
    <div className="p-4 bg-white rounded-lg shadow-md text-sm flex flex-col gap-4">
      {/* TOP */}
      <div className="flex justify-between items-center font-medium">
        <span className="text-gray-500">User Media</span>
        <Link href="/" className="text-blue-500 text-xs">See all</Link>
      </div>
      {/* BOTTOM */}
      <div className="flex gap-4 justify-between flex-wrap">
        {postsWithMedia.length ? postsWithMedia.map((post) => {
          return (
            <div className="relative w-1/5 h-24" key={post.id}>
            <Image
              src={post.image!}
              alt=""
              fill
              className="object-cover rounded-md"
            />
          </div>
          )
        }) : "No media found"}
      </div>
    </div>
  )
}