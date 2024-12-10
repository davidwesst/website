---

title: Measuring in CSS is Cool
tags:
  - css
  - css3
  - html
  - stylesheets
social_image: header.png
date: 2016-03-07T09:04:00
description: I've been on this CSS kick for the past while, and I had forgotten
  how much CSS can do now. More specifically how things have changed when it
  comes to measuring height and width.

---

[1]: header.png

![][1]

<small>[(Originally posted on WebNotWar.ca)](http://www.webnotwar.ca/opensource/measuring-in-css-is-cool/)</small>

If you're a CSS expert, this post probably isn't for you. But for those of you who live inside of JavaScript most of the time, it might be a good refresher to see what other web platform tech can do for your sites and apps.

### For the Enterprise Developers
I wanted to highlight that all of the features I'm talking about in this post are supported in IE9 and above. That wasn't intentional, but I thought I'd share considering the enterprise doesn't always have the latest and greatest browsers setup across their organization.

You can find more of that at [CanIUse.com](http://caniuse.com/).

## REM (or Root EM) Units
This one doesn't seem that cool, but it really is.

For the longest time, people have used _em_ units to make sizing relative to the point value. So, if define a `font-size: 16px` in my root element, then 1em refers to 16px. Easy right?

Well, what if someone further along down the cascade of stylesheets decides to set their `<section>` element to have a `font-size: 24px` because that's how they've been doing fonts for the longest time. Now your _em_ units are changed, and 1em no longer means 16px, and everything is all fiddle-faddle-foo.

With _rem_ units, we're always referencing the root point size. So, in our case, the original `font-size: 16px` would always be used, even when our new developer adds a new `font-size` rule to their stylesheet.

Here are a few CodePen examples from [Jeremy Church](https://j.eremy.net/confused-about-rem-and-em/) that capture em and rem very well.

Here's the scoop on [browser compatibility](http://caniuse.com/#feat=rem) in case you're interested.

### REM Example 
<p data-height="268" data-theme-id="0" data-slug-hash="qjEBs" data-default-tab="result" data-user="jeremychurch" class='codepen'>See the Pen <a href='http://codepen.io/jeremychurch/pen/qjEBs/'>qjEBs</a> by Jeremy Church (<a href='http://codepen.io/jeremychurch'>@jeremychurch</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//assets.codepen.io/assets/embed/ei.js"></script>

### EM Example
<p data-height="268" data-theme-id="0" data-slug-hash="AlxHk" data-default-tab="result" data-user="jeremychurch" class='codepen'>See the Pen <a href='http://codepen.io/jeremychurch/pen/AlxHk/'>AlxHk</a> by Jeremy Church (<a href='http://codepen.io/jeremychurch'>@jeremychurch</a>) on <a href='http://codepen.io'>CodePen</a>.</p>
<script async src="//assets.codepen.io/assets/embed/ei.js"></script>

## Viewport Units
This one was new to me, and I like it quite a bit. Considering it's [supported](http://caniuse.com/#feat=viewport-units) across the board, I wish I had known about it sooner.

Viewport units are exactly what it sounds like-- units of measure that represents a percentage of the height or width of the viewport. You get the option of `vh` for viewport height, `vw` for viewport width, `vmin` for the smaller unit of either vh or vm, and `vmax` for the larger of the two.

So, if you have `height: 1vh` then you're setting the height to 1% of the viewport height. It doesn't matter if your screen is 480px high, then it's 4.8px. When you flip the phone around into landscape mode, the height changes, and so do the units.

It might not sound like much, but it's really helpful with things like typography. [CSS Tricks](https://css-tricks.com/viewport-sized-typography/) has a great example. Plus, if you want buttons or elements to consume a certain amount of your screen, this _is_ a great solution.

## calc()
Yes, there are a few functions in CSS and this one is [supported everywhere that matters](http://caniuse.com/#feat=calc).

This one lets you do unit calculations directly in your stylesheets. It might not sound like something you'd want to do, but it works really well when you want to position things in CSS dynamically. If you always want something 50px smaller than the 100% of the screen you can use  `height: calc(100% - 50px);` and you'll get the value you're looking for.

It works with addition, subtraction, multiplication, and division operations, and handles both percentages and units. If you need something positioned or sized dynamically, this should save you the trouble of needing to use JavaScript to get it done.

Take a look at the [MDN page](https://developer.mozilla.org/en/docs/Web/CSS/calc) for the full details about `calc()` and keep it in your back pocket.

