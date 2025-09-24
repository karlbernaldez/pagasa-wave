import{d as t,r as b,j as r}from"./index-CbM3mBlV.js";import{W as m}from"./wind-CnGxrsCz.js";import{c as g}from"./createLucideIcon-BvXpfdCH.js";import{E as C}from"./eye-2Fu8EHtf.js";import{T as _}from"./trending-up-CKIPuI1F.js";import{T as $}from"./thermometer-DtwsEuYh.js";import{C as W}from"./cloud-rain-CO_z5SpS.js";import{S}from"./sun-zLVnWhv0.js";import{X as M}from"./x-D_uShodW.js";/**
 * @license lucide-react v0.525.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z=[["path",{d:"M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2",key:"169zse"}]],x=g("activity",z);/**
 * @license lucide-react v0.525.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const D=[["path",{d:"m12 14 4-4",key:"9kzdfg"}],["path",{d:"M3.34 19a10 10 0 1 1 17.32 0",key:"19p75a"}]],P=g("gauge",D);/**
 * @license lucide-react v0.525.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const H=[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["line",{x1:"21",x2:"16.65",y1:"21",y2:"16.65",key:"13gj7c"}],["line",{x1:"11",x2:"11",y1:"8",y2:"14",key:"1vmskp"}],["line",{x1:"8",x2:"14",y1:"11",y2:"11",key:"durymu"}]],I=g("zoom-in",H),L=t.div`
  min-height: 100vh;
  background: ${e=>e.isDarkMode?"linear-gradient(135deg, #111827 0%, #1e3a8a 20%, #111827 100%)":"linear-gradient(135deg, #dbeafe 0%, #ffffff 50%, #e0f2fe 100%)"};
  padding-top: 6rem;
  padding-bottom: 4rem;
`,T=t.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem;
  
  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`,A=t.div`
  text-align: center;
  margin-bottom: 4rem;
`,R=t.h1`
  font-size: 2.5rem;
  font-weight: 800;
  color: ${e=>e.isDarkMode?"#ffffff":"#111827"};
  margin-bottom: 1rem;
  
  @media (min-width: 640px) {
    font-size: 3rem;
  }
`,F=t.span`
  background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`,E=t.p`
  font-size: 1.125rem;
  color: ${e=>e.isDarkMode?"#d1d5db":"#4b5563"};
  max-width: 600px;
  margin: 0 auto;
`,B=t.div`
  display: flex;
  justify-content: center;
  margin-bottom: 3rem;
`,G=t.div`
  display: flex;
  background: ${e=>e.isDarkMode?"rgba(31, 41, 55, 0.8)":"rgba(255, 255, 255, 0.9)"};
  backdrop-filter: blur(20px);
  border: 1px solid ${e=>e.isDarkMode?"rgba(75, 85, 99, 0.3)":"rgba(255, 255, 255, 0.2)"};
  border-radius: 1rem;
  padding: 0.5rem;
  box-shadow: ${e=>e.isDarkMode?"0 10px 40px rgba(0, 0, 0, 0.3)":"0 10px 40px rgba(0, 0, 0, 0.1)"};
  
  @media (max-width: 640px) {
    flex-direction: column;
    width: 100%;
    max-width: 300px;
  }
`,N=t.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  background: ${e=>e.active?"linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)":"transparent"};
  color: ${e=>e.active?"#ffffff":e.isDarkMode?"#d1d5db":"#4b5563"};
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  white-space: nowrap;
  
  &:hover {
    background: ${e=>e.active?"linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%)":e.isDarkMode?"rgba(55, 65, 81, 0.5)":"rgba(243, 244, 246, 0.8)"};
    transform: translateY(-1px);
  }
  
  svg {
    width: 1.125rem;
    height: 1.125rem;
  }
  
  @media (max-width: 640px) {
    justify-content: center;
  }
`,O=t.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  margin-bottom: 3rem;
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
`,V=t.div`
  background: ${e=>e.isDarkMode?"rgba(31, 41, 55, 0.8)":"rgba(255, 255, 255, 0.9)"};
  backdrop-filter: blur(20px);
  border: 1px solid ${e=>e.isDarkMode?"rgba(75, 85, 99, 0.3)":"rgba(255, 255, 255, 0.2)"};
  border-radius: 1.5rem;
  padding: 2rem;
  box-shadow: ${e=>e.isDarkMode?"0 25px 50px -12px rgba(0, 0, 0, 0.5)":"0 25px 50px -12px rgba(0, 0, 0, 0.1)"};
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${e=>e.isDarkMode?"0 35px 60px -12px rgba(0, 0, 0, 0.6)":"0 35px 60px -12px rgba(0, 0, 0, 0.15)"};
  }
`,q=t.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${e=>e.isDarkMode?"rgba(75, 85, 99, 0.3)":"rgba(229, 231, 235, 0.5)"};
`,Y=t.div`
  width: 2.5rem;
  height: 2.5rem;
  background: linear-gradient(135deg, ${e=>e.color} 0%, ${e=>e.colorSecondary} 100%);
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px ${e=>e.color}40;
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
    color: white;
  }
`,U=t.div`
  flex: 1;
`,X=t.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${e=>e.isDarkMode?"#ffffff":"#111827"};
  margin-bottom: 0.25rem;
`,Z=t.p`
  font-size: 0.875rem;
  color: ${e=>e.isDarkMode?"#9ca3af":"#6b7280"};
`,J=t.div`
  position: relative;
  height: 280px;
  background: ${e=>e.isDarkMode?"linear-gradient(135deg, #1f2937 0%, #374151 100%)":"linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)"};
  border-radius: 1rem;
  margin-bottom: 1.5rem;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${e=>e.isDarkMode?"rgba(75, 85, 99, 0.2)":"rgba(203, 213, 225, 0.3)"};
  cursor: pointer;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.02);
  }
  
  /* Hover hint styling */
  & > div:last-child {
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  &:hover > div:last-child {
    opacity: 1;
  }
`,K=t.div`
  text-align: center;
  color: ${e=>e.isDarkMode?"#6b7280":"#94a3b8"};
`,Q=t.div`
  width: 4rem;
  height: 4rem;
  background: ${e=>e.isDarkMode?"rgba(55, 65, 81, 0.5)":"rgba(226, 232, 240, 0.8)"};
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  
  svg {
    width: 2rem;
    height: 2rem;
    color: ${e=>e.isDarkMode?"#9ca3af":"#64748b"};
  }
`,ee=t.p`
  font-size: 1rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
`,re=t.p`
  font-size: 0.875rem;
  opacity: 0.7;
`,te=t.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
`,ae=t.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: ${e=>e.isDarkMode?"rgba(17, 24, 39, 0.5)":"rgba(248, 250, 252, 0.8)"};
  border-radius: 0.75rem;
  border: 1px solid ${e=>e.isDarkMode?"rgba(55, 65, 81, 0.3)":"rgba(226, 232, 240, 0.5)"};
`,ie=t.div`
  width: 0.75rem;
  height: 0.75rem;
  background: ${e=>e.color};
  border-radius: 50%;
  box-shadow: 0 0 8px ${e=>e.color}40;
`,oe=t.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${e=>e.isDarkMode?"#d1d5db":"#374151"};
`,ne=t.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${e=>e.isDarkMode?"#ffffff":"#111827"};
  margin-left: auto;
`,se=t.div`
  background: ${e=>e.isDarkMode?"rgba(31, 41, 55, 0.8)":"rgba(255, 255, 255, 0.9)"};
  backdrop-filter: blur(20px);
  border: 1px solid ${e=>e.isDarkMode?"rgba(75, 85, 99, 0.3)":"rgba(255, 255, 255, 0.2)"};
  border-radius: 1.5rem;
  padding: 2rem;
  box-shadow: ${e=>e.isDarkMode?"0 25px 50px -12px rgba(0, 0, 0, 0.5)":"0 25px 50px -12px rgba(0, 0, 0, 0.1)"};
`,de=t.h3`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${e=>e.isDarkMode?"#ffffff":"#111827"};
  margin-bottom: 1.5rem;
  text-align: center;
`,le=t.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
`,ce=t.div`
  background: ${e=>e.isDarkMode?"rgba(17, 24, 39, 0.5)":"rgba(248, 250, 252, 0.8)"};
  border-radius: 1rem;
  padding: 1.5rem;
  border: 1px solid ${e=>e.isDarkMode?"rgba(55, 65, 81, 0.3)":"rgba(226, 232, 240, 0.5)"};
`,me=t.h4`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${e=>e.isDarkMode?"#ffffff":"#111827"};
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
    color: ${e=>e.color};
  }
`,ge=t.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`,he=t.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`,pe=t.div`
  width: 1rem;
  height: 1rem;
  background: ${e=>e.color};
  border-radius: 0.25rem;
  box-shadow: 0 0 8px ${e=>e.color}30;
`,be=t.span`
  font-size: 0.875rem;
  color: ${e=>e.isDarkMode?"#d1d5db":"#374151"};
`,$e=({isDarkMode:e})=>{const[s,f]=b.useState("wave-wind"),[c,h]=b.useState(null),v=[{id:"wave-wind",name:"Wave and Wind",icon:m},{id:"wave-only",name:"Wave Only",icon:x},{id:"visually-impaired",name:"For Visually Impaired",icon:C}],u={1:{title:"Wave Analysis",subtitle:"Current Wave Conditions & Patterns",icon:x,color:"#06b6d4",colorSecondary:"#0891b2"},2:{title:"24-h Prognostic Wave Chart",subtitle:"24-Hour Wave Height & Direction Forecast",icon:_,color:"#10b981",colorSecondary:"#059669"},3:{title:"36-h Prognostic Wave Chart",subtitle:"36-Hour Extended Wave Forecast",icon:m,color:"#f59e0b",colorSecondary:"#d97706"},4:{title:"48-h Prognostic Wave Chart",subtitle:"48-Hour Long-Range Wave Forecast",icon:P,color:"#8b5cf6",colorSecondary:"#7c3aed"}},y=[{id:1,labels:[{name:"Wave Height",value:"2.1m",color:"#06b6d4"},{name:"Period",value:"8.5s",color:"#3b82f6"},{name:"Direction",value:"SW",color:"#10b981"},{name:"Energy",value:"High",color:"#f59e0b"}]},{id:2,labels:[{name:"Max Height",value:"2.8m",color:"#10b981"},{name:"Min Height",value:"1.5m",color:"#3b82f6"},{name:"Avg Period",value:"7.2s",color:"#06b6d4"},{name:"Dominant Dir",value:"WSW",color:"#f59e0b"}]},{id:3,labels:[{name:"Max Height",value:"3.2m",color:"#f59e0b"},{name:"Min Height",value:"1.8m",color:"#3b82f6"},{name:"Avg Period",value:"9.1s",color:"#06b6d4"},{name:"Dominant Dir",value:"W",color:"#10b981"}]},{id:4,labels:[{name:"Max Height",value:"3.5m",color:"#8b5cf6"},{name:"Min Height",value:"2.0m",color:"#3b82f6"},{name:"Avg Period",value:"10.3s",color:"#06b6d4"},{name:"Dominant Dir",value:"WNW",color:"#ef4444"}]}],w=[{title:"Temperature Scale",icon:$,color:"#ef4444",items:[{color:"#dc2626",text:"Above 35°C - Very Hot"},{color:"#ef4444",text:"30-35°C - Hot"},{color:"#f59e0b",text:"25-30°C - Warm"},{color:"#10b981",text:"20-25°C - Comfortable"},{color:"#3b82f6",text:"Below 20°C - Cool"}]},{title:"Wind Speed",icon:m,color:"#3b82f6",items:[{color:"#dc2626",text:"Above 50 km/h - Strong Winds"},{color:"#f59e0b",text:"25-50 km/h - Moderate Winds"},{color:"#10b981",text:"10-25 km/h - Light Winds"},{color:"#3b82f6",text:"Below 10 km/h - Calm"}]},{title:"Precipitation",icon:W,color:"#06b6d4",items:[{color:"#dc2626",text:"Above 25mm - Heavy Rain"},{color:"#f59e0b",text:"10-25mm - Moderate Rain"},{color:"#10b981",text:"2-10mm - Light Rain"},{color:"#06b6d4",text:"Below 2mm - Drizzle"}]},{title:"Weather Conditions",icon:S,color:"#f59e0b",items:[{color:"#f59e0b",text:"Clear Skies"},{color:"#10b981",text:"Partly Cloudy"},{color:"#6b7280",text:"Overcast"},{color:"#3b82f6",text:"Rainy"}]}],k={"wave-wind":{light:["/charts/wave-wind/light/map_snapshot_light.png","/charts/wave-wind/light/map_snapshot_light.png","/charts/wave-wind/light/map_snapshot_light.png","/charts/wave-wind/light/map_snapshot_light.png"],dark:["/charts/wave-wind/dark/map_snapshot_dark.png","/charts/wave-wind/dark/map_snapshot_dark.png","/charts/wave-wind/dark/map_snapshot_dark.png","/charts/wave-wind/dark/map_snapshot_dark.png"]},"wave-only":{light:["/charts/wave/light/map_snapshot_light.png","/charts/wave/light/map_snapshot_light.png","/charts/wave/light/map_snapshot_light.png","/charts/wave/light/map_snapshot_light.png"],dark:["/charts/wave/dark/map_snapshot_dark.png","/charts/wave/dark/map_snapshot_dark.png","/charts/wave/dark/map_snapshot_dark.png","/charts/wave/dark/map_snapshot_dark.png"]},"visually-impaired":{light:["/charts/visually-impaired/analysis_light.png","/charts/visually-impaired/24h_light.png","/charts/visually-impaired/36h_light.png","/charts/visually-impaired/48h_light.png"],dark:["/charts/visually-impaired/analysis_dark.png","/charts/visually-impaired/24h_dark.png","/charts/visually-impaired/36h_dark.png","/charts/visually-impaired/48h_dark.png"]}}[s][e?"dark":"light"],j=(a,d)=>{h({src:a,title:d})},p=()=>{h(null)};return r.jsxs(r.Fragment,{children:[r.jsx(L,{isDarkMode:e,children:r.jsxs(T,{children:[r.jsxs(A,{children:[r.jsxs(R,{isDarkMode:e,children:["Wave Analysis ",r.jsx(F,{children:"Forecast Charts"})]}),r.jsx(E,{isDarkMode:e,children:"Comprehensive wave analysis and prognostic charts for marine weather forecasting"})]}),r.jsx(B,{children:r.jsx(G,{isDarkMode:e,children:v.map(a=>r.jsxs(N,{active:s===a.id,isDarkMode:e,onClick:()=>f(a.id),children:[r.jsx(a.icon,{}),a.name]},a.id))})}),r.jsx(O,{children:y.map((a,d)=>{const i=u[a.id],l=k[d];return r.jsxs(V,{isDarkMode:e,children:[r.jsxs(q,{isDarkMode:e,children:[r.jsx(Y,{color:i.color,colorSecondary:i.colorSecondary,children:r.jsx(i.icon,{})}),r.jsxs(U,{children:[r.jsx(X,{isDarkMode:e,children:i.title}),r.jsx(Z,{isDarkMode:e,children:i.subtitle})]})]}),r.jsxs(J,{isDarkMode:e,onClick:()=>j(l,i.title),children:[l?r.jsx("img",{src:l,alt:i.title,style:{width:"100%",height:"100%",objectFit:"cover",borderRadius:"1rem"}}):r.jsxs(K,{isDarkMode:e,children:[r.jsx(Q,{isDarkMode:e,children:r.jsx(i.icon,{})}),r.jsx(ee,{children:s==="wave-wind"?"Wave and Wind Chart":s==="wave-only"?"Wave Only Chart":"Visually Impaired Accessible Chart"}),r.jsx(re,{children:s==="wave-wind"?"Combined wave height and wind vector visualization":s==="wave-only"?"Wave height and direction only":"High contrast chart with enhanced accessibility features"})]}),r.jsxs("div",{style:{position:"absolute",top:"0.75rem",right:"0.75rem",background:"rgba(0, 0, 0, 0.5)",borderRadius:"0.5rem",padding:"0.5rem",color:"white",display:"flex",alignItems:"center",gap:"0.25rem",fontSize:"0.75rem",opacity:0,transition:"opacity 0.2s"},onMouseEnter:o=>{const n=o.currentTarget.querySelector("div:last-child");n&&(n.style.opacity="1")},onMouseLeave:o=>{const n=o.currentTarget.querySelector("div:last-child");n&&(n.style.opacity="0")},children:[r.jsx(I,{size:12}),"Click to enlarge"]})]}),r.jsx(te,{children:a.labels.map((o,n)=>r.jsxs(ae,{isDarkMode:e,children:[r.jsx(ie,{color:o.color}),r.jsx(oe,{isDarkMode:e,children:o.name}),r.jsx(ne,{isDarkMode:e,children:o.value})]},n))})]},a.id)})}),r.jsxs(se,{isDarkMode:e,children:[r.jsx(de,{isDarkMode:e,children:"Chart Legend & Reference Guide"}),r.jsx(le,{children:w.map((a,d)=>r.jsxs(ce,{isDarkMode:e,children:[r.jsxs(me,{isDarkMode:e,color:a.color,children:[r.jsx(a.icon,{}),a.title]}),r.jsx(ge,{children:a.items.map((i,l)=>r.jsxs(he,{children:[r.jsx(pe,{color:i.color}),r.jsx(be,{isDarkMode:e,children:i.text})]},l))})]},d))})]})]})}),c&&r.jsx("div",{onClick:p,style:{position:"fixed",top:0,left:0,right:0,bottom:0,backgroundColor:"rgba(0, 0, 0, 0.9)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1e3,padding:"2rem"},children:r.jsxs("div",{onClick:a=>a.stopPropagation(),style:{position:"relative",maxWidth:"90vw",maxHeight:"90vh",background:"#ffffff",borderRadius:"1rem",overflow:"hidden",boxShadow:"0 25px 50px -12px rgba(0, 0, 0, 0.25)"},children:[r.jsx("button",{onClick:p,style:{position:"absolute",top:"1rem",right:"1rem",background:"rgba(0, 0, 0, 0.5)",border:"none",borderRadius:"0.5rem",padding:"0.5rem",color:"white",cursor:"pointer",zIndex:1001,display:"flex",alignItems:"center",justifyContent:"center"},children:r.jsx(M,{size:20})}),r.jsxs("div",{children:[r.jsx("div",{style:{padding:"1rem",background:"#f8fafc",borderBottom:"1px solid #e2e8f0"},children:r.jsx("h3",{style:{margin:0,fontSize:"1.25rem",fontWeight:"600",color:"#1e293b"},children:c.title})}),r.jsx("img",{src:c.src,alt:c.title,style:{width:"100%",height:"auto",display:"block"}})]})]})})]})};export{$e as default};
