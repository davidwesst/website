---

title: Working around 'Refuses to Connect' Issues with IFrame Embedded Twitch Players
date: 2022-01-26T18:28:00.000Z
tags:
  - livestream
  - markdown
  - html
  - twitch
  - bug
description: With me doing more livecoding sessions on Twitch, I wanted to embed
  some clips into my blog posts and hit some weird issues. I managed to get it
  working and wanted to document the workaround so I don't forget it.
social_image: ./twitch-player-refuse-to-connect.png

---

## The First Problem
After following along with the [Twitch developer documentation about embedding the non-interactive inline frames][3] I hit the following error:

> Failed to load resource: the server responded with a status of 403 ()

Which looked something like this:

![Twitch embedded iframe stating: Failed to load resource: the server responded with a status of 403][1]

### First Solution

This one was on me, and I didn't read the documentation correctly. Turns out I formatted the query string wrong in the `src` property and solved it by add `?video=<the-id-goes-here>`.

Which bring us to...

## The Second Problem

Although the other issue is solved, we now see this "player refuses to connect" error message that looks like this:

![Twitch embedded iframe stating: player.twitch.tv refused to connect][2]

This happened both in local development environment and my published post on davidwesst.com. Opening up the browser console gave me a bit of a clue though. It read:

> Refused to frame 'https://player.twitch.tv/' because an ancestor violates the following Content Security Policy directive: "frame-ancestors  https://www.davidwesst.com".

Again-- read the documentation closer and realize that if you don't include the base url of wheverever you're hosting from, such as `localhost` or `127.0.0.1` or `www.davidwesst.com` in my case, the Twitch player is going to refuse the connection.

### Second Solution

All I ended up doing was adding some `parent` values to my query string on the `src` property and TA-DA! it worked. My iframe embed look like this now:

```
<iframe
    src="https://player.twitch.tv/?video=1241089585&parent=127.0.0.1&parent=www.davidwesst.com"
    height="360"
    width="640"
    allowfullscreen="true">
</iframe>
```

## A Better Solution
Although this works, I don't like that I have to put all my development URLs in the query string to get this working in development and in production. I _could_ do something around changing the strings on build (depending on where it's hosted) but I need to digest it a bit more to decide the best option.

I've created an [issue on GitHub][4] and if you have ideas or thoughts, I'd love to hear them in the issue (or the comments of this post).

## Lessons Learned

First, read the developer documentation thuroughly. 

Second, although this isn't the prettiest solution, it delivers value immediately and unblocks my content creator role (i.e. writing blog posts). It's important to remember to assess an issue and sometimes you need to use some duct tape to keep things moving while you wait for the "best fix" to be ready.

Thanks for playing.

~ DW


[1]: ./twitch-player-misconfigured.png
[2]: ./twitch-player-refuse-to-connect.png
[3]: https://dev.twitch.tv/docs/embed/video-and-clips#non-interactive-inline-frames-for-live-streams-and-vods
[4]: https://github.com/davidwesst/website/issues/86