---

title: Azure Static Web Apps (SWA) are fine, just not great
date: 2022-10-12T12:00:00
tags:
  - azure
  - azure-static-web-apps
  - azure-dns
  - azure-front-door
  - azure-cdn
  - azure-functions
description: Azure Static Web Apps feel like a good idea, but in practice I
  struggled with understanding what the product is trying to be. This post
  documents my experience working with SWAs on a few projects, namely this
  website, along with the problems and workarounds/solutions I found to those
  problems.

---

[1]: https://azure.microsoft.com/en-ca/products/app-service/static/
[2]: https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blob-static-website-host
[3]: https://11ty.dev/
[4]: https://learn.microsoft.com/en-ca/azure/static-web-apps/plans
[5]: https://learn.microsoft.com/en-us/azure/cdn/cdn-standard-rules-engine-reference
[6]: https://learn.microsoft.com/en-us/azure/static-web-apps/enterprise-edge
[7]: https://learn.microsoft.com/en-ca/azure/static-web-apps/configuration

To be clear, I think [Azure Static Web Apps][1] are a good idea and decent product-- I just don't really understand what its trying to be. From the documentation I read though, SWAs appear to be the "evolution" of [Azure Static Websites][2], which come as a built-in feature with Azure Storage. My expectation was that I would be able to use this as an all-in-one solution for a simple personal website, without costing a lot, and still provides all the modern web amenities a developer would want in a web site.

Ultimately, it _does_ do that, but I hit some pretty serious snags along the way and figured I would share that experience with the internet so I don't forget about it, and so that others know what they are getting into when it comes to messing around with Azure Static Web Apps. 

## Context: The Project
I started using SWAs for a few side projects, but the one I am going to focus on is this website, `davidwesst.com`. This is a statically generated web site using  [11ty (Eleventy) v1.02][3], where the initial requirements were:
- Build and deploy the site using GitHub Workflows
- Force HTTPS by redirecting HTTP requests
- Non-production or "staging" environments
- URL redirection for legacy subdomains and apex domain
- Allow for triaging of runtime issues in cloud-hosted environment
- Not be expensive (it's a personal website, where I am sinking in the development hours)

When you look at the requirements above and compare them to the [SKUs for Azure SWAs ][4], they seem to align well. The only thing that is not explicitly mentioned is the URL and request redirection rules. But, with the line "Globally distributed static content" listed, I figured that I would be able to leverage the [Azure CDN Rules Engine][5] or something like that.

![Screenshot of the list of features published for both the free and premium SKUs for Azure Static Web Apps at the time of writing this post](./swa_features.jpg)

But you know what they say about assumptions...in any case, let's get into it.

## Problem: GitHub Workflow Integration

This issue just felt a little weird to me. They highlight the integration in the feature list, but when you [read the documentation][6], but in order to setup continuous deployment with a GitHub Workflow, you need to let the Azure Portal commit a workflow file to your repository.

I mean it works, but why can't I just add the file myself? Or, why is it not optional to have the workflow file committed to repository?

My expectation is that if I am already in the Azure Portal setting up the cloud resources for my web site, I can probably setup continuous deployment myself. Sure, it might be convenient to have it wired up automatically-- but my preference is to always understand _how_ something is being wired up, rather than just letting automation do it for me.

### Solution/Workaround: Rename and Replace the File
It was easy enough-- but it really rubbed me the wrong way. I didn't like that I needed to give the Azure Portal a bunch of permissions to setup secrets and the like between Azure and my GitHub repo. I had already written a file based on my own research and had it in the repository, but I needed to delete this one and replace it with my own.

It worked as expected, except the Azure Portal still seems to think I am using the old one.

![Screenshot of Azure Portal overview of a static web app with a link to the file that I deleted](./portal_link_to_old_workflow_file.jpg)

This, as the other problems you'll read about, are not deal breakers or anything. But it did confuse me on the target audience for the Static Web Apps product.

## Problem: URL Redirection

This one is probably my own fault. As I said previously, I assumed that I would have the Azure CDN rewrite rules engine at my disposal because I assumed when the feature list included "Globally distributed static content", it meant the Azure CDN was avialable to me.

Well, it isn't. And I have a bunch of technical debt and baggage I am trying to clean up on my personal website, so how was I supposed to manage legacy subdomains I used to use, along with the apex domain, and enforce HTTPS like a good web development professional?

## Solution: Enterprise-grade Edge
Like all good freemium products, Azure provides an upgrade path to enable the [Enterprise-grade edge][6] which gives you "the capabilities of Azure Static Web Apps, Azure Front Door, and Azure Content Delivery Network (CDN) into a single secure cloud CDN platform."

This costs about $22.43 CAD per month, which is reasonable-- although it violates my requirement to not be expensive. I am not saying that $22 a month is a lot of money, but rather I don't really know what I'm paying for. I suppose it's the fancy Azure Front Door features, but this is my personal website and it is not drawing the traffic like Hanselman, so I don't have a plan to recoup that cost in any other form.

## Workaround: Azure CDN (Classic)
Instead of using Azure Front Door itself or upgrading to the Enterprise-grade edge, I opted to setup the Azure CDN myself and point my Azure DNS records (but you could do this with any DNS host) to the static web app assigned URL.

I am pretty sure (although, **not** confirmed) this workaround comes with a few limitations. More specifically the routing configured in the [SWA application configuration][7]  does not seem to work as expected. Plus, I am unsure that the built in API layer would work as expected with the CORS configuration managed by the SWA.

![A screenshot of the "Rules Engine" navigation option provided in my Azure CDN (Classic) portal that I setup](./rules_engine_option_in_azure_cdn.jpg)

## Problem: APIs, Environments, and Logging
In my original revamped architecture for my website, I decided to make it API driven to mess around with Azure Functions and use them to populuate a single-page static application. My first complete setup for this had a nasty bug in it that lead to requests to the API taking between 15-20 seconds each (due to bad programming on my part).

So, I fixed it up, and got it working on my machine with the SWA tools and decided to create a pull request, which in turn would create a new environment for me to test my fix. Unfortunately, my fix was one of those "works on my machine" issues, and when deployed into the cloud it threw a runtime error.

![The network tab of Chromium developer tools showing a 500 error for a request to the SWA-hosted API with no error message](./api_500_error.jpg)

Welp, the next step was to checkout the Application Insights data and check the logs on the Azure Portal. Unfortunately, alhtough the 500 error was being noticed by Azure Monitor, I could not find it in any of the logs. I confirmed I setup all the application settings correctly for application insights and even did a screenshare and review with a couple of the [WesternDevs][8] with much more Azure experience than I do.

Yet, we all came to the same conclusion: it _should_ be there, but it isn't.

## Solution: None
I never did find a solution. Ultimately, this got me to rethink my whole project and goals and ended up re-architecting the whole website back to a statically generated site.

The only workaround I found, but did not attempt, was to merge the code into production and "fail forward" as they say. Application Insights and Azure Monitor worked fine for production, just not for the non-production environment. Hypothetically, I could push the change and just triage it there and fix it.

But that felt wrong, dirty, and a bad developer. As a rule of thumb, development products should not leave you feeling bad about the choices you are forced to make, especially ones for small side projects like a website.

That is what ERP development is for 😉. 

## Conclusion
In the end, my architecture ended up looking like this:

![Solution architecture diagram showing how Azure DNS, Azure CDN, Azure Static Web Apps, Azure Storage, and GitHub all fit together](./v10_solution_architecture.jpg)

Like I said at the beginning, I think SWAs are a good idea and a decent product. I feel as though the problems I faced were caused by my assumptions and expectations about what the product _should do_ as compared to what it _could do_.

I am still going to keep using SWAs for new projects. Moving forward, my expectations will be better aligned with reality-- it is just really unfortunate that the product ended up being more of a freemium-style product full of microtrasactions, rather than the small-time affordable static web site evolution I had hoped for.

Thanks for playing.

~ DW
