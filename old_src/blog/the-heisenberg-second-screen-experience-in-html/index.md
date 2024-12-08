---

title: The Heisenberg Second Screen Experience in HTML
tags:
  - html5
  - breaking-bad
date: 2013-09-27T03:37:00
description: Breaking Bad is coming to an end.

---

[1]: breakingbadhtml5.png

![][1]

Breaking Bad is coming to an end. We actually signed up for cable because we wanted AMC to watch the final season live and PVR it in case we were running late, and if we record it, then

Here's the interesting thing though: we haven't been late for a specific reason. That reason is the Breaking Bad Story Sync app. 

### What is Story Sync?

Story sync (as seen here, but does contain spoilers for the show) is a web application that plays along on a second screen (e.g. my browser window) that displays extra content about the show as you watch. Examples of content or videos of events from past episodes that relate to what is happening on screen, questionnaires to measure and compare audience reaction to events happening on screen and so on. 

If you break it down, it's a fairly simple app. It pushes HTML to your screen on timed intervals that match up with the show in progress. What it really impressive is that the second screen experience has gotten me sit through commercials on the show, and ensure that I'm home to watch it live on AMC. I can say that this is the first time that I've really appreciated a second screen experience, outside of the Nintendo Wii U when playing in a group. 

### Why HTML Makes the Second Screen Experience Better

Here's why I like that it's a web-based second screen: I don't need to install another companion app. 

I'm tired of installing companion apps on my phone when they don't give me anything special other than stats and the occasional notification about some event that I likely won't care about. What always blows my mind is that many of the apps that I've used, they require a network connection to even function. They require it. What is the point of installing a native app when I can't use it without the internet? 

I have an app that gives me data from the web that generally requires for that already. It's called a web browser. 

Except (thanks to HTML5) I can use that offline to a certain degree. Plus, with pinned sites on Windows devices and the ability to put bookmarks on your home screen in iOS, I don't understand why I need to go through an app store to get a native app. 

### What about Development?

What about it? 

If you build your second screen experience in HTML using whatever it is you want to use it for, you have multiple platforms that you can look to support, such as the Wii U, Windows 8/RT, and Web. Sure, there will be some device specific API you will likely need to take care of, but they will be JavaScript API made available by the vendor. It would be no different than using device specific APIs in any language, except this time its one language instead of the vendor preferred language. 

If you need to a platform that doesn't have natively installed HTML apps, you can use your HTML code in combination with PhoneGap and build yourself a native app the uses your code and provides the installed experience you're looking for. 

But why not look at offline HTML apps as an alternative to any native apps? 

The major players across the web support it, including those in the mobile space. So why not consider it an option? 

### Real-Life, Non-Gaming Example

The other day at work we ran a focus group our core LOB application that we develop in-house. We reviewed some new features with students and opened up the discussion from the specific features we were reviewing to their overall perception and opinion of the application. 

The "installed app" component came up during that discussion because they wanted to be able to access the data on the app without requiring a network connection. A 100% valid feature request considering that they are med students that work in the hospital, which has spotty network access at best. The immediate reaction was to make it available as an app, which is a logical conclusion. 

The catch is that it will be expensive to support all the platforms we need/want to support as we'll need to have someone who is good with iOS and Android working to build these apps that integrate into our platform. 

### In Conclusion

I know there are other factors at play here regarding why people want native apps VS mobile web apps. More specifically the business and marketing side of things. But, with that being said, I'm starting to see the need for native apps fading away as more and more devices support HTML and JavaScript. 

Sure, HTML/JavaScript apps on these platforms are still native apps. The key difference now versus two year ago is that you're looking at using a single language and set of technology to support all the platforms you want. 

Thanks for playing 

~ DW 