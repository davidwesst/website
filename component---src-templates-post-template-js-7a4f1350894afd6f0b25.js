"use strict";(self.webpackChunkdw_website=self.webpackChunkdw_website||[]).push([[946],{1496:function(e,t,a){var r=a(5318);t.Z=void 0;var n,i=r(a(1506)),s=r(a(5354)),o=r(a(7316)),d=r(a(7154)),l=r(a(7294)),c=r(a(5697)),u=["sizes","srcSet","src","style","onLoad","onError","loading","draggable","ariaHidden"],f=function(e){var t=(0,d.default)({},e),a=t.resolutions,r=t.sizes,n=t.critical;return a&&(t.fixed=a,delete t.resolutions),r&&(t.fluid=r,delete t.sizes),n&&(t.loading="eager"),t.fluid&&(t.fluid=z([].concat(t.fluid))),t.fixed&&(t.fixed=z([].concat(t.fixed))),t},p=function(e){var t=e.media;return!!t&&(y&&!!window.matchMedia(t).matches)},m=function(e){var t=e.fluid,a=e.fixed,r=g(t||a||[]);return r&&r.src},g=function(e){if(y&&function(e){return!!e&&Array.isArray(e)&&e.some((function(e){return void 0!==e.media}))}(e)){var t=e.findIndex(p);if(-1!==t)return e[t];var a=e.findIndex((function(e){return void 0===e.media}));if(-1!==a)return e[a]}return e[0]},h=Object.create({}),b=function(e){var t=f(e),a=m(t);return h[a]||!1},v="undefined"!=typeof HTMLImageElement&&"loading"in HTMLImageElement.prototype,y="undefined"!=typeof window,w=y&&window.IntersectionObserver,E=new WeakMap;function S(e){return e.map((function(e){var t=e.src,a=e.srcSet,r=e.srcSetWebp,n=e.media,i=e.sizes;return l.default.createElement(l.default.Fragment,{key:t},r&&l.default.createElement("source",{type:"image/webp",media:n,srcSet:r,sizes:i}),a&&l.default.createElement("source",{media:n,srcSet:a,sizes:i}))}))}function z(e){var t=[],a=[];return e.forEach((function(e){return(e.media?t:a).push(e)})),[].concat(t,a)}function L(e){return e.map((function(e){var t=e.src,a=e.media,r=e.tracedSVG;return l.default.createElement("source",{key:t,media:a,srcSet:r})}))}function x(e){return e.map((function(e){var t=e.src,a=e.media,r=e.base64;return l.default.createElement("source",{key:t,media:a,srcSet:r})}))}function I(e,t){var a=e.srcSet,r=e.srcSetWebp,n=e.media,i=e.sizes;return"<source "+(t?"type='image/webp' ":"")+(n?'media="'+n+'" ':"")+'srcset="'+(t?r:a)+'" '+(i?'sizes="'+i+'" ':"")+"/>"}var R=function(e,t){var a=(void 0===n&&"undefined"!=typeof window&&window.IntersectionObserver&&(n=new window.IntersectionObserver((function(e){e.forEach((function(e){if(E.has(e.target)){var t=E.get(e.target);(e.isIntersecting||e.intersectionRatio>0)&&(n.unobserve(e.target),E.delete(e.target),t())}}))}),{rootMargin:"200px"})),n);return a&&(a.observe(e),E.set(e,t)),function(){a.unobserve(e),E.delete(e)}},k=function(e){var t=e.src?'src="'+e.src+'" ':'src="" ',a=e.sizes?'sizes="'+e.sizes+'" ':"",r=e.srcSet?'srcset="'+e.srcSet+'" ':"",n=e.title?'title="'+e.title+'" ':"",i=e.alt?'alt="'+e.alt+'" ':'alt="" ',s=e.width?'width="'+e.width+'" ':"",o=e.height?'height="'+e.height+'" ':"",d=e.crossOrigin?'crossorigin="'+e.crossOrigin+'" ':"",l=e.loading?'loading="'+e.loading+'" ':"",c=e.draggable?'draggable="'+e.draggable+'" ':"";return"<picture>"+e.imageVariants.map((function(e){return(e.srcSetWebp?I(e,!0):"")+I(e)})).join("")+"<img "+l+s+o+a+r+t+i+n+d+c+'style="position:absolute;top:0;left:0;opacity:1;width:100%;height:100%;object-fit:cover;object-position:center"/></picture>'},Z=l.default.forwardRef((function(e,t){var a=e.src,r=e.imageVariants,n=e.generateSources,i=e.spreadProps,s=e.ariaHidden,o=l.default.createElement(C,(0,d.default)({ref:t,src:a},i,{ariaHidden:s}));return r.length>1?l.default.createElement("picture",null,n(r),o):o})),C=l.default.forwardRef((function(e,t){var a=e.sizes,r=e.srcSet,n=e.src,i=e.style,s=e.onLoad,c=e.onError,f=e.loading,p=e.draggable,m=e.ariaHidden,g=(0,o.default)(e,u);return l.default.createElement("img",(0,d.default)({"aria-hidden":m,sizes:a,srcSet:r,src:n},g,{onLoad:s,onError:c,ref:t,loading:f,draggable:p,style:(0,d.default)({position:"absolute",top:0,left:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:"center"},i)}))}));C.propTypes={style:c.default.object,onError:c.default.func,onLoad:c.default.func};var O=function(e){function t(t){var a;(a=e.call(this,t)||this).seenBefore=y&&b(t),a.isCritical="eager"===t.loading||t.critical,a.addNoScript=!(a.isCritical&&!t.fadeIn),a.useIOSupport=!v&&w&&!a.isCritical&&!a.seenBefore;var r=a.isCritical||y&&(v||!a.useIOSupport);return a.state={isVisible:r,imgLoaded:!1,imgCached:!1,fadeIn:!a.seenBefore&&t.fadeIn,isHydrated:!1},a.imageRef=l.default.createRef(),a.placeholderRef=t.placeholderRef||l.default.createRef(),a.handleImageLoaded=a.handleImageLoaded.bind((0,i.default)(a)),a.handleRef=a.handleRef.bind((0,i.default)(a)),a}(0,s.default)(t,e);var a=t.prototype;return a.componentDidMount=function(){if(this.setState({isHydrated:y}),this.state.isVisible&&"function"==typeof this.props.onStartLoad&&this.props.onStartLoad({wasCached:b(this.props)}),this.isCritical){var e=this.imageRef.current;e&&e.complete&&this.handleImageLoaded()}},a.componentWillUnmount=function(){this.cleanUpListeners&&this.cleanUpListeners()},a.handleRef=function(e){var t=this;this.useIOSupport&&e&&(this.cleanUpListeners=R(e,(function(){var e=b(t.props);t.state.isVisible||"function"!=typeof t.props.onStartLoad||t.props.onStartLoad({wasCached:e}),t.setState({isVisible:!0},(function(){t.setState({imgLoaded:e,imgCached:!(!t.imageRef.current||!t.imageRef.current.currentSrc)})}))})))},a.handleImageLoaded=function(){var e,t,a;e=this.props,t=f(e),(a=m(t))&&(h[a]=!0),this.setState({imgLoaded:!0}),this.props.onLoad&&this.props.onLoad()},a.render=function(){var e=f(this.props),t=e.title,a=e.alt,r=e.className,n=e.style,i=void 0===n?{}:n,s=e.imgStyle,o=void 0===s?{}:s,c=e.placeholderStyle,u=void 0===c?{}:c,p=e.placeholderClassName,m=e.fluid,h=e.fixed,b=e.backgroundColor,v=e.durationFadeIn,y=e.Tag,w=e.itemProp,E=e.loading,z=e.draggable,I=m||h;if(!I)return null;var R=!1===this.state.fadeIn||this.state.imgLoaded,O=!0===this.state.fadeIn&&!this.state.imgCached,V=(0,d.default)({opacity:R?1:0,transition:O?"opacity "+v+"ms":"none"},o),H="boolean"==typeof b?"lightgray":b,T={transitionDelay:v+"ms"},P=(0,d.default)({opacity:this.state.imgLoaded?0:1},O&&T,o,u),N={title:t,alt:this.state.isVisible?"":a,style:P,className:p,itemProp:w},_=this.state.isHydrated?g(I):I[0];if(m)return l.default.createElement(y,{className:(r||"")+" gatsby-image-wrapper",style:(0,d.default)({position:"relative",overflow:"hidden",maxWidth:_.maxWidth?_.maxWidth+"px":null,maxHeight:_.maxHeight?_.maxHeight+"px":null},i),ref:this.handleRef,key:"fluid-"+JSON.stringify(_.srcSet)},l.default.createElement(y,{"aria-hidden":!0,style:{width:"100%",paddingBottom:100/_.aspectRatio+"%"}}),H&&l.default.createElement(y,{"aria-hidden":!0,title:t,style:(0,d.default)({backgroundColor:H,position:"absolute",top:0,bottom:0,opacity:this.state.imgLoaded?0:1,right:0,left:0},O&&T)}),_.base64&&l.default.createElement(Z,{ariaHidden:!0,ref:this.placeholderRef,src:_.base64,spreadProps:N,imageVariants:I,generateSources:x}),_.tracedSVG&&l.default.createElement(Z,{ariaHidden:!0,ref:this.placeholderRef,src:_.tracedSVG,spreadProps:N,imageVariants:I,generateSources:L}),this.state.isVisible&&l.default.createElement("picture",null,S(I),l.default.createElement(C,{alt:a,title:t,sizes:_.sizes,src:_.src,crossOrigin:this.props.crossOrigin,srcSet:_.srcSet,style:V,ref:this.imageRef,onLoad:this.handleImageLoaded,onError:this.props.onError,itemProp:w,loading:E,draggable:z})),this.addNoScript&&l.default.createElement("noscript",{dangerouslySetInnerHTML:{__html:k((0,d.default)({alt:a,title:t,loading:E},_,{imageVariants:I}))}}));if(h){var j=(0,d.default)({position:"relative",overflow:"hidden",display:"inline-block",width:_.width,height:_.height},i);return"inherit"===i.display&&delete j.display,l.default.createElement(y,{className:(r||"")+" gatsby-image-wrapper",style:j,ref:this.handleRef,key:"fixed-"+JSON.stringify(_.srcSet)},H&&l.default.createElement(y,{"aria-hidden":!0,title:t,style:(0,d.default)({backgroundColor:H,width:_.width,opacity:this.state.imgLoaded?0:1,height:_.height},O&&T)}),_.base64&&l.default.createElement(Z,{ariaHidden:!0,ref:this.placeholderRef,src:_.base64,spreadProps:N,imageVariants:I,generateSources:x}),_.tracedSVG&&l.default.createElement(Z,{ariaHidden:!0,ref:this.placeholderRef,src:_.tracedSVG,spreadProps:N,imageVariants:I,generateSources:L}),this.state.isVisible&&l.default.createElement("picture",null,S(I),l.default.createElement(C,{alt:a,title:t,width:_.width,height:_.height,sizes:_.sizes,src:_.src,crossOrigin:this.props.crossOrigin,srcSet:_.srcSet,style:V,ref:this.imageRef,onLoad:this.handleImageLoaded,onError:this.props.onError,itemProp:w,loading:E,draggable:z})),this.addNoScript&&l.default.createElement("noscript",{dangerouslySetInnerHTML:{__html:k((0,d.default)({alt:a,title:t,loading:E},_,{imageVariants:I}))}}))}return null},t}(l.default.Component);O.defaultProps={fadeIn:!0,durationFadeIn:500,alt:"",Tag:"div",loading:"lazy"};var V=c.default.shape({width:c.default.number.isRequired,height:c.default.number.isRequired,src:c.default.string.isRequired,srcSet:c.default.string.isRequired,base64:c.default.string,tracedSVG:c.default.string,srcWebp:c.default.string,srcSetWebp:c.default.string,media:c.default.string}),H=c.default.shape({aspectRatio:c.default.number.isRequired,src:c.default.string.isRequired,srcSet:c.default.string.isRequired,sizes:c.default.string.isRequired,base64:c.default.string,tracedSVG:c.default.string,srcWebp:c.default.string,srcSetWebp:c.default.string,media:c.default.string,maxWidth:c.default.number,maxHeight:c.default.number});function T(e){return function(t,a,r){var n;if(!t.fixed&&!t.fluid)throw new Error("The prop `fluid` or `fixed` is marked as required in `"+r+"`, but their values are both `undefined`.");c.default.checkPropTypes(((n={})[a]=e,n),t,"prop",r)}}O.propTypes={resolutions:V,sizes:H,fixed:T(c.default.oneOfType([V,c.default.arrayOf(V)])),fluid:T(c.default.oneOfType([H,c.default.arrayOf(H)])),fadeIn:c.default.bool,durationFadeIn:c.default.number,title:c.default.string,alt:c.default.string,className:c.default.oneOfType([c.default.string,c.default.object]),critical:c.default.bool,crossOrigin:c.default.oneOfType([c.default.string,c.default.bool]),style:c.default.object,imgStyle:c.default.object,placeholderStyle:c.default.object,placeholderClassName:c.default.string,backgroundColor:c.default.oneOfType([c.default.string,c.default.bool]),onLoad:c.default.func,onError:c.default.func,onStartLoad:c.default.func,Tag:c.default.string,itemProp:c.default.string,loading:c.default.oneOf(["auto","lazy","eager"]),draggable:c.default.bool};var P=O;t.Z=P},6576:function(e,t,a){a.d(t,{Z:function(){return i}});var r=a(7294),n=a(5444),i=function(e){var t=e.tags,a=e.showLabel;return r.createElement(r.Fragment,null,a?r.createElement("span",{className:"tags-module--TagsLabel--i-a+c"},"Tagged with"):"",t&&t.map((function(e){return r.createElement("span",{className:"tags-module--Tag--OE7fw",key:e},r.createElement(n.Link,{to:"/tags/"+(t=e,t.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g).map((function(e){return e.toLowerCase()})).join("-"))},e));var t})))}},9398:function(e,t,a){a.r(t),a.d(t,{default:function(){return y}});var r,n,i,s,o,d,l=a(1880),c=a(7294),u=a(5444),f=a(1496),p=a(9477),m=a(9),g=a(6576),h=function(e){var t=e.categories,a=e.showLabel;return c.createElement("div",null,a?c.createElement("span",{className:"categories-module--CategoriesLabel--dN+ff"},"Categorized under "):"",t&&t.map((function(e){return c.createElement("span",{key:e,className:"categories-module--Category--x-dkq"},c.createElement(u.Link,{to:"/categories/"+(t=e,t.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g).map((function(e){return e.toLowerCase()})).join("-"))},e));var t})))},b="graphcomment",v=function(){return(0,c.useEffect)((function(){window.gc_params={graphcomment_id:"davidwesst-com",fixed_header_height:0};var e=document.createElement("script");e.src="https://graphcomment.com/js/integration.js?"+Date.now(),e.async=!0;var t=document.getElementById(b);return t&&t.appendChild(e),function(){var e=document.getElementById(b);e&&(e.innerHTML="")}}),[]),c.createElement("div",{id:b})},y=function(e){var t=e.data,a=t.markdownRemark,r=a.frontmatter,n=a.html,i=a.fields,s=t.prev,o=t.next,d=r.social_image?c.createElement(z,null,c.createElement(f.Z,{fluid:r.social_image.childImageSharp.fluid})):"";return c.createElement(p.Z,{title:r.title,description:r.excerpt||r.description,socialImage:r.social_image?r.social_image.publicURL:""},c.createElement(w,null,c.createElement("article",null,c.createElement(E,null,r.title),c.createElement(S,null,r.date),c.createElement(h,{categories:r.categories,showLabel:!0}),d,c.createElement(L,{dangerouslySetInnerHTML:{__html:n}}),c.createElement(g.Z,{tags:r.tags})),c.createElement(v,{slug:i.slug}),c.createElement(x,null,s&&c.createElement("div",null,c.createElement("span",null,"previous"),c.createElement(u.Link,{to:s.fields.slug}," ",s.frontmatter.title)),o&&c.createElement("div",null,c.createElement("span",null,"next"),c.createElement(u.Link,{to:o.fields.slug}," ",o.frontmatter.title)))))},w=m.ZP.div(r||(r=(0,l.Z)(["\n  padding-top: var(--size-900);\n  padding-bottom: var(--size-900);\n  margin-left: auto;\n  margin-right: auto;\n  max-width: 70ch;\n  word-wrap: break-word;\n"]))),E=m.ZP.h1(n||(n=(0,l.Z)(["\n  font-size: var(--size-700);\n"]))),S=m.ZP.span(i||(i=(0,l.Z)(["\n  font-size: var(--size-400);\n  padding-top: 1rem;\n  text-transform: uppercase;\n"]))),z=m.ZP.div(s||(s=(0,l.Z)(["\n  margin-top: 1rem;\n  margin-bottom: 1rem;\n"]))),L=m.ZP.section(o||(o=(0,l.Z)(["\n  padding-top: var(--size-800);\n\n  & > * + * {\n    margin-top: var(--size-300);\n  }\n\n  & > p + p {\n    margin-top: var(--size-700);\n  }\n\n  * + h1,\n  * + h2,\n  * + h3 {\n    margin-top: var(--size-900);\n  }\n\n  h1 {\n    font-size: var(--size-700);\n  }\n\n  h2 {\n    font-size: var(--size-600);\n  }\n\n  h3 {\n    font-size: var(--size-500);\n  }\n\n  b,\n  strong {\n    font-weight: 600;\n  }\n\n  a {\n    color: inherit;\n    text-decoration: underline;\n    text-decoration-thickness: 0.125rem;\n  }\n\n  blockquote {\n    padding-left: var(--size-400);\n    border-left: 5px solid;\n    font-style: italic;\n  }\n\n  code {\n    font-family: 'Source Sans Pro', monospace;\n    overflow-x: auto;\n    white-space: pre-wrap;\n  }\n\n  pre {\n    overflow-x: auto;\n    white-space: pre-wrap;\n    max-width: 100%;\n  }\n"]))),x=m.ZP.nav(d||(d=(0,l.Z)(["\n  display: flex;\n  flex-wrap: wrap;\n  margin-top: var(--size-900);\n\n  & > * {\n    position: relative;\n    flex: 1;\n    display: flex;\n    flex-direction: column;\n    padding: 1rem;\n    padding-top: 0.5rem;\n    padding-bottom: 0.5rem;\n    border-radius: 8px;\n    border: 1px solid rgba(255, 255, 255, 0.5);\n    background-color: rgba(255, 255, 255, 0.3);\n    backdrop-filter: blur(10px);\n    margin: 0.5rem;\n  }\n\n  & > *:hover {\n    background-color: rgba(255, 255, 255, 0.5);\n  }\n\n  & span {\n    text-transform: uppercase;\n    opacity: 0.6;\n    font-size: var(--size-400);\n    padding-bottom: var(--size-500);\n  }\n\n  & a {\n    color: inherit;\n    text-decoration: none;\n    font-size: var(--size-400);\n    text-transform: capitalize;\n  }\n\n  & a::after {\n    content: '';\n    position: absolute;\n    left: 0;\n    right: 0;\n    top: 0;\n    bottom: 0;\n  }\n"])))}}]);
//# sourceMappingURL=component---src-templates-post-template-js-7a4f1350894afd6f0b25.js.map