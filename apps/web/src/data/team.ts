export type TeamMember = {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  email?: string;
  links?: {
    github?: string;
    twitter?: string;
    homepage?: string;
  };
};

export const TEAM: TeamMember[] = [
  {
    id: "alice",
    name: "Alice Kim",
    role: "Founder",
    avatar: "https://avatars.githubusercontent.com/u/1?v=4",
    email: "alice@example.com",
    links: { github: "https://github.com/octocat" }
  },
  {
    id: "bob",
    name: "Bob Lee",
    role: "Engineer",
    avatar: "https://avatars.githubusercontent.com/u/2?v=4",
    email: "bob@example.com",
    links: { github: "https://github.com/vercel" }
  }
];
