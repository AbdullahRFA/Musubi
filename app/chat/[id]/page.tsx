import { redirect } from "next/navigation";

/**
 * Legacy deep link: /chat/:id now opens the conversation inside the
 * responsive master-detail chat view at /chat?id=:id.
 */
export default function ChatRoomPage({ params }: { params: { id: string } }) {
  redirect(`/chat?id=${encodeURIComponent(params.id)}`);
}
