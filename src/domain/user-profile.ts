export type UserProfile = {
  id: string;
  email: string;
  name: string;
  plan: "free" | "pro" | "team" | "student";
  level: "explorer" | "improver" | "refiner";
  profileImage: string;
  createdAt: string;
};
