(window.webpackJsonp=window.webpackJsonp||[]).push([[5],{Juyh:function(t,e,n){"use strict";n.r(e),n.d(e,"default",(function(){return c}));var r=n("q1tI"),o=n.n(r),i=n("YFqc"),a=n.n(i),s=o.a.createElement;function c(){return s(o.a.Fragment,null,s("h1",null,"About DW!"),s(a.a,{href:"/"},s("a",null,"Go Back Home")))}},NW6U:function(t,e,n){(window.__NEXT_P=window.__NEXT_P||[]).push(["/about",function(){return n("Juyh")}])},YFqc:function(t,e,n){t.exports=n("cTJO")},cTJO:function(t,e,n){"use strict";var r=n("lwsE"),o=n("W8MJ"),i=n("7W2i"),a=n("a1gu"),s=n("Nsbk");function c(){if("undefined"===typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"===typeof Proxy)return!0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],(function(){}))),!0}catch(t){return!1}}var u=n("TqRt"),f=n("284h");e.__esModule=!0,e.default=void 0;var l,p=f(n("q1tI")),h=n("QmWs"),v=n("g/15"),d=u(n("nOHt")),y=n("elyg");function w(t){return t&&"object"===typeof t?(0,v.formatWithValidation)(t):t}var g=new Map,m=window.IntersectionObserver,k={};function b(){return l||(m?l=new m((function(t){t.forEach((function(t){if(g.has(t.target)){var e=g.get(t.target);(t.isIntersecting||t.intersectionRatio>0)&&(l.unobserve(t.target),g.delete(t.target),e())}}))}),{rootMargin:"200px"}):void 0)}var E=function(t){i(u,t);var e,n=(e=u,function(){var t,n=s(e);if(c()){var r=s(this).constructor;t=Reflect.construct(n,arguments,r)}else t=n.apply(this,arguments);return a(this,t)});function u(t){var e;return r(this,u),(e=n.call(this,t)).p=void 0,e.cleanUpListeners=function(){},e.formatUrls=function(t){var e=null,n=null,r=null;return function(o,i){if(r&&o===e&&i===n)return r;var a=t(o,i);return e=o,n=i,r=a,a}}((function(t,e){return{href:(0,y.addBasePath)(w(t)),as:e?(0,y.addBasePath)(w(e)):e}})),e.linkClicked=function(t){var n=t.currentTarget,r=n.nodeName,o=n.target;if("A"!==r||!(o&&"_self"!==o||t.metaKey||t.ctrlKey||t.shiftKey||t.nativeEvent&&2===t.nativeEvent.which)){var i=e.formatUrls(e.props.href,e.props.as),a=i.href,s=i.as;if(function(t){var e=(0,h.parse)(t,!1,!0),n=(0,h.parse)((0,v.getLocationOrigin)(),!1,!0);return!e.host||e.protocol===n.protocol&&e.host===n.host}(a)){var c=window.location.pathname;a=(0,h.resolve)(c,a),s=s?(0,h.resolve)(c,s):a,t.preventDefault();var u=e.props.scroll;null==u&&(u=s.indexOf("#")<0),d.default[e.props.replace?"replace":"push"](a,s,{shallow:e.props.shallow}).then((function(t){t&&u&&(window.scrollTo(0,0),document.body.focus())}))}}},e.p=!1!==t.prefetch,e}return o(u,[{key:"componentWillUnmount",value:function(){this.cleanUpListeners()}},{key:"getPaths",value:function(){var t=window.location.pathname,e=this.formatUrls(this.props.href,this.props.as),n=e.href,r=e.as,o=(0,h.resolve)(t,n);return[o,r?(0,h.resolve)(t,r):o]}},{key:"handleRef",value:function(t){var e=this;this.p&&m&&t&&t.tagName&&(this.cleanUpListeners(),k[this.getPaths().join("%")]||(this.cleanUpListeners=function(t,e){var n=b();return n?(n.observe(t),g.set(t,e),function(){try{n.unobserve(t)}catch(e){console.error(e)}g.delete(t)}):function(){}}(t,(function(){e.prefetch()}))))}},{key:"prefetch",value:function(t){if(this.p){var e=this.getPaths();d.default.prefetch(e[0],e[1],t).catch((function(t){0})),k[e.join("%")]=!0}}},{key:"render",value:function(){var t=this,e=this.props.children,n=this.formatUrls(this.props.href,this.props.as),r=n.href,o=n.as;"string"===typeof e&&(e=p.default.createElement("a",null,e));var i=p.Children.only(e),a={ref:function(e){t.handleRef(e),i&&"object"===typeof i&&i.ref&&("function"===typeof i.ref?i.ref(e):"object"===typeof i.ref&&(i.ref.current=e))},onMouseEnter:function(e){i.props&&"function"===typeof i.props.onMouseEnter&&i.props.onMouseEnter(e),t.prefetch({priority:!0})},onClick:function(e){i.props&&"function"===typeof i.props.onClick&&i.props.onClick(e),e.defaultPrevented||t.linkClicked(e)}};return!this.props.passHref&&("a"!==i.type||"href"in i.props)||(a.href=o||r),p.default.cloneElement(i,a)}}]),u}(p.Component);e.default=E}},[["NW6U",0,2,1]]]);