---

title: Why do you CoffeeScript your JavaScript?
tags:
  - code
  - javascript
  - coffeescript
date: 2014-09-30T18:26:07
description: "I was asked this the other day: Why don't you just write your code
  in JavaScript directly? As in, why would you use a langugage that abstracts
  JavaScript, which  doesn't require compiliation?"

---

[1]: coffeescript-logo.png
[2]: ielogo-blue.png

I was asked this the other day: Why don't you just write your code in JavaScript directly? As in, why would you use a langugage that abstracts JavaScript, which  doesn't require compiliation?

![][1]

That second question is also the answer: I _want_ a compiler, because a compiler can optimize my code.

### For Example

Remember our script from the [last post](http://davidwesst.com/why-do-i-javascript/)? Well, let's see that same thing in [CoffeeScript](http://coffeescript.org).

[JS Bin](http://jsbin.com/codizu/1/embed?js,console)<script src="http://static.jsbin.com/js/embed.js"></script>

Now I can compile it and get optimal JavaScript. 

`coffee myfile.coffee --compile`

I don't need to worry about the nuiances of the language syntax nor what "optimal" means for JavaScript. There is a [whole community](https://github.com/jashkenas/coffeescript) of people worrying about it for me which is put into the compiler.

Plus, like I [said in the last post](http://davidwesst.com/why-do-i-javascript/), JavaScript doesn't really look like other languages. Sure, it's easy once you get used to it, but so is eating broken glass. 

I have a background in C# which is more of a so-called "traditional" OO language, like Java, which I find easier to read.

CoffeeScript, although definitely not like C#, is easier for me read though and understand. The more I worked with it, the easier it became as the whitespace worked in my favour. Plus, I hear people that like indentation languages like VB.NET or Ruby, think CoffeeScript feels familiar**.

<small>**When I say "I hear", refers to of some of the anecdotal I have had over the past couple of years with collegues. So take that as you will.</small>

#### But JavaScript Has "Normal" Class Definitions and Stuff

You're right...in the [ES6 standard](http://wiki.ecmascript.org/doku.php?do=show&amp;id=harmony%3Aspecification_drafts#current_working_draft). Plus, property modifiers kinda go hand-in-hand with class defintions and that is expected in ES7\. 

I want to support platforms that are out _now_, not next year or the year after. These platforms came out before that spec, and so they don't support it. I'd have to use a compiler that abstracts me away from how JavaScript actually works just so I can use language features that will eventually be in CoffeeScript anyway.

Since...  

> "The golden rule of CoffeeScript is: "It's just JavaScript" - [Coffeescript.org](http://coffeescript.org)

...I don't learn to use features that don't already exist JavaScript. When the compiler supports ES6 JavaScript, the new (more traditional) keywords will be supported there too. 

Not that I think abstraction languages that do that are bad (e.g. [TypeScript](http://www.typescriptlang.org/)), but I think that CoffeeScript is a nice medium that teaches me JavaScript functionality, with a simpler syntax, while giving me tools that make cleaning up and optimizing my code easy.

##### For example...

The IE team [recently announced the support](http://blogs.msdn.com/b/ie/archive/2014/09/18/updates-to-our-platform-roadmap.aspx) of ES6 features that are "In Development".

Internet Explorer is something of a major player on the web, so I probably want to support those users too.

![][2]

### The Point

I like CoffeeScript because it still allows me to learn the features JavaScript, while giving me a compiler to write optimal JavaScript, along with a simpler, cleaner syntax, in my opinion.

This is definitely more of a preference when coding JavaScript and isn't really necessary. I just find that writing CS versus JS was just more intuitive with my background.

Thanks for Playing. ~ DW