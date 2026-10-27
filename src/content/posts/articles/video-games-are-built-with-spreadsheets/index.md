---

title: "Video Games are Built with Spreadsheets"
date: 2026-10-27
summary: "I knew that spreadsheets were the glue that kept software projects together, but never realized how they would be so much more critical in video game development projects."
topics:
  - game-design
  - gamedev
  - game-development
  - project-passenger
  - spreadsheets
banner:
  src: ./spreadsheets-banner.png
  alt: "A player-stats and energy-balance spreadsheet with an arrow pointing to the Passenger game prototype."

---

The more time I spend making a video game, the more I have come to realize that video games start with spreadsheets. Not code. Not pictures. But spreadsheets.

Spreadsheets for funding. Spreadsheets for balancing. Spreadsheets for localization. Spreadsheets, spreadsheets, and more spreadsheets.

Working in enterprise software, I am all too familiar with spreadsheets for managing projects, organizing teams, and all sorts of business activities. 

They are the glue or duct tape that hold the project together, in a lot of cases.

For video games, I keep finding myself and the various experts I learn from using spreadsheets _to build_ the video game itself, not just organize the business activities around it.

I'm sure there are more examples than I know about, but in this post I want to share where spreadsheets seem to make sense as the default tool to use.

> If you have other examples, reach out to me on [Bluesky][1], [LinkedIn][2], or [YouTube][3] and tell me how you use spreadsheets to make your video game. I am genuinely interested in learning where else they fit into the development process.

## Text Localization

I have only dabbled in this one so far, but as I experimented with various dialogue systems, I saw how any dialogue or text needs to fit into a spreadsheet at some point to be localized.

A spreadsheet is a table, plain and simple. Using it to store data and then mapping that data to other data just makes logical sense.

This is why when I look at tools to help me with dialogue or text in my game, I make sure that they support export to a spreadsheet-friendly format like CSV.

## Gameplay Models and Balancing

This one is a little more involved. I heard [Jesse Schell][4] on a podcast talking about how he had used a spreadsheet to determine the balance of a trivia game he was making.

I figure if you can create a model to simulate trivia gameplay, you must be able to do it for other systems.

And so, with my current project [Passenger][5], I have spent time modelling out how to crunch the numbers in a new part of the game I am trying to prototype.

After a few evenings of fiddling, I managed to get a spreadsheet that showed me how the formulas balanced out and what variables I had to adjust to make things easier or harder for the player.

![Gameplay-model spreadsheet showing player stats and adjustable energy-balance constants, including base energy cost, task multipliers, and optional task chance.][6]

Let me emphasize what this has done for my project-- before adding more content to my game, I _know_ how the gameplay system will be balanced. I don't think I know; I _actually know_ how it will be balanced.

That doesn't mean the work is actually done. I mean, I still have to make it fun and all that. But I have a formula that I can adjust to make things easier (or harder) depending on player feedback and the feeling I am going for in the scene.

## Understanding Your Audience

In [my last devlog][7], I talked about documentation helping me define scope for Passenger by doing a competitive analysis on games I thought seemed comparable to the vision I have for Passenger.

This is all done in spreadsheets.

With the competitive analysis, I pulled all the tags for the comparable games and started crunching the data to figure out what tags aligned with my vision and what tags appeared more frequently with the comparable games. The overlap between these two sets of tags gives me the features I should include in my game.

### Example

![Competitive analysis spreadsheet comparing game tags, including Story Rich, Life Sim, and Dating Sim, by applicability to Passenger, reference count, and appearances.][8]

For example, you can see that Dating Sim is one of the tags I was considering for the game-- however, after doing some analysis on the comparables, I can see that it doesn't show up nearly as much as I thought it would.

This means that in terms of prototyping priority, the dating sim mechanics have dropped pretty low on my development schedule.

This saves me the effort of trying to figure out if that even works, as the audience I am trying to reach with Passenger doesn't really care about dating sim mechanics as compared to other features.

## Conclusion

Spreadsheets are the duct tape of software development in general-- but they appear to be more than that for video game development.

They provide more than just the glue for video games. They provide the interface for working with non-game developer types and allow you to prove out your game idea before you even start drawing it out.

[1]: https://bsky.app/profile/david.wes.st
[2]: https://ca.linkedin.com/in/davidwesst
[3]: https://youtube.com/davidwesst
[4]: https://jesseschell.com
[5]: https://cocobokostudios.com/#games
[6]: ./gameplay-model-screenshot.png
[7]: /blog/defining-video-game-scope-with-documentation/
[8]: ./tag-analysis-screenshot.png
