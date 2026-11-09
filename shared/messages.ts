export type MessageInput =
  | { type: "contact"; name: string; email: string; message: string }
  | { type: "trial"; name: string; email: string; phone: string; group: string; notes: string };

export type UserMessage = MessageInput & {
  id: string;
  createdAt: string;
  isRead: boolean;
};
