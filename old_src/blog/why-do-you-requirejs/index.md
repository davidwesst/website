---

title: Why do you RequireJS?
tags:
  - code
  - requirejs
date: 2014-10-07T17:15:11
description: Get it? RequireJS is a dependency management framework I use in
  JavaScript to manage...well my dependencies. But, the title is a play on words
  cause...of course you require JS...cause...JavaScript is required to...

---

[1]: requirejs-logo.png

Get it? [RequireJS](http://requirejs.org/) is a dependency management framework I use in JavaScript to manage...well my dependencies. But, the title is a play on words cause...of course you require JS...cause...JavaScript is required to...

_cough_

Yeah...well, I think I'm funny. ([Sad Trombone](https://www.youtube.com/watch?v=iMpXAknykeg))

* * *

![][1]

Here's why I use [RequireJS](http://requirejs.org/): it ensures that the JavaScript I need to run my code is loaded. I don't need to worry about the order of the `&lt;script&gt;` tags in the HTML. I don't need to do any sort of checking or `onload` event stuff, I just know it's good to go.

[See demo at JSBin](http://jsbin.com/OfIBAxA/10/embed?js,console,output)<script src="http://static.jsbin.com/js/embed.js"></script>

Second reason: It defines a single point to start the application with the definition of the `data-main` JavaScipt file. So, when I load an HTML page, I know the first line of JavaScript that will be executed and can build from there. Again, not worrying about multiple files loading at the same time and executing in parallel or anything.

    &lt;!DOCTYPE html&gt;
    &lt;html&gt;
        &lt;head&gt;
        &lt;/head&gt;
        &lt;body&gt;
            &lt;script data-main="path/to/main" src="path/to/require.js"&gt;&lt;/script&gt;
        &lt;/body&gt;
    &lt;/html&gt;
    `</pre>

    The `path/to/main` is a reference to a main.js file. RequireJS doesn't need the JS, as it's implied.

    Plus, because of the whole "knowing that my JavaScript is already loaded", I know that the libraries that I leverage (e.g. jQuery, Bootstrap, whatever...) will already be loaded and setup before I start running my application code.

    #### Ha! What about your library dependencies?

    I define and configure those in the RequireJS config JSON that gets run before we start the application.

    <pre>`require.config
        paths:
            # dummy path for demo
            'jquery': 'http://davidwesst.com' 
        shim:
            # This is a sample of defining dependencies
            "bootstrap":
                deps: "jquery"
                exports: "Bootstrap"

#### Double "Ha"! What about your text file dependencies?

I don't usually need it, but if I do there is [a plugin](http://requirejs.org/docs/api.html#text).

Plus, if you're using text files to localize your site, there is [another plugin](http://requirejs.org/docs/api.html#i18n) to help that that too.

### The Point

When I start a project, I make sure I wire up RequireJS first before I start writing any code. Because:

*   I don't need to worry about libraries and other script not being loaded
*   I know where my application will start every time the page loads

Ultimately, it gives me less things that could go wrong while I'm focusing on writing code. Plus, as a keep building the application, it forces me to think about what my "new" code needs to depend on as I go making it cleaner and easier for someone to get into.

Learn about it here. Given, it's a steep learning curve with that documentation, but I guarantee it's worth it.

Thanks for Playing. ~ DW