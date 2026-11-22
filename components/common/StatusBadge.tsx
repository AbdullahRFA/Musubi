import { Badge } from "@/components/ui/badge";
import type { PostStatus, RequestStatus, TransactionStatus } from "@/lib/types";

export function PostStatusBadge({ status }: { status: PostStatus }) {
  switch (status) {
    case "open":
      return <Badge variant="success">Open</Badge>;
    case "in_progress":
      return <Badge variant="secondary">In Progress</Badge>;
    case "completed":
      return <Badge variant="muted">Completed</Badge>;
    case "closed":
      return <Badge variant="destructive">Closed</Badge>;
  }
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  switch (status) {
    case "pending":
      return <Badge variant="outline" className="border-amber-400 bg-amber-50 text-amber-800">Pending</Badge>;
    case "accepted":
      return <Badge variant="success">Accepted</Badge>;
    case "completed":
      return <Badge variant="secondary">Completed</Badge>;
    case "rejected":
      return <Badge variant="destructive">Declined</Badge>;
    case "cancelled":
      return <Badge variant="muted">Cancelled</Badge>;
  }
}

export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  switch (status) {
    case "pending":
      return <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-300">Pending</Badge>;
    case "successful":
      return <Badge variant="success">Successful</Badge>;
    case "failed":
      return <Badge variant="destructive">Failed</Badge>;
  }
}
