(self.webpackChunkdw_website=self.webpackChunkdw_website||[]).push([[509],{4705:function(e,t,r){"use strict";r.d(t,{Z:function(){return m}});var a=r(7294),n=r(9),i=r(5444),o=r(1621),s=function(e){var t=e.categories;return a.createElement("div",null,t&&t.map((function(e){return a.createElement(l,{key:e},a.createElement(i.Link,{to:"/categories/"+(t=e,t.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g).map((function(e){return e.toLowerCase()})).join("-"))},e));var t})))},l=n.ZP.span.withConfig({displayName:"categories__Category",componentId:"sc-2yqpc4-0"})(["margin-right:0.6rem;margin-bottom:0.6rem;text-transform:uppercase;font-size:var(--size-300);& a{position:relative;z-index:2;background-color:rgba(255,255,255,0.7);text-decoration:none;color:inherit;padding:0.2rem 0.6rem;border:1px solid rgba(255,255,255,1);border-radius:4px;}& a:hover{background-color:rgba(255,255,255,0.9);}"]),m=function(e){var t=e.posts.map((function(e){var t=e.frontmatter,r=e.fields,n=e.excerpt,i=e.timeToRead,o=t.title,s=t.tags,l=t.categories,m=t.date,c=t.description,p=r.slug;return a.createElement(d,{key:p,tags:s,categories:l,title:o,date:m,slug:p,timeToRead:i,description:c,excerpt:n})}));return a.createElement(c,null,t)},d=function(e){var t=e.title,r=e.date,n=e.timeToRead,l=e.tags,m=e.categories,d=e.excerpt,c=e.description,b=e.slug;return a.createElement(p,null,a.createElement(s,{categories:m}),a.createElement(g,null,a.createElement(i.Link,{to:b},t)),a.createElement(u,{dangerouslySetInnerHTML:{__html:c||d}}),a.createElement(o.Z,{tags:l}),a.createElement(f,null,a.createElement("span",null,r),a.createElement("span",null,n," mins")))},c=n.ZP.ul.withConfig({displayName:"post-list__StyledPostList",componentId:"sc-13lj44o-0"})(["padding:0;list-style:none;display:grid;justify-items:center;grid-gap:var(--size-600);grid-template-columns:repeat(auto-fit,minmax(35ch,1fr));@media screen and (max-width:500px){&{display:block;}}"]),p=n.ZP.li.withConfig({displayName:"post-list__StyledPostListItem",componentId:"sc-13lj44o-1"})(["position:relative;display:flex;flex-direction:column;padding:1.5rem;border:1px solid rgba(255,255,255,0.5);background-color:rgba(255,255,255,0.3);backdrop-filter:blur(10px);border-radius:8px;&:hover{background-color:rgba(255,255,255,0.5);}@media screen and (max-width:500px){&{margin-top:var(--size-600);}}"]),g=n.ZP.h2.withConfig({displayName:"post-list__PostListTitle",componentId:"sc-13lj44o-2"})(["line-height:1.2;margin-top:1rem;margin-bottom:1rem;text-transform:capitalize;font-size:var(--size-600);font-weight:700;& a{text-decoration:none;color:inherit;}& a::after{content:'';position:absolute;top:0;bottom:0;left:0;right:0;}"]),u=n.ZP.p.withConfig({displayName:"post-list__PostListExcerpt",componentId:"sc-13lj44o-3"})(["margin-top:auto;font-size:var(--size-400);"]),f=n.ZP.div.withConfig({displayName:"post-list__PostListMeta",componentId:"sc-13lj44o-4"})(["margin-top:2rem;font-size:var(--size-300);display:flex;justify-content:space-between;"])},1444:function(e,t,r){"use strict";var a=r(5444),n=(0,r(9).ZP)(a.Link).withConfig({displayName:"styled-link__StyledLink",componentId:"fqgsgl-0"})(["padding:0.5rem;padding-left:1.5rem;padding-right:1.5rem;color:inherit;background-color:rgba(255,255,255,0.4);text-decoration:none;border-radius:0px;border:1px solid rgba(255,255,255,0.8);text-transform:uppercase;border-radius:4px;"]);t.Z=n},1621:function(e,t,r){"use strict";var a=r(7294),n=r(9),i=r(5444);t.Z=function(e){var t=e.tags;return a.createElement(s,null,t&&t.map((function(e){return a.createElement(o,{key:e},a.createElement(i.Link,{to:"/tags/"+(t=e,t.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g).map((function(e){return e.toLowerCase()})).join("-"))},e));var t})))};var o=n.ZP.span.withConfig({displayName:"tags__Tag",componentId:"by516m-0"})(["margin-top:0.3rem;margin-bottom:0.3rem;text-transform:uppercase;font-size:var(--size-300);& a{position:relative;z-index:2;background-color:rgba(68,100,173,0.4);text-decoration:none;padding:0.2rem 0.2rem;color:inherit;border:1px solid rgba(255,255,255,1);border-radius:4px;}& a:hover{background-color:rgba(255,255,255,0.9);}"]),s=n.ZP.div.withConfig({displayName:"tags__StyledTags",componentId:"by516m-1"})(["display:flex;flex-direction:row;flex-wrap:wrap;margin-top:2rem;margin-bottom;2rem;"])},2295:function(e,t,r){"use strict";r.r(t);var a=r(7294),n=r(1397),i=r(4705),o=r(9),s=r(1444),l=(0,o.ZP)(s.Z).withConfig({displayName:"index-template___StyledStyledLink",componentId:"otyu5f-0"})(["display:block;margin-top:var(--size-800);margin-bottom:var(--size-800);margin-left:auto;margin-right:auto;width:fit-content;"]);t.default=function(e){var t=e.data,r=t.allMarkdownRemark.nodes,o=t.markdownRemark.html,s=t.markdownRemark.frontmatter.title;return a.createElement(n.Z,{title:s},a.createElement(m,{dangerouslySetInnerHTML:{__html:o}}),a.createElement(i.Z,{posts:r}),a.createElement(l,{to:"/blog"},"View All posts"))};var m=o.ZP.div.withConfig({displayName:"index-template__Intro",componentId:"otyu5f-1"})(["display:flex;flex-direction:column;max-width:60ch;align-items:center;margin-right:auto;margin-left:auto;margin-top:var(--size-800);margin-bottom:var(--size-900);text-align:center;& p{text-transform:capitalize;font-size:var(--size-400);}@media screen and (max-width:700px){& h1{font-size:var(--size-700);}}"])}}]);
//# sourceMappingURL=component---src-templates-index-template-js-64bbe0613139c5781bd0.js.map