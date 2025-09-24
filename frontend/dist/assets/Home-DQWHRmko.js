import{j as t,d as r}from"./index-CbM3mBlV.js";import{c as a}from"./createLucideIcon-BvXpfdCH.js";import{C as f,Z as x}from"./zap-DMj-vocH.js";import{T as y}from"./thermometer-DtwsEuYh.js";import{W as j}from"./wind-CnGxrsCz.js";import{E as z}from"./eye-2Fu8EHtf.js";import{C as S}from"./chart-column-Dc-O8z9r.js";import{M as C}from"./map-pin-Dvg0btCB.js";/**
 * @license lucide-react v0.525.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const D=[["path",{d:"M5 12h14",key:"1ays0h"}],["path",{d:"m12 5 7 7-7 7",key:"xquz4c"}]],W=a("arrow-right",D);/**
 * @license lucide-react v0.525.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const N=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",key:"13o1zl"}],["path",{d:"M2 12h20",key:"9i4pu4"}]],M=a("globe",N);/**
 * @license lucide-react v0.525.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const T=[["polygon",{points:"6 3 20 12 6 21 6 3",key:"1oa8hb"}]],F=a("play",T);/**
 * @license lucide-react v0.525.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Y=[["path",{d:"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",key:"oel41y"}]],A=a("shield",Y);/**
 * @license lucide-react v0.525.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=[["rect",{width:"14",height:"20",x:"5",y:"2",rx:"2",ry:"2",key:"1yt0o3"}],["path",{d:"M12 18h.01",key:"mhygvu"}]],G=a("smartphone",L),H=r.section`
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: ${e=>e.isDarkMode?"linear-gradient(135deg, #111827 0%, #1e3a8a 20%, #111827 100%)":"linear-gradient(135deg, #dbeafe 0%, #ffffff 50%, #e0f2fe 100%)"};
  padding-top: 4rem; /* Account for fixed header */
`,P=r.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
`,d=r.div`
  position: absolute;
  border-radius: 50%;
  opacity: 0.6;
  
  &.dot-1 {
    top: 5rem;
    left: 2.5rem;
    width: 0.5rem;
    height: 0.5rem;
    background: ${e=>e.isDarkMode?"#60a5fa":"#0ea5e9"};
    animation: pulse 2s infinite;
  }
  
  &.dot-2 {
    top: 10rem;
    right: 5rem;
    width: 0.75rem;
    height: 0.75rem;
    background: ${e=>e.isDarkMode?"#93c5fd":"#2563eb"};
    animation: bounce 3s infinite;
  }
  
  &.dot-3 {
    bottom: 10rem;
    left: 5rem;
    width: 1rem;
    height: 1rem;
    background: ${e=>e.isDarkMode?"#3b82f6":"#0ea5e9"};
    animation: ping 4s infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.1); }
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes ping {
    0% { transform: scale(1); opacity: 0.6; }
    75%, 100% { transform: scale(2); opacity: 0; }
  }
`,b=r.div`
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  animation: float 6s ease-in-out infinite;
  
  &.orb-1 {
    top: -10rem;
    right: -10rem;
    width: 20rem;
    height: 20rem;
    background: ${e=>e.isDarkMode?"linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(37, 99, 235, 0.15))":"linear-gradient(135deg, rgba(14, 165, 233, 0.08), rgba(37, 99, 235, 0.08))"};
    animation-delay: 0s;
  }
  
  &.orb-2 {
    bottom: -10rem;
    left: -10rem;
    width: 24rem;
    height: 24rem;
    background: ${e=>e.isDarkMode?"linear-gradient(45deg, rgba(59, 130, 246, 0.15), rgba(14, 165, 233, 0.15))":"linear-gradient(45deg, rgba(59, 130, 246, 0.08), rgba(14, 165, 233, 0.08))"};
    animation-delay: 2s;
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(180deg); }
  }
`,_=r.div`
  position: relative;
  z-index: 10;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  
  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`,E=r.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 3rem;
  align-items: center;
  
  @media (min-width: 1024px) {
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
  }
`,I=r.div`
  text-align: center;
  
  @media (min-width: 1024px) {
    text-align: left;
  }
`,B=r.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: ${e=>e.isDarkMode?"rgba(14, 165, 233, 0.1)":"rgba(14, 165, 233, 0.08)"};
  border: 1px solid ${e=>e.isDarkMode?"rgba(14, 165, 233, 0.2)":"rgba(14, 165, 233, 0.3)"};
  border-radius: 2rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${e=>e.isDarkMode?"#60a5fa":"#0ea5e9"};
  margin-bottom: 2rem;
`,R=r.div`
  width: 0.5rem;
  height: 0.5rem;
  background: #10b981;
  border-radius: 50%;
  animation: pulse 2s infinite;
`,U=r.div`
  margin-bottom: 2rem;
`,X=r.h1`
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1.2;
  color: ${e=>e.isDarkMode?"#ffffff":"#111827"};
  margin-bottom: 1rem;
  
  @media (min-width: 640px) {
    font-size: 3rem;
  }
  
  @media (min-width: 1024px) {
    font-size: 3.75rem;
  }
`,O=r.span`
  display: block;
  background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`,V=r.p`
  font-size: 1.125rem;
  line-height: 1.7;
  color: ${e=>e.isDarkMode?"#d1d5db":"#4b5563"};
  max-width: 32rem;
  margin: 0 auto;
  
  @media (min-width: 1024px) {
    margin: 0;
  }
  
  @media (min-width: 640px) {
    font-size: 1.25rem;
  }
`,Z=r.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: 2rem 0;
  
  @media (min-width: 640px) {
    flex-direction: row;
    justify-content: center;
  }
  
  @media (min-width: 1024px) {
    justify-content: flex-start;
  }
`,q=r.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
  border: none;
  border-radius: 0.75rem;
  padding: 1rem 2rem;
  color: white;
  font-weight: 600;
  font-size: 1.125rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(14, 165, 233, 0.4);
  
  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 8px 25px rgba(14, 165, 233, 0.6);
    background: linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%);
  }
  
  svg {
    transition: transform 0.2s ease;
  }
  
  &:hover svg {
    transform: translateX(4px);
  }
`,J=r.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: transparent;
  border: 2px solid ${e=>e.isDarkMode?"#4b5563":"#d1d5db"};
  border-radius: 0.75rem;
  padding: 1rem 2rem;
  color: ${e=>e.isDarkMode?"#d1d5db":"#374151"};
  font-weight: 600;
  font-size: 1.125rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.02);
    border-color: ${e=>e.isDarkMode?"#6b7280":"#9ca3af"};
    background: ${e=>e.isDarkMode?"rgba(55, 65, 81, 0.5)":"rgba(249, 250, 251, 0.8)"};
  }
`,K=r.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  padding-top: 2rem;
  border-top: 1px solid ${e=>e.isDarkMode?"rgba(75, 85, 99, 0.3)":"rgba(229, 231, 235, 0.5)"};
  margin-top: 2rem;
`,c=r.div`
  text-align: center;
  
  @media (min-width: 1024px) {
    text-align: left;
  }
`,l=r.div`
  font-size: 1.875rem;
  font-weight: 800;
  color: ${e=>e.isDarkMode?"#ffffff":"#111827"};
  
  @media (min-width: 640px) {
    font-size: 2.25rem;
  }
`,m=r.div`
  font-size: 0.875rem;
  color: ${e=>e.isDarkMode?"#9ca3af":"#6b7280"};
  margin-top: 0.25rem;
`,Q=r.div`
  display: flex;
  justify-content: center;
  
  @media (min-width: 1024px) {
    justify-content: flex-end;
  }
`,ee=r.div`
  position: relative;
  width: 100%;
  max-width: 24rem;
  padding: 2rem;
  background: ${e=>e.isDarkMode?"rgba(31, 41, 55, 0.8)":"rgba(255, 255, 255, 0.9)"};
  backdrop-filter: blur(20px);
  border: 1px solid ${e=>e.isDarkMode?"rgba(75, 85, 99, 0.3)":"rgba(255, 255, 255, 0.2)"};
  border-radius: 1.5rem;
  box-shadow: ${e=>e.isDarkMode?"0 25px 50px -12px rgba(0, 0, 0, 0.5)":"0 25px 50px -12px rgba(0, 0, 0, 0.1)"};
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.02) translateY(-4px);
    box-shadow: ${e=>e.isDarkMode?"0 35px 60px -12px rgba(0, 0, 0, 0.6)":"0 35px 60px -12px rgba(0, 0, 0, 0.15)"};
  }
`,te=r.div`
  text-align: center;
  margin-bottom: 1.5rem;
`,re=r.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${e=>e.isDarkMode?"#d1d5db":"#4b5563"};
  margin-bottom: 0.25rem;
`,ie=r.p`
  font-size: 0.875rem;
  color: ${e=>e.isDarkMode?"#9ca3af":"#6b7280"};
`,ae=r.div`
  position: relative;
  text-align: center;
  margin: 2rem 0;
`,ne=r.div`
  font-size: 4rem;
  font-weight: 800;
  color: ${e=>e.isDarkMode?"#ffffff":"#111827"};
  line-height: 1;
`,oe=r.div`
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  
  svg {
    width: 3rem;
    height: 3rem;
    color: #0ea5e9;
    animation: bounce 3s infinite;
  }
`,se=r.div`
  font-size: 1.125rem;
  color: ${e=>e.isDarkMode?"#d1d5db":"#4b5563"};
  margin-top: 1rem;
`,de=r.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid ${e=>e.isDarkMode?"#374151":"#e5e7eb"};
`,g=r.div`
  text-align: center;
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
    margin: 0 auto 0.5rem;
    color: ${e=>e.type==="temperature"?e.isDarkMode?"#ef4444":"#dc2626":e.type==="wind"?e.isDarkMode?"#3b82f6":"#2563eb":e.isDarkMode?"#6b7280":"#4b5563"};
  }
`,p=r.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: ${e=>e.isDarkMode?"#ffffff":"#111827"};
  margin-bottom: 0.125rem;
`,h=r.div`
  font-size: 0.75rem;
  color: ${e=>e.isDarkMode?"#9ca3af":"#6b7280"};
`,u=r.div`
  position: absolute;
  width: 1rem;
  height: 1rem;
  background: linear-gradient(135deg, #0ea5e9, #2563eb);
  border-radius: 50%;
  opacity: 0.6;
  animation: pulse 3s infinite;
  
  &.top-left {
    top: -0.5rem;
    left: -0.5rem;
  }
  
  &.bottom-right {
    bottom: -0.5rem;
    right: -0.5rem;
    width: 0.75rem;
    height: 0.75rem;
  }
`,ce=({isDarkMode:e})=>t.jsxs(H,{isDarkMode:e,children:[t.jsxs(P,{children:[t.jsx(d,{className:"dot-1",isDarkMode:e}),t.jsx(d,{className:"dot-2",isDarkMode:e}),t.jsx(d,{className:"dot-3",isDarkMode:e}),t.jsx(b,{className:"orb-1",isDarkMode:e}),t.jsx(b,{className:"orb-2",isDarkMode:e})]}),t.jsx(_,{children:t.jsxs(E,{children:[t.jsxs(I,{children:[t.jsxs(B,{isDarkMode:e,children:[t.jsx(R,{}),"Live Weather Updates"]}),t.jsxs(U,{children:[t.jsxs(X,{isDarkMode:e,children:["Your Trusted",t.jsx(O,{children:"Weather Partner"})]}),t.jsx(V,{isDarkMode:e,children:"Get accurate weather forecasts, real-time updates, and meteorological services to help you plan your day with confidence."})]}),t.jsxs(Z,{children:[t.jsxs(q,{children:["Check Weather",t.jsx(W,{size:20})]}),t.jsxs(J,{isDarkMode:e,children:[t.jsx(F,{size:20}),"Watch Demo"]})]}),t.jsxs(K,{isDarkMode:e,children:[t.jsxs(c,{children:[t.jsx(l,{isDarkMode:e,children:"99.9%"}),t.jsx(m,{isDarkMode:e,children:"Accuracy"})]}),t.jsxs(c,{children:[t.jsx(l,{isDarkMode:e,children:"24/7"}),t.jsx(m,{isDarkMode:e,children:"Monitoring"})]}),t.jsxs(c,{children:[t.jsx(l,{isDarkMode:e,children:"50M+"}),t.jsx(m,{isDarkMode:e,children:"Users"})]})]})]}),t.jsx(Q,{children:t.jsxs(ee,{isDarkMode:e,children:[t.jsxs(te,{children:[t.jsx(re,{isDarkMode:e,children:"Manila, Philippines"}),t.jsxs(ie,{isDarkMode:e,children:["Today, ",new Date().toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})]})]}),t.jsxs(ae,{children:[t.jsx(ne,{isDarkMode:e,children:"32°"}),t.jsx(oe,{children:t.jsx(f,{})})]}),t.jsx(se,{isDarkMode:e,children:"Partly Cloudy"}),t.jsxs(de,{isDarkMode:e,children:[t.jsxs(g,{type:"temperature",isDarkMode:e,children:[t.jsx(y,{}),t.jsx(p,{isDarkMode:e,children:"Feels like"}),t.jsx(h,{isDarkMode:e,children:"35°"})]}),t.jsxs(g,{type:"wind",isDarkMode:e,children:[t.jsx(j,{}),t.jsx(p,{isDarkMode:e,children:"Wind"}),t.jsx(h,{isDarkMode:e,children:"15 km/h"})]}),t.jsxs(g,{type:"humidity",isDarkMode:e,children:[t.jsx(f,{}),t.jsx(p,{isDarkMode:e,children:"Humidity"}),t.jsx(h,{isDarkMode:e,children:"68%"})]})]}),t.jsx(u,{className:"top-left"}),t.jsx(u,{className:"bottom-right"})]})})]})})]}),le=r.section`
  position: relative;
  padding: 6rem 0;
  background: ${e=>e.isDark?"linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)":"linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #f1f5f9 100%)"};
  overflow: hidden;
`,me=r.div`
  position: absolute;
  inset: 0;
  opacity: 0.05;
  background-image: radial-gradient(circle at 1px 1px, ${e=>e.isDark?"#60a5fa":"#0ea5e9"} 1px, transparent 0);
  background-size: 40px 40px;
  animation: drift 20s ease-in-out infinite;
  
  @keyframes drift {
    0%, 100% { transform: translateX(0) translateY(0); }
    50% { transform: translateX(20px) translateY(-20px); }
  }
`,ge=r.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
`,o=r.div`
  position: absolute;
  color: ${e=>e.isDark?"#3b82f6":"#0ea5e9"};
  opacity: 0.1;
  animation: float 8s ease-in-out infinite;
  
  &.icon-1 {
    top: 10%;
    left: 5%;
    animation-delay: 0s;
  }
  
  &.icon-2 {
    top: 20%;
    right: 8%;
    animation-delay: 2s;
  }
  
  &.icon-3 {
    bottom: 30%;
    left: 10%;
    animation-delay: 4s;
  }
  
  &.icon-4 {
    bottom: 15%;
    right: 15%;
    animation-delay: 6s;
  }
  
  svg {
    width: 3rem;
    height: 3rem;
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.1; }
    50% { transform: translateY(-30px) rotate(180deg); opacity: 0.2; }
  }
`,pe=r.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  position: relative;
  z-index: 10;
  
  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`,he=r.div`
  text-align: center;
  margin-bottom: 4rem;
`,fe=r.div`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: ${e=>(e.isDark,"rgba(14, 165, 233, 0.1)")};
  border: 1px solid ${e=>(e.isDark,"rgba(14, 165, 233, 0.2)")};
  border-radius: 2rem;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${e=>e.isDark?"#60a5fa":"#0ea5e9"};
  margin-bottom: 1.5rem;
`,xe=r.h2`
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1.2;
  color: ${e=>e.isDark?"#ffffff":"#111827"};
  margin-bottom: 1rem;
  
  @media (min-width: 640px) {
    font-size: 3rem;
  }
  
  @media (min-width: 1024px) {
    font-size: 3.5rem;
  }
`,be=r.span`
  background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`,ue=r.p`
  font-size: 1.125rem;
  line-height: 1.7;
  color: ${e=>e.isDark?"#d1d5db":"#4b5563"};
  max-width: 40rem;
  margin: 0 auto;
  
  @media (min-width: 640px) {
    font-size: 1.25rem;
  }
`,ye=r.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 2.5rem;
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 3rem;
  }
`,w=r.div`
  position: relative;
  background: ${e=>e.isDark?"rgba(31, 41, 55, 0.8)":"rgba(255, 255, 255, 0.9)"};
  backdrop-filter: blur(20px);
  border: 1px solid ${e=>e.isDark?"rgba(75, 85, 99, 0.3)":"rgba(255, 255, 255, 0.2)"};
  border-radius: 1.25rem;
  padding: 2rem;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
      transparent, 
      ${e=>e.isDark?"rgba(59, 130, 246, 0.05)":"rgba(14, 165, 233, 0.05)"}, 
      transparent
    );
    transition: left 0.6s ease;
  }
  
  &:hover::before {
    left: 100%;
  }
  
  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: ${e=>e.isDark?"0 25px 60px -12px rgba(59, 130, 246, 0.25)":"0 25px 60px -12px rgba(14, 165, 233, 0.15)"};
    border-color: ${e=>e.isDark?"rgba(59, 130, 246, 0.3)":"rgba(14, 165, 233, 0.3)"};
  }
`,je=r.div`
  width: 4rem;
  height: 4rem;
  background: ${e=>{const n={primary:"linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)",secondary:"linear-gradient(135deg, #10b981 0%, #059669 100%)",accent:"linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",purple:"linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",pink:"linear-gradient(135deg, #ec4899 0%, #be185d 100%)",indigo:"linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"};return n[e.variant]||n.primary}};
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 25px rgba(14, 165, 233, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  svg {
    width: 1.75rem;
    height: 1.75rem;
    color: white;
  }
  
  ${w}:hover & {
    transform: scale(1.1) rotateY(10deg);
    box-shadow: 0 12px 35px rgba(14, 165, 233, 0.3);
  }
`,we=r.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${e=>e.isDark?"#ffffff":"#111827"};
  margin-bottom: 0.75rem;
  transition: color 0.3s ease;
`,ve=r.p`
  font-size: 0.95rem;
  line-height: 1.6;
  color: ${e=>e.isDark?"#d1d5db":"#4b5563"};
  transition: color 0.3s ease;
`,ke=r.ul`
  list-style: none;
  padding: 0;
  margin: 1rem 0 0 0;
`,$e=r.li`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: ${e=>e.isDark?"#d1d5db":"#4b5563"};
  margin-bottom: 0.5rem;
  
  &::before {
    content: '';
    width: 0.375rem;
    height: 0.375rem;
    background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
    border-radius: 50%;
    flex-shrink: 0;
  }
`,ze=r.div`
  margin-top: 5rem;
  padding: 3rem 0;
  border-top: 1px solid ${e=>e.isDark?"rgba(75, 85, 99, 0.3)":"rgba(229, 231, 235, 0.5)"};
`,Se=r.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 2rem;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
  }
`,Ce=r.div`
  text-align: center;
  padding: 1.5rem;
  background: ${e=>e.isDark?"rgba(31, 41, 55, 0.5)":"rgba(255, 255, 255, 0.7)"};
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  border: 1px solid ${e=>e.isDark?"rgba(75, 85, 99, 0.2)":"rgba(255, 255, 255, 0.3)"};
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${e=>e.isDark?"0 15px 35px rgba(0, 0, 0, 0.2)":"0 15px 35px rgba(0, 0, 0, 0.1)"};
  }
`,De=r.div`
  font-size: 2rem;
  font-weight: 800;
  color: ${e=>e.isDark?"#ffffff":"#111827"};
  margin-bottom: 0.5rem;
  
  @media (min-width: 640px) {
    font-size: 2.5rem;
  }
`,We=r.div`
  font-size: 0.875rem;
  color: ${e=>e.isDark?"#9ca3af":"#6b7280"};
  font-weight: 500;
`,Ne=({isDark:e})=>{const n=[{icon:t.jsx(x,{}),title:"Real-Time Updates",description:"Get instant weather updates with our advanced monitoring systems.",variant:"primary",items:["Live weather data","Minute-by-minute updates","Push notifications","Alert system"]},{icon:t.jsx(S,{}),title:"Advanced Analytics",description:"Comprehensive weather analysis with detailed charts and forecasts.",variant:"secondary",items:["7-day forecasts","Historical data","Trend analysis","Weather patterns"]},{icon:t.jsx(C,{}),title:"Location-Based",description:"Accurate weather information for your exact location worldwide.",variant:"accent",items:["GPS integration","Multiple locations","Local forecasts","Regional alerts"]},{icon:t.jsx(A,{}),title:"Severe Weather Alerts",description:"Stay protected with timely warnings for dangerous weather conditions.",variant:"purple",items:["Storm warnings","Emergency alerts","Safety tips","Evacuation notices"]},{icon:t.jsx(G,{}),title:"Mobile Ready",description:"Access weather information anywhere with our responsive mobile app.",variant:"pink",items:["Cross-platform","Offline access","Widget support","Dark mode"]},{icon:t.jsx(M,{}),title:"Global Coverage",description:"Weather data from thousands of stations across the Philippines and beyond.",variant:"indigo",items:["National coverage","International data","Satellite imagery","Radar maps"]}],v=[{number:"99.9%",label:"Accuracy Rate"},{number:"24/7",label:"Monitoring"},{number:"50M+",label:"Active Users"},{number:"1000+",label:"Weather Stations"}];return t.jsxs(le,{isDark:e,children:[t.jsx(me,{isDark:e}),t.jsxs(ge,{children:[t.jsx(o,{className:"icon-1",isDark:e,children:t.jsx(f,{})}),t.jsx(o,{className:"icon-2",isDark:e,children:t.jsx(y,{})}),t.jsx(o,{className:"icon-3",isDark:e,children:t.jsx(j,{})}),t.jsx(o,{className:"icon-4",isDark:e,children:t.jsx(z,{})})]}),t.jsxs(pe,{children:[t.jsxs(he,{children:[t.jsxs(fe,{isDark:e,children:[t.jsx(x,{size:16}),"Advanced Features"]}),t.jsxs(xe,{isDark:e,children:["Comprehensive ",t.jsx(be,{children:"Weather Services"})]}),t.jsx(ue,{isDark:e,children:"Experience the most advanced weather forecasting technology with real-time data, accurate predictions, and comprehensive coverage across the Philippines."})]}),t.jsx(ye,{children:n.map((i,s)=>t.jsxs(w,{isDark:e,children:[t.jsx(je,{variant:i.variant,children:i.icon}),t.jsx(we,{isDark:e,children:i.title}),t.jsx(ve,{isDark:e,children:i.description}),t.jsx(ke,{children:i.items.map((k,$)=>t.jsx($e,{isDark:e,children:k},$))})]},s))}),t.jsx(ze,{isDark:e,children:t.jsx(Se,{children:v.map((i,s)=>t.jsxs(Ce,{isDark:e,children:[t.jsx(De,{isDark:e,children:i.number}),t.jsx(We,{isDark:e,children:i.label})]},s))})})]})]})},Pe=({isDarkMode:e})=>t.jsxs("div",{children:[t.jsx(ce,{isDarkMode:e}),t.jsx(Ne,{})]});export{Pe as default};
