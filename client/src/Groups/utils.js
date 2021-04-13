import emoji from "react-easy-emoji";

export const onlineIcon = emoji("🟢")

export function getUname(user_id, members) {
  return members[user_id]?.user?.display_name || "*system*"
}
