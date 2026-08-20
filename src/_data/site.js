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
  recentPostCount: 3,
  homeSections: [
    { type: "article", label: "Latest articles", url: "/blog/articles/" },
    { type: "gamelog", label: "Latest gamelogs", url: "/blog/gamelogs/" },
    { type: "talk", label: "Latest talks", url: "/talks/" },
  ],
  exploreLinks: [
    { label: "About", description: "Background, work, and current interests.", url: "/about/" },
    { label: "Projects", description: "Active and archived creative projects.", url: "/projects/" },
    { label: "Topics", description: "Browse writing and talks by subject.", url: "/topics/" },
    { label: "Complete blog", description: "Explore the complete post archive.", url: "/blog/" },
  ],
  socialLinks: [
    { name: "GitHub", url: "https://github.com/davidwesst", iconClass: "fa-brands fa-github" },
    { name: "LinkedIn", url: "https://ca.linkedin.com/in/davidwesst", iconClass: "fa-brands fa-linkedin" },
    { name: "Bluesky", url: "https://bsky.app/profile/davidwesst.bsky.social", iconClass: "fa-brands fa-bluesky" },
    { name: "YouTube", url: "https://youtube.com/davidwesst", iconClass: "fa-brands fa-youtube" },
  ],
  postTypes: {
    article: { label: "Article", iconClass: "fa-solid fa-newspaper", fallbackColor: "#0f766e" },
    gamelog: { label: "Gamelog", iconClass: "fa-solid fa-gamepad", fallbackColor: "#7c3aed" },
    dungeonlog: { label: "Dungeonlog", iconClass: "fa-solid fa-dungeon", fallbackColor: "#b45309" },
    talk: { label: "Talk", iconClass: "fa-solid fa-person-chalkboard", fallbackColor: "#0369a1" },
  },
};
