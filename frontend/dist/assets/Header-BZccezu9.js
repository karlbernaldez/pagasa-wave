import{d as r,r as i,u as L,a as O,j as o}from"./index-CbM3mBlV.js";import{f as R}from"./userAPI-BfRCCs7E.js";import{l as N}from"./auth-DWBqGp9a.js";import{C as E,S as Y,M as _}from"./settings-BQ5etLu5.js";import{U as l}from"./user-Bk_FqQSg.js";import{L as w}from"./log-out-vZsQLeKs.js";import{S as P}from"./sun-zLVnWhv0.js";import{c as B}from"./createLucideIcon-BvXpfdCH.js";import{X as H}from"./x-D_uShodW.js";/**
 * @license lucide-react v0.525.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const T=[["path",{d:"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z",key:"a7tn18"}]],W=B("moon",T),G=r.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  backdrop-filter: blur(20px);
  border-bottom: 1px solid ${e=>e.isDarkMode?"rgba(75, 85, 99, 0.3)":"rgba(229, 231, 235, 0.2)"};
  transition: all 0.3s ease;
`,V=r.nav`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 4rem;
  
  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`,X=r.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  cursor: pointer;
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }
`,q=r.div`
  width: 2.25rem;
  height: 2.25rem;
  background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
  border-radius: 0.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(14, 165, 233, 0.4);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 8px 25px rgba(14, 165, 233, 0.6);
    transform: translateY(-1px);
  }

  svg {
    width: 1.375rem;
    height: 1.375rem;
    color: white;
  }
`,F=r.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  
  @media (max-width: 768px) {
    display: ${e=>e.isOpen?"flex":"none"};
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: ${e=>e.isDarkMode?"rgba(17, 24, 39, 0.98)":"rgba(255, 255, 255, 0.98)"};
    backdrop-filter: blur(20px);
    flex-direction: column;
    padding: 2rem;
    gap: 1.5rem;
    border-bottom: 1px solid ${e=>e.isDarkMode?"rgba(75, 85, 99, 0.3)":"rgba(229, 231, 235, 0.2)"};
    box-shadow: ${e=>e.isDarkMode?"0 25px 50px -12px rgba(0, 0, 0, 0.5)":"0 25px 50px -12px rgba(0, 0, 0, 0.1)"};
  }
`,Z=r.button`
  padding: 8px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  color: ${e=>e.isActive?e.isDarkMode?"#60a5fa":"#2563eb":e.isDarkMode?"#d1d5db":"#374151"};
  text-decoration: none;
  transition: all 0.2s ease;
  border-radius: 6px;
  position: relative;
  
  &:hover {
    color: ${e=>e.isDarkMode?"#93c5fd":"#1d4ed8"};
    background-color: ${e=>e.isDarkMode?"#1f2937":"#f8fafc"};
  }
  
  &:focus {
    outline: 2px solid ${e=>e.isDarkMode?"#3b82f6":"#2563eb"};
    outline-offset: 2px;
  }
  
  ${e=>e.isActive&&`
    background-color: ${e.isDarkMode?"#1e40af20":"#dbeafe"};
    
    &::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 50%;
      transform: translateX(-50%);
      width: 20px;
      height: 2px;
      background-color: ${e.isDarkMode?"#60a5fa":"#2563eb"};
      border-radius: 1px;
    }
  `}
  
  @media (max-width: 768px) {
    width: 100%;
    text-align: left;
    padding: 12px 16px;
    
    ${e=>e.isActive&&`
      &::after {
        display: none;
      }
      
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 20px;
        background-color: ${e.isDarkMode?"#60a5fa":"#2563eb"};
        border-radius: 0 2px 2px 0;
      }
    `}
  }
`,J=r.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`,K=r.button`
  background: ${e=>e.isDarkMode?"rgba(31, 41, 55, 0.8)":"rgba(255, 255, 255, 0.9)"};
  border: 1px solid ${e=>e.isDarkMode?"rgba(75, 85, 99, 0.3)":"rgba(255, 255, 255, 0.2)"};
  border-radius: 0.75rem;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(20px);
  box-shadow: ${e=>e.isDarkMode?"0 4px 15px rgba(0, 0, 0, 0.2)":"0 4px 15px rgba(0, 0, 0, 0.05)"};
  
  &:hover {
    background: ${e=>e.isDarkMode?"rgba(31, 41, 55, 1)":"rgba(255, 255, 255, 1)"};
    transform: translateY(-2px) scale(1.05);
    box-shadow: ${e=>e.isDarkMode?"0 8px 25px rgba(0, 0, 0, 0.3)":"0 8px 25px rgba(0, 0, 0, 0.1)"};
    border-color: ${e=>e.isDarkMode?"rgba(75, 85, 99, 0.4)":"rgba(229, 231, 235, 0.3)"};
  }
  
  &:active {
    transform: translateY(0) scale(0.95);
  }
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
    color: ${e=>e.isDarkMode?"#60a5fa":"#0ea5e9"};
    transition: all 0.3s ease;
  }
  
  &:hover svg {
    transform: rotate(180deg) scale(1.1);
  }
`,Q=r.button`
  background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
  border: none;
  border-radius: 0.75rem;
  padding: 0.75rem 1.5rem;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 15px rgba(14, 165, 233, 0.4);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover::before {
    left: 100%;
  }
  
  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 8px 25px rgba(14, 165, 233, 0.6);
    background: linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%);
  }
  
  &:active {
    transform: translateY(0) scale(0.98);
  }

  @media (max-width: 640px) {
    display: none;
  }
`,ee=r.button`
  display: none;
  background: ${e=>e.isDarkMode?"rgba(31, 41, 55, 0.8)":"rgba(255, 255, 255, 0.9)"};
  border: 1px solid ${e=>e.isDarkMode?"rgba(75, 85, 99, 0.3)":"rgba(255, 255, 255, 0.2)"};
  cursor: pointer;
  padding: 0.75rem;
  color: ${e=>e.isDarkMode?"#d1d5db":"#4b5563"};
  transition: all 0.3s ease;
  border-radius: 0.75rem;
  backdrop-filter: blur(20px);
  box-shadow: ${e=>e.isDarkMode?"0 4px 15px rgba(0, 0, 0, 0.2)":"0 4px 15px rgba(0, 0, 0, 0.05)"};
  
  &:hover {
    color: ${e=>e.isDarkMode?"#ffffff":"#111827"};
    background: ${e=>e.isDarkMode?"rgba(31, 41, 55, 1)":"rgba(255, 255, 255, 1)"};
    transform: translateY(-2px) scale(1.05);
    box-shadow: ${e=>e.isDarkMode?"0 8px 25px rgba(0, 0, 0, 0.3)":"0 8px 25px rgba(0, 0, 0, 0.1)"};
  }
  
  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
    transition: transform 0.3s ease;
  }
`,k=r.button`
  background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
  border: none;
  border-radius: 0.75rem;
  padding: 1rem 2rem;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  box-shadow: 0 4px 15px rgba(14, 165, 233, 0.4);
  width: 100%;
  margin-top: 1.5rem;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover::before {
    left: 100%;
  }
  
  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 8px 25px rgba(14, 165, 233, 0.6);
    background: linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%);
  }
`,oe=r.div`
  position: relative;
  
  @media (max-width: 768px) {
    display: none;
  }
`,re=r.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  background-color: ${e=>e.isOpen?e.isDarkMode?"#374151":"#f3f4f6":"transparent"};
  
  &:hover {
    background-color: ${e=>e.isDarkMode?"#374151":"#f3f4f6"};
  }
  
  &:focus {
    outline: 2px solid ${e=>e.isDarkMode?"#3b82f6":"#2563eb"};
    outline-offset: 2px;
  }
`,te=r.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background-color: ${e=>e.isDarkMode?"#374151":"#f3f4f6"};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`,ae=r.div`
  text-align: left;
  min-width: 0;
  
  @media (max-width: 1024px) {
    display: none;
  }
`,ne=r.div`
  font-size: 14px;
  font-weight: 500;
  color: ${e=>e.isDarkMode?"#f9fafb":"#111827"};
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
`,ie=r.div`
  font-size: 12px;
  color: ${e=>e.isDarkMode?"#9ca3af":"#6b7280"};
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
`,se=r(E)`
  transition: transform 0.2s ease;
  transform: ${e=>e.isOpen?"rotate(180deg)":"rotate(0deg)"};
  flex-shrink: 0;
`,de=r.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background-color: ${e=>e.isDarkMode?"#1f2937":"#ffffff"};
  border: 1px solid ${e=>e.isDarkMode?"#374151":"#e5e7eb"};
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  min-width: 240px;
  z-index: 50;
  overflow: hidden;
  
  @media (max-width: 480px) {
    right: -20px;
    min-width: 200px;
  }
`,le=r.div`
  padding: 16px;
  border-bottom: 1px solid ${e=>e.isDarkMode?"#374151":"#e5e7eb"};
  background-color: ${e=>e.isDarkMode?"#111827":"#f9fafb"};
`,ce=r.div`
  font-size: 14px;
  font-weight: 600;
  color: ${e=>e.isDarkMode?"#f9fafb":"#111827"};
  margin-bottom: 2px;
  word-break: break-word;
`,pe=r.div`
  font-size: 12px;
  color: ${e=>e.isDarkMode?"#9ca3af":"#6b7280"};
  word-break: break-word;
`,xe=r.div`
  font-size: 11px;
  color: ${e=>e.isDarkMode?"#6b7280":"#9ca3af"};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 4px;
  font-weight: 500;
`,h=r.button`
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: ${e=>e.isSignOut?"#ef4444":e.isDarkMode?"#f9fafb":"#111827"};
  transition: background-color 0.15s ease;
  text-align: left;
  
  &:hover {
    background-color: ${e=>e.isSignOut?"#fef2f2":e.isDarkMode?"#374151":"#f3f4f6"};
  }
  
  &:focus {
    outline: 2px solid ${e=>e.isDarkMode?"#3b82f6":"#2563eb"};
    outline-offset: -2px;
  }
`,ge=r.div`
  height: 1px;
  background-color: ${e=>e.isDarkMode?"#374151":"#e5e7eb"};
  margin: 4px 0;
`,fe=r.div`
  padding: 12px 0;
  border-top: 1px solid ${e=>e.isDarkMode?"#374151":"#e5e7eb"};
  margin-top: 8px;
  
  @media (min-width: 769px) {
    display: none;
  }
`,be=r.div`
  display: flex;
  align-items: center;
  padding: 8px 16px;
  gap: 12px;
  margin-bottom: 8px;
`,he=r.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background-color: ${e=>e.isDarkMode?"#374151":"#f3f4f6"};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`,me=r.div`
  flex: 1;
  min-width: 0;
`,ue=r.div`
  font-weight: 600;
  color: ${e=>e.isDarkMode?"#f9fafb":"#111827"};
  font-size: 14px;
  word-break: break-word;
`,we=r.div`
  font-size: 12px;
  color: ${e=>e.isDarkMode?"#9ca3af":"#6b7280"};
  margin-top: 2px;
`,Ie=({isDarkMode:e,setIsDarkMode:v})=>{const[s,p]=i.useState(!1),[t,j]=i.useState(null),[x,m]=i.useState(!1),[g,c]=i.useState(!1),[f,$]=i.useState(!0),d=L(),b=O(),D=i.useRef(null),M=()=>p(!s),y=()=>m(!x),U="http://34.172.63.27:5000/api/auth/check";i.useEffect(()=>{(async()=>{try{const n=await fetch(U,{method:"GET",credentials:"include"});if(n.ok){const I=(await n.json()).user.id,C=await R(I);j(C),c(!0)}else console.error("Failed to authenticate user"),c(!1)}catch(n){console.error("Error loading user data:",n),c(!1)}finally{$(!1)}})()},[]);const S=[{name:"Home",href:"/"},{name:"Charts",href:"/charts"},{name:"WaveLab",href:"/wavelab"},{name:"Services",href:"#services"},{name:"About",href:"#about"},{name:"Contact",href:"#contact"}],z=a=>a.startsWith("#")?b.pathname==="/"&&b.hash===a:b.pathname===a,A=a=>{if(a.startsWith("#")){const n=document.querySelector(a);n&&n.scrollIntoView({behavior:"smooth"})}else d(a);p(!1)},u=()=>{N(),c(!1),m(!1),p(!1)};return o.jsx(G,{isDarkMode:e,children:o.jsxs(V,{children:[o.jsxs(X,{children:[o.jsx(q,{children:o.jsx("img",{src:"/pagasa-logo.png",alt:"PAGASA logo",style:{width:"24px",height:"24px"}})}),"PAGASA"]}),o.jsxs(F,{isOpen:s,isDarkMode:e,children:[S.map((a,n)=>o.jsx(Z,{onClick:()=>A(a.href),isDarkMode:e,isActive:z(a.href),children:a.name},n)),s&&!g&&!f&&o.jsxs(k,{onClick:()=>d("/login"),children:[o.jsx(l,{size:16}),"Sign In"]}),s&&g&&!f&&o.jsxs(fe,{isDarkMode:e,children:[o.jsxs(be,{children:[o.jsx(he,{isDarkMode:e,children:t?.avatar?o.jsx("img",{src:t.avatar,alt:t.username}):o.jsx(l,{size:20,color:e?"#9ca3af":"#6b7280"})}),o.jsxs(me,{children:[o.jsx(ue,{isDarkMode:e,children:t?.username||"Loading..."}),o.jsx(we,{isDarkMode:e,children:t?.position||"Please Wait..."})]})]}),o.jsxs(k,{onClick:()=>u(),children:[o.jsx(w,{size:16}),"Sign Out"]})]})]}),o.jsxs(J,{children:[o.jsx(K,{onClick:()=>v(!e),isDarkMode:e,children:e?o.jsx(P,{}):o.jsx(W,{})}),!g&&!f?o.jsxs(Q,{onClick:()=>d("/login"),children:[o.jsx(l,{size:16}),"Sign In"]}):o.jsxs(oe,{ref:D,children:[o.jsxs(re,{onClick:y,isOpen:x,isDarkMode:e,children:[o.jsx(te,{isDarkMode:e,children:t?.avatar?o.jsx("img",{src:t.avatar,alt:t.username}):o.jsx(l,{size:16,color:e?"#9ca3af":"#6b7280"})}),o.jsxs(ae,{children:[o.jsx(ne,{isDarkMode:e,children:t?.username||"Loading..."}),o.jsx(ie,{isDarkMode:e,children:t?.position||"Please Wait..."})]}),o.jsx(se,{size:16,color:e?"#9ca3af":"#6b7280"})]}),x&&o.jsxs(de,{isDarkMode:e,children:[o.jsxs(le,{isDarkMode:e,children:[o.jsx(ce,{isDarkMode:e,children:t?.username||"User"}),o.jsx(pe,{isDarkMode:e,children:t?.email||"user@example.com"}),o.jsx(xe,{isDarkMode:e,children:t?.position||"Member"})]}),o.jsxs(h,{onClick:()=>d("/profile"),isDarkMode:e,children:[o.jsx(l,{size:16}),"View Profile"]}),o.jsxs(h,{onClick:()=>d("/settings"),isDarkMode:e,children:[o.jsx(Y,{size:16}),"Settings"]}),o.jsx(ge,{isDarkMode:e}),o.jsxs(h,{onClick:u,isDarkMode:e,isSignOut:!0,children:[o.jsx(w,{size:16}),"Sign Out"]})]})]}),o.jsx(ee,{onClick:M,isDarkMode:e,children:s?o.jsx(H,{}):o.jsx(_,{})})]})]})})};export{Ie as default};
