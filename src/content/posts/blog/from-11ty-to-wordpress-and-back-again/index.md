---
id: blog/from-11ty-to-wordpress-and-back-again
source: davidwesst.github.io
docType: post
series: blog
slug: from-11ty-to-wordpress-and-back-again
title: From 11ty to Wordpress and Back Again
summary: >-
  I stepped away from blogging thinking that the problem was that my Eleventy
  (11ty) setup and continually tinkering with it was keeping me away from
  blogging. So, to make it "easier" I spent a couple of months worth of my
  B-time moving my website over to Wordpress site. Once it was done, I had a
  fancy editor, a bunch of plugins, and all the tooling I could ever want. I
  didn't write a single post. This is post is my experience (not) blogging with
  Wordpress and returning to 11ty.
dates:
  published: '2025-01-30'
  sort: '2025-01-30'
taxonomy:
  tags:
    - wordpress
    - 11ty
    - website
  categories:
    - lessons-learned
media:
  image: from-11ty-to-wordpress-and-back-again_title-image.webp
  imageAlt: >-
    A diagram illustrating the transition between 11ty (a static site generator)
    and WordPress, and vice versa. On the left, there is a circular 11ty logo
    above an icon representing a static site, labeled "STATIC SITE." On the
    right, there are two WordPress logos, both labeled "WORDPRESS." A large
    horizontal arrow points from the static site on the left to WordPress on the
    right, symbolizing the transition. At the top, a banner with the text "From
    11ty to WordPress and Back Again" suggests a reversible process. The
    background is beige with a hand-crafted aesthetic.
canonicalUrl: /blog/from-11ty-to-wordpress-and-back-again/
legacyUrls:
  - /blog/from-11ty-to-wordpress-and-back-again/index.html
meta:
  sourceMeta:
    title: From 11ty to Wordpress and Back Again
    date: 2025-01-30T15:26:00.000Z
    tags:
      - wordpress
      - 11ty
      - website
    categories:
      - lessons-learned
    featured_image: from-11ty-to-wordpress-and-back-again_title-image.webp
    featured_image_alt: >-
      A diagram illustrating the transition between 11ty (a static site
      generator) and WordPress, and vice versa. On the left, there is a circular
      11ty logo above an icon representing a static site, labeled "STATIC SITE."
      On the right, there are two WordPress logos, both labeled "WORDPRESS." A
      large horizontal arrow points from the static site on the left to
      WordPress on the right, symbolizing the transition. At the top, a banner
      with the text "From 11ty to WordPress and Back Again" suggests a
      reversible process. The background is beige with a hand-crafted aesthetic.
    description: >-
      I stepped away from blogging thinking that the problem was that my
      Eleventy (11ty) setup and continually tinkering with it was keeping me
      away from blogging. So, to make it "easier" I spent a couple of months
      worth of my B-time moving my website over to Wordpress site. Once it was
      done, I had a fancy editor, a bunch of plugins, and all the tooling I
      could ever want. I didn't write a single post. This is post is my
      experience (not) blogging with Wordpress and returning to 11ty.
---
I haven't blogged since 2023. 

I stepped away from blogging thinking that the problem was that my Eleventy (11ty) setup and continually tinkering with it was keeping me away from blogging. So, to make it "easier" I spent a couple of months worth of my B-time moving my website over to Wordpress site. Once it was done, I had a fancy editor, a bunch of plugins, and all the tooling I could ever want.

I didn't write a single post.

It is 2025 and I'm back onto 11ty, freshly upgraded to version 3.0, and writing a post in VIM on my laptop. 

This is post is my experience (not) blogging with Wordpress and returning to 11ty.

## Why I Left 11ty

To be clear, there was nothing wrong with the technology. I started messing around with 11ty before version 1, and it continued to impress me. My problem was that I was spending all my time upgrading my website, rather than actually producing content.

Why was I continually needing to upgrade my website? Because I was because I wasn't checking on it regularly and when I would clone my site repo, I would get the notifications that things were out of date. Not an 11ty problem, but rather a me problem. 

Are you able to run software that isn't the latest version?

Of course you can. 

But I would fixate on that and then be too burnt out or totally forget about what I was in my website repo in the first place.

This constant loop of upgrade, not blog, let it get stagnant, upgrade again sucked the interest in the website out of me, and eventually it became an excuse on why I wasn't able to make progress on my other side projects and initiatives. 

With respect to other initiatives, at the time focused on how I needed to get more content produced and develop some kind of following. I chalk it up to my secret addition to likes (see [my previous post][1] about this if you want to know more). Either way, I decided that removing the "tinkering" element of my website would allow me to focus on the important stuff like producing blog posts and video game projects I had been postponing.

In short, I thought that Wordpress would be less of a distraction than 11ty.

I was wrong. But first, the journey to Wordpress.

## Why Wordpress

The journey to Wordpress was a pretty short. When you search "how to make a website" and you filter out all the ads and hosting services, you land on Wordpress. My requirement was to continue owning all of my content, while keep costs to a minimum which is where shared Wordpress hosting come into play. 

I landed on Namecheap as my host, and went off to setup my website.

## The Red Flags

In retrospect, this effort had red flags along the way, but I didn't know it at the time. I want to highlight a few of them.

### Red Flag 1: The Unease of Migrating

My expectations getting a hosted Wordpress site was that things were going to be easy to setup. And the were.

What I didn't consider was that I wasn't setting up a new website. I was migrating a website over to Wordpress, which is different. Especially migrating a static site populated with markdown and image files.

Still-- I found a way, although I can't explain to you how I did it now. It was over a year ago, and my goal was just to get it done. I clearly didn't enjoy it, nor did I think about trying to blog about it. I just wanted it done, so I could move on.

### Red Flag 2: No Joy, Just Work

That lack of enjoyment was another red flag. 

Moving back to 11ty wasn't a cake walk, but I _enjoyed_ the process. I rediscovered my love for web programming, explored my archived website repository, and started hacking away on it. Slowly but surely, I upgrade my 11ty setup to version 3.0 (albeit, I did it the hard way because I found the [11ty Upgrade Helper][2] tool too late). 

But I was enjoying the process of tinkering, hacking on it, and exploring the community I had left behind.

### Red Flag 3: The Tinkering Continues

Eventually I managed to get Wordpress up and running and was _almost_ ready to blog.

Why almost? Well, although I wanted to write some blog posts, I needed to make sure I could crosspost them and share them automatically. 

And so, I started learning about how to integrate things with Wordpress so that I could automate post sharing to various social networks. I found plugins, and various tools, but nothing that met my expectations.

Which is when the tinkering started again.

### Red Flag 4: Missing Markdown

As I went through creating all the pages in my Wordpress site, I found myself missing the simplicity of markdown and a text editor.

Sure Wordpress had a fancy editor, but I needed to fight with it to get things looking and working the way I wanted them too. Between the editor, the additions from the theme and various plugins, I found myself sort of "hacking" the editor by finding what worked and then repeating my method for making a download button work, or a heading to look the right away.

Even before the 11ty site, I had been using markdown text to write pages, posts, or whatever. It didn't need to load in my browser, I didn't need a mouse, I didn't have to learn what properties on the widget let me edit things. It was plain, good old fashioned utf-8 text, and it just worked.

## Back Where I Started

![A screenshot of a text editor (Vim) displaying a Markdown file named index.md. The file is a blog post titled "From 11ty to WordPress and Back Again," dated January 29, 2025. The content includes headings, bullet points, and reflections on upgrading software and maintaining a website. The Vim status bar at the bottom shows the file type as Markdown, the encoding as UTF-8, and a word count of 1,462. The terminal interface has a dark background with syntax highlighting in various colors.](blogging-with-vim-screenshot.webp)

After a few months of being live, the site was at the point where I had a plugin partially working that I realized I was really back where I started: tinkering.

After all that time and effort, I was back to tinkering rather than producing content. 

The website tinkering stopped, as did my thoughts about blogging.

### The Cycle Continues

That isn't to say I didn't use the website. I continued to publish and share [talks][3] through the website, but the website laid dormant for a quite a while until we starting nearing the end of 2024 when my renewal notice showed up in my inbox.

"You know", I thought to myself, "I should probably make use of this blog before I renew and make sure it is actually worth the money."

And so I logged into Wordpress. I saw that my blog theme was "out of date" and needed upgrading, which entails clicking the "upgrade" button. 

"Might as well." I thought to myself. "That way everything will be up-to-date."

And then it broke my homepage. The theme upgrade removed or rewrote my customized homepage, and all the work I had put into it was gone.

Almost one full year into having a Wordpress site that would solve all my creative woes, and I did _the exact same thing_ I did with my 11ty site. I upgraded it, and started tinkering.

Rather than try to get Wordpress fixed up, I left the site partially broken from the upgrade and dug up my archived GitHub 11ty website repository and started working.

## The Truth 

The problem was never 11ty. The problem was me.

I saw my tinkering as a distraction from the "real work", but what even is the "real work" when you're talking about a side project that doesn't pay any money?

My reality is that tinkering with my website is a delightful hobby. One that lets my muck around in JavaScript-based web code, complete with CSS and HTML on top. Working on my website _feels_ good, and so it shall continue with this new iteration. 

As for the blogging-- this post seems to be coming along well enough and it _feels_ good too. I am writing it in Vim, using markdown, and I'm enjoying reflecting on this journey from 11ty to Wordpress and back.

## Lesson Learned, and No Regrets

Even though one could argue that this whole journey was a waste of time, I can say that I have no regrets. 

Like any software project, you learn a lot along the way, and I'm not just talking about the experience working with the technology. You get to refine the requirements, figure out what drives the client (which is myself in this case), and you figure out what the real value the software provides the client.

I learned that I like to tinker with my website. Hopefully this time around, I won't forget it.

Thanks for playing.

[1]: /blog/my-secret-addiction-to-likes/
[2]: https://www.11ty.dev/docs/plugins/upgrade-help/
[3]: /talks/
