(window.webpackJsonp=window.webpackJsonp||[]).push([[6],{RNiq:function(t,e,n){"use strict";n.r(e),n.d(e,"default",(function(){return s}));var r=n("q1tI"),o=n.n(r),i=(n("YFqc"),o.a.createElement);function s(){return i(o.a.Fragment,null,i("h1",null,"Hello and welcome to my website!"),i("section",null,i("h2",null,"A Note from DW"),i("article",null,i("p",null,"This is the official website for davidwesst, a.k.a. DW, a.k.a. Wessty."),i("p",null,"I managed to break something on the old site. Not sure what, but it's definitely broken, so rather than try and fix a thing I didn't understand (i.e. Hugo) I decided to stick to what I know, which is JavaScript."),i("p",null,"The catch is that I spend most of my B-time working on game development rather than web code, so I'll get to it eventually. :)")),i("article",null,i("h2",null,"In the meantime..."),i("p",null,"Why not check out my social link down below? You can usually get a hold of me there.")),i("footer",null,i("p",null,"Thanks for Playing!"),i("p",null,"~ DW"))),i("section",null,i("h2",null,"Social Links"),i("ul",null,i("li",null,i("a",{href:"https://youtube.com/davidwesst"},"YouTube Channel")," - This is where I post most content these days. It's mainly gamedev focused, but my old stuff is still there."),i("li",null,i("a",{href:"https://twitter.com/davidwesst"},"Twitter")),i("li",null,i("a",{href:"https://github.com/davidwesst"},"GitHub")))))}},YFqc:function(t,e,n){t.exports=n("cTJO")},cTJO:function(t,e,n){"use strict";var r=n("lwsE"),o=n("W8MJ"),i=n("7W2i"),s=n("a1gu"),a=n("Nsbk");function l(){if("undefined"===typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"===typeof Proxy)return!0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],(function(){}))),!0}catch(t){return!1}}var u=n("TqRt"),c=n("284h");e.__esModule=!0,e.default=void 0;var f,h=c(n("q1tI")),p=n("QmWs"),d=n("g/15"),v=u(n("nOHt")),m=n("elyg");function w(t){return t&&"object"===typeof t?(0,d.formatWithValidation)(t):t}var y=new Map,g=window.IntersectionObserver,k={};function b(){return f||(g?f=new g((function(t){t.forEach((function(t){if(y.has(t.target)){var e=y.get(t.target);(t.isIntersecting||t.intersectionRatio>0)&&(f.unobserve(t.target),y.delete(t.target),e())}}))}),{rootMargin:"200px"}):void 0)}var I=function(t){i(u,t);var e,n=(e=u,function(){var t,n=a(e);if(l()){var r=a(this).constructor;t=Reflect.construct(n,arguments,r)}else t=n.apply(this,arguments);return s(this,t)});function u(t){var e;return r(this,u),(e=n.call(this,t)).p=void 0,e.cleanUpListeners=function(){},e.formatUrls=function(t){var e=null,n=null,r=null;return function(o,i){if(r&&o===e&&i===n)return r;var s=t(o,i);return e=o,n=i,r=s,s}}((function(t,e){return{href:(0,m.addBasePath)(w(t)),as:e?(0,m.addBasePath)(w(e)):e}})),e.linkClicked=function(t){var n=t.currentTarget,r=n.nodeName,o=n.target;if("A"!==r||!(o&&"_self"!==o||t.metaKey||t.ctrlKey||t.shiftKey||t.nativeEvent&&2===t.nativeEvent.which)){var i=e.formatUrls(e.props.href,e.props.as),s=i.href,a=i.as;if(function(t){var e=(0,p.parse)(t,!1,!0),n=(0,p.parse)((0,d.getLocationOrigin)(),!1,!0);return!e.host||e.protocol===n.protocol&&e.host===n.host}(s)){var l=window.location.pathname;s=(0,p.resolve)(l,s),a=a?(0,p.resolve)(l,a):s,t.preventDefault();var u=e.props.scroll;null==u&&(u=a.indexOf("#")<0),v.default[e.props.replace?"replace":"push"](s,a,{shallow:e.props.shallow}).then((function(t){t&&u&&(window.scrollTo(0,0),document.body.focus())}))}}},e.p=!1!==t.prefetch,e}return o(u,[{key:"componentWillUnmount",value:function(){this.cleanUpListeners()}},{key:"getPaths",value:function(){var t=window.location.pathname,e=this.formatUrls(this.props.href,this.props.as),n=e.href,r=e.as,o=(0,p.resolve)(t,n);return[o,r?(0,p.resolve)(t,r):o]}},{key:"handleRef",value:function(t){var e=this;this.p&&g&&t&&t.tagName&&(this.cleanUpListeners(),k[this.getPaths().join("%")]||(this.cleanUpListeners=function(t,e){var n=b();return n?(n.observe(t),y.set(t,e),function(){try{n.unobserve(t)}catch(e){console.error(e)}y.delete(t)}):function(){}}(t,(function(){e.prefetch()}))))}},{key:"prefetch",value:function(t){if(this.p){var e=this.getPaths();v.default.prefetch(e[0],e[1],t).catch((function(t){0})),k[e.join("%")]=!0}}},{key:"render",value:function(){var t=this,e=this.props.children,n=this.formatUrls(this.props.href,this.props.as),r=n.href,o=n.as;"string"===typeof e&&(e=h.default.createElement("a",null,e));var i=h.Children.only(e),s={ref:function(e){t.handleRef(e),i&&"object"===typeof i&&i.ref&&("function"===typeof i.ref?i.ref(e):"object"===typeof i.ref&&(i.ref.current=e))},onMouseEnter:function(e){i.props&&"function"===typeof i.props.onMouseEnter&&i.props.onMouseEnter(e),t.prefetch({priority:!0})},onClick:function(e){i.props&&"function"===typeof i.props.onClick&&i.props.onClick(e),e.defaultPrevented||t.linkClicked(e)}};return!this.props.passHref&&("a"!==i.type||"href"in i.props)||(s.href=o||r),h.default.cloneElement(i,s)}}]),u}(h.Component);e.default=I},"m0L+":function(t,e,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/",function(){return n("RNiq")}])}},[["m0L+",0,2,1]]]);