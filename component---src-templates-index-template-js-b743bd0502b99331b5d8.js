(self.webpackChunkdw_website=self.webpackChunkdw_website||[]).push([[509],{3899:function(e,t,a){"use strict";var r=a(7294),i=a(9),n=a(5444);t.Z=function(e){var t=e.categories,a=e.showLabel;return r.createElement("div",null,a?r.createElement(l,null,"Categorized under "):"",t&&t.map((function(e){return r.createElement(o,{key:e},r.createElement(n.Link,{to:"/categories/"+(t=e,t.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g).map((function(e){return e.toLowerCase()})).join("-"))},e));var t})))};var o=i.ZP.span.withConfig({displayName:"categories__Category",componentId:"sc-2yqpc4-0"})(["margin-right:0.6rem;margin-bottom:0.6rem;text-transform:uppercase;font-size:var(--size-300);& a{position:relative;z-index:2;background-color:rgba(255,255,255,0.7);text-decoration:none;color:inherit;padding:0.2rem 0.6rem;border:1px solid rgba(255,255,255,1);border-radius:4px;}& a:hover{background-color:rgba(255,255,255,0.9);}"]),l=i.ZP.span.withConfig({displayName:"categories__CategoriesLabel",componentId:"sc-2yqpc4-1"})(["margin-right:0.25rem;vertical-align:middle;"])},7383:function(e,t,a){"use strict";var r=a(7294),i=a(9),n=a(5444),o=a(1621),l=a(3899);t.Z=function(e){var t=e.posts.map((function(e){var t=e.frontmatter,a=e.fields,i=e.excerpt,n=e.timeToRead,o=t.title,l=t.tags,m=t.categories,d=t.date,c=t.description,p=a.slug;return r.createElement(s,{key:p,tags:l,categories:m,title:o,date:d,slug:p,timeToRead:n,description:c,excerpt:i})}));return r.createElement(m,null,t)};var s=function(e){var t=e.title,a=e.date,i=e.timeToRead,s=e.tags,m=e.categories,u=e.excerpt,f=e.description,b=e.slug;return r.createElement(d,null,r.createElement(l.Z,{categories:m}),r.createElement(c,null,r.createElement(n.Link,{to:b},t)),r.createElement(p,{dangerouslySetInnerHTML:{__html:f||u}}),r.createElement(o.Z,{tags:s}),r.createElement(g,null,r.createElement("span",null,a),r.createElement("span",null,i," mins")))},m=i.ZP.ul.withConfig({displayName:"post-list__StyledPostList",componentId:"sc-13lj44o-0"})(["padding:0;list-style:none;display:grid;justify-items:center;grid-gap:var(--size-600);grid-template-columns:repeat(auto-fit,minmax(35ch,1fr));@media screen and (max-width:500px){&{display:block;}}"]),d=i.ZP.li.withConfig({displayName:"post-list__StyledPostListItem",componentId:"sc-13lj44o-1"})(["position:relative;display:flex;flex-direction:column;padding:1.5rem;border:1px solid rgba(255,255,255,0.5);background-color:rgba(255,255,255,0.3);backdrop-filter:blur(10px);border-radius:8px;&:hover{background-color:rgba(255,255,255,0.5);}@media screen and (max-width:500px){&{margin-top:var(--size-600);}}"]),c=i.ZP.h2.withConfig({displayName:"post-list__PostListTitle",componentId:"sc-13lj44o-2"})(["line-height:1.2;margin-top:1rem;margin-bottom:1rem;text-transform:capitalize;font-size:var(--size-600);font-weight:700;& a{text-decoration:none;color:inherit;}& a::after{content:'';position:absolute;top:0;bottom:0;left:0;right:0;}"]),p=i.ZP.p.withConfig({displayName:"post-list__PostListExcerpt",componentId:"sc-13lj44o-3"})(["margin-top:auto;font-size:var(--size-400);"]),g=i.ZP.div.withConfig({displayName:"post-list__PostListMeta",componentId:"sc-13lj44o-4"})(["margin-top:2rem;font-size:var(--size-300);display:flex;justify-content:space-between;"])},1444:function(e,t,a){"use strict";var r=a(5444),i=(0,a(9).ZP)(r.Link).withConfig({displayName:"styled-link__StyledLink",componentId:"fqgsgl-0"})(["padding:0.5rem;padding-left:1.5rem;padding-right:1.5rem;color:inherit;background-color:rgba(255,255,255,0.4);text-decoration:none;border-radius:0px;border:1px solid rgba(255,255,255,0.8);text-transform:uppercase;border-radius:4px;"]);t.Z=i},1621:function(e,t,a){"use strict";var r=a(7294),i=a(9),n=a(5444);t.Z=function(e){var t=e.tags,a=e.showLabel;return r.createElement(l,null,a?r.createElement(s,null,"Tagged with"):"",t&&t.map((function(e){return r.createElement(o,{key:e},r.createElement(n.Link,{to:"/tags/"+(t=e,t.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g).map((function(e){return e.toLowerCase()})).join("-"))},e));var t})))};var o=i.ZP.span.withConfig({displayName:"tags__Tag",componentId:"by516m-0"})(["margin-top:0.3rem;margin-bottom:0.3rem;text-transform:uppercase;font-size:var(--size-300);& a{position:relative;z-index:2;background-color:rgba(68,100,173,0.4);text-decoration:none;padding:0.2rem 0.2rem;color:inherit;border:1px solid rgba(255,255,255,1);border-radius:4px;}& a:hover{background-color:rgba(255,255,255,0.9);}"]),l=i.ZP.div.withConfig({displayName:"tags__StyledTags",componentId:"by516m-1"})(["display:flex;flex-direction:row;flex-wrap:wrap;margin-top:2rem;margin-bottom:2rem;"]),s=i.ZP.span.withConfig({displayName:"tags__TagsLabel",componentId:"by516m-2"})(["margin-right:0.25rem;vertical-align:middle;"])},2295:function(e,t,a){"use strict";a.r(t);var r=a(7294),i=a(1397),n=a(7383),o=a(9),l=a(1444),s=(0,o.ZP)(l.Z).withConfig({displayName:"index-template___StyledStyledLink",componentId:"otyu5f-0"})(["display:block;margin-top:var(--size-800);margin-bottom:var(--size-800);margin-left:auto;margin-right:auto;width:fit-content;"]);t.default=function(e){var t=e.data,a=t.allMarkdownRemark.nodes,o=t.markdownRemark.html,l=t.markdownRemark.frontmatter.title;return r.createElement(i.Z,{title:l},r.createElement(m,{dangerouslySetInnerHTML:{__html:o}}),r.createElement(n.Z,{posts:a}),r.createElement(s,{to:"/blog"},"View All posts"))};var m=o.ZP.div.withConfig({displayName:"index-template__Intro",componentId:"otyu5f-1"})(["display:flex;flex-direction:column;max-width:60ch;align-items:center;margin-right:auto;margin-left:auto;margin-top:var(--size-800);margin-bottom:var(--size-900);text-align:center;& p{text-transform:capitalize;font-size:var(--size-400);}@media screen and (max-width:700px){& h1{font-size:var(--size-700);}}"])}}]);
//# sourceMappingURL=component---src-templates-index-template-js-b743bd0502b99331b5d8.js.map