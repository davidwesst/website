---

title: What is Bower?
tags:
  - code
  - bower
date: 2014-10-16T18:03:40
description: I mentioned Bower last time when talking about npm.

---

[1]: bower-logo.png
[2]: bower-screen.png

I mentioned [Bower](http://bower.io/) [last time](http://davidwesst.com/always-use-node/) when talking about [npm](https://www.npmjs.org/).

If you haven't heard of it, neither of many people.

So, I'm going to fix that now.

* * *

![][1]

Bower is an open-source client-side HTML package manager from the people that brought you Twitter Bootstrap and..well, Twitter I suppose. If you're a Ruby or Rails person, it's like [Gems](https://rubygems.org/). If you're a .NET person, it's like [Nuget](https://www.nuget.org/). If you're a NodeJS person, it's like the [npm](https://www.npmjs.org/).

In other words, it's nothing new.

But here's what makes it awesome: HTML and client-side JavaScript are BFFs within the world of HTML5\. So, if you're using HTML or JavaScript in your client, Bower is going to make remembering and setting up development environments easy.

### Here's what you do....

First you install it using npm. Oh, we're using the command line for this.

`npm install -g Bower --save-dev`

We covered this last time, except this time the `-g` flag is installing it globally, so I'll have access to it from in folder.

Next navigate to the root folder for your HTML/JavaScript project and do:

`bower init`

Answer all the questions, and now you'll have a _bower.json_ that looks something [like this](https://github.com/zvgq/zvgq/blob/master/bower.json).

Now it's all configured. Next time you pull your code from source control into a new location, you can just `bower install` and your dependencies will be installed into the `bower_components` file.

Don't want the devDependencies? Then use `bower install --production` and you're good to go.

![][2]

You can even define a different installation directory with a `.bowerrc` file in your project. There are other options too [you can configure](http://bower.io/docs/config/) too, but that one is the only one I use for my projects.

### Conclusion

Package managers like Bower are nothing new, but for some reason, Bower remains moderately hidden to many that I talk to.

Oh, and because it's [using NodeJS](http://nodejs.org), it's platform agnostic, just like JavaScript and how I like my coding tools.

Thanks for playing. ~ DW