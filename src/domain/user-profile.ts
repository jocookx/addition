export type UserProfile = {
  id: string;
  email: string;
  name: string;
  plan: "free" | "pro" | "team" | "student";
  level: "explorer" | "improver" | "refiner";
  profileImage: string;
  phone: string;
  organisation: string;
  role: string;
  timezone: string;
  softwarePreferences: string[];
  primaryGoal: "" | "learn_rhino" | "learn_revit" | "learn_grasshopper" | "ai_digital_design" | "workshop_training" | "career_development";
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  subscriptionStatus: "inactive" | "active" | "trialing" | "past_due" | "cancelled" | "unpaid" | "payment_failed";
  billingInterval: "" | "monthly" | "yearly";
  createdAt: string;
};
