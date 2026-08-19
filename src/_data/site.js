export default {
  title: "David Wesst",
  navigationTitle: "david.wes.st",
  navigationLinks: [
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog/" },
    { name: "Talks", url: "/talks/" },
    { name: "Topics", url: "/topics/" },
    { name: "About", url: "/about/" },
  ],
  tagline: "Building and playing games, while sharing software development ideas from Winnipeg, Canada.",
  description: "The personal website of David Wesst.",
  url: "https://david.wes.st",
  featuredPost: null,
  recentPostCount: 9,
  socialLinks: [
    { name: "GitHub", url: "https://github.com/davidwesst", iconClass: "fa-brands fa-github" },
    { name: "LinkedIn", url: "https://ca.linkedin.com/in/davidwesst", iconClass: "fa-brands fa-linkedin" },
    { name: "Bluesky", url: "https://bsky.app/profile/davidwesst.bsky.social", iconClass: "fa-brands fa-bluesky" },
    { name: "YouTube", url: "https://youtube.com/davidwesst", iconClass: "fa-brands fa-youtube" },
  ],
  postTypes: {
    article: { label: "Article", archiveUrl: "/blog/articles/", iconClass: "fa-solid fa-newspaper", fallbackColor: "#0f766e" },
    gamelog: { label: "Gamelog", archiveUrl: "/blog/gamelogs/", iconClass: "fa-solid fa-gamepad", fallbackColor: "#7c3aed" },
    dungeonlog: { label: "Dungeonlog", archiveUrl: "/blog/dungeonlogs/", iconClass: "fa-solid fa-dungeon", fallbackColor: "#b45309" },
    talk: { label: "Talk", archiveUrl: "/talks/", iconClass: "fa-solid fa-person-chalkboard", fallbackColor: "#0369a1" },
  },
};
