(self.webpackChunkdw_website=self.webpackChunkdw_website||[]).push([[7],{3899:function(e,t,a){"use strict";var r=a(7294),i=a(9),n=a(5444);t.Z=function(e){var t=e.categories,a=e.showLabel;return r.createElement("div",null,a?r.createElement(l,null,"Categorized under "):"",t&&t.map((function(e){return r.createElement(o,{key:e},r.createElement(n.Link,{to:"/categories/"+(t=e,t.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g).map((function(e){return e.toLowerCase()})).join("-"))},e));var t})))};var o=i.ZP.span.withConfig({displayName:"categories__Category",componentId:"sc-2yqpc4-0"})(["margin-right:0.6rem;margin-bottom:0.6rem;text-transform:uppercase;font-size:var(--size-300);& a{position:relative;z-index:2;background-color:rgba(255,255,255,0.7);text-decoration:none;color:inherit;padding:0.2rem 0.6rem;border:1px solid rgba(255,255,255,1);border-radius:4px;}& a:hover{background-color:rgba(255,255,255,0.9);}"]),l=i.ZP.span.withConfig({displayName:"categories__CategoriesLabel",componentId:"sc-2yqpc4-1"})(["margin-right:0.25rem;vertical-align:middle;"])},7383:function(e,t,a){"use strict";var r=a(7294),i=a(9),n=a(5444),o=a(1621),l=a(3899);t.Z=function(e){var t=e.posts.map((function(e){var t=e.frontmatter,a=e.fields,i=e.excerpt,n=e.timeToRead,o=t.title,l=t.tags,c=t.categories,m=t.date,d=a.slug;return r.createElement(s,{key:d,tags:l,categories:c,title:o,date:m,slug:d,timeToRead:n,description:t.excerpt,excerpt:i})}));return r.createElement(c,null,t)};var s=function(e){var t=e.title,a=e.date,i=e.timeToRead,s=e.tags,c=e.categories,u=e.excerpt,f=e.description,b=e.slug;return r.createElement(m,null,r.createElement(l.Z,{categories:c}),r.createElement(d,null,r.createElement(n.Link,{to:b},t)),r.createElement(p,{dangerouslySetInnerHTML:{__html:f||u}}),r.createElement(o.Z,{tags:s}),r.createElement(g,null,r.createElement("span",null,a),r.createElement("span",null,i," mins")))},c=i.ZP.ul.withConfig({displayName:"post-list__StyledPostList",componentId:"sc-13lj44o-0"})(["padding:0;list-style:none;display:grid;justify-items:center;grid-gap:var(--size-600);grid-template-columns:repeat(auto-fit,minmax(35ch,1fr));@media screen and (max-width:500px){&{display:block;}}"]),m=i.ZP.li.withConfig({displayName:"post-list__StyledPostListItem",componentId:"sc-13lj44o-1"})(["position:relative;display:flex;flex-direction:column;padding:1.5rem;border:1px solid rgba(255,255,255,0.5);background-color:rgba(255,255,255,0.3);backdrop-filter:blur(10px);border-radius:8px;&:hover{background-color:rgba(255,255,255,0.5);}@media screen and (max-width:500px){&{margin-top:var(--size-600);}}"]),d=i.ZP.h2.withConfig({displayName:"post-list__PostListTitle",componentId:"sc-13lj44o-2"})(["line-height:1.2;margin-top:1rem;margin-bottom:1rem;text-transform:capitalize;font-size:var(--size-600);font-weight:700;& a{text-decoration:none;color:inherit;}& a::after{content:'';position:absolute;top:0;bottom:0;left:0;right:0;}"]),p=i.ZP.p.withConfig({displayName:"post-list__PostListExcerpt",componentId:"sc-13lj44o-3"})(["margin-top:auto;font-size:var(--size-400);"]),g=i.ZP.div.withConfig({displayName:"post-list__PostListMeta",componentId:"sc-13lj44o-4"})(["margin-top:2rem;font-size:var(--size-300);display:flex;justify-content:space-between;"])},1621:function(e,t,a){"use strict";var r=a(7294),i=a(9),n=a(5444);t.Z=function(e){var t=e.tags,a=e.showLabel;return r.createElement(l,null,a?r.createElement(s,null,"Tagged with"):"",t&&t.map((function(e){return r.createElement(o,{key:e},r.createElement(n.Link,{to:"/tags/"+(t=e,t.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g).map((function(e){return e.toLowerCase()})).join("-"))},e));var t})))};var o=i.ZP.span.withConfig({displayName:"tags__Tag",componentId:"by516m-0"})(["margin-top:0.3rem;margin-bottom:0.3rem;text-transform:uppercase;font-size:var(--size-300);& a{position:relative;z-index:2;background-color:rgba(68,100,173,0.4);text-decoration:none;padding:0.2rem 0.2rem;color:inherit;border:1px solid rgba(255,255,255,1);border-radius:4px;}& a:hover{background-color:rgba(255,255,255,0.9);}"]),l=i.ZP.div.withConfig({displayName:"tags__StyledTags",componentId:"by516m-1"})(["display:flex;flex-direction:row;flex-wrap:wrap;margin-top:2rem;margin-bottom:2rem;"]),s=i.ZP.span.withConfig({displayName:"tags__TagsLabel",componentId:"by516m-2"})(["margin-right:0.25rem;vertical-align:middle;"])},223:function(e,t,a){"use strict";a.r(t);var r=a(7294),i=a(5444),n=a(6480),o=a(7383),l=a(9),s=(0,l.ZP)(i.Link).withConfig({displayName:"blog___StyledLink",componentId:"sc-1gsqa75-0"})(["margin-top:var(--size-400);margin-right:1rem;color:inherit;text-transform:uppercase;"]),c=(0,l.ZP)(i.Link).withConfig({displayName:"blog___StyledLink2",componentId:"sc-1gsqa75-1"})(["margin-top:var(--size-400);color:inherit;text-transform:uppercase;"]);t.default=function(e){var t=e.data.allMarkdownRemark.nodes;return r.createElement(n.Z,{title:"Blog"},r.createElement(m,null,r.createElement("h1",null,"Blog"),r.createElement(d,null,r.createElement(s,{to:"/tags"},"view all tags"),r.createElement(c,{to:"/categories"},"view all categories"))),r.createElement(o.Z,{posts:t}))};var m=l.ZP.div.withConfig({displayName:"blog__HeaderWrapper",componentId:"sc-1gsqa75-2"})(["display:flex;flex-direction:column;margin-top:var(--size-900);margin-bottom:var(--size-700);h1{max-width:none;}"]),d=l.ZP.div.withConfig({displayName:"blog__StyledMetaLinks",componentId:"sc-1gsqa75-3"})(["display:flex;flex-direction:row;"])}}]);
//# sourceMappingURL=component---src-pages-blog-js-98f718f405535de34c59.js.map