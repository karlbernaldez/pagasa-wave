import{u as B,r as i,d as r,m,j as e}from"./index-CbM3mBlV.js";import{f as U}from"./userAPI-BfRCCs7E.js";import"./index-C7om5-QH.js";import{a as H}from"./auth-DWBqGp9a.js";import{C as P,Z as Y}from"./zap-DMj-vocH.js";import{C as O}from"./cloud-rain-CO_z5SpS.js";import{S as Z}from"./sun-zLVnWhv0.js";import{W as q}from"./wind-CnGxrsCz.js";import{c as J}from"./createLucideIcon-BvXpfdCH.js";import{C as j}from"./circle-alert-TIXdJSGU.js";import{M as K,E as Q}from"./mail-BLOUlvvw.js";import{C as V}from"./check-HktKWu_G.js";import{L as X}from"./lock-NE9apGJw.js";import{E as ee}from"./eye-2Fu8EHtf.js";/**
 * @license lucide-react v0.525.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const re=[["path",{d:"m12 19-7-7 7-7",key:"1l729n"}],["path",{d:"M19 12H5",key:"x3x0zl"}]],oe=J("arrow-left",re),te="http://34.172.63.27:5000/api/auth",ae=(o="/wavelab")=>{const g=B();i.useEffect(()=>{(async()=>{try{const a=await fetch(`${te}/check`,{method:"GET",credentials:"include"}),x=await a.json();a.ok&&(x.user.role==="admin"&&(o="/dashboard"),g(o))}catch(a){console.error("Auth check failed:",a)}})()},[g,o])};m`
  0%, 100% { 
    transform: translateY(0px) rotate(0deg); 
  }
  33% { 
    transform: translateY(-10px) rotate(120deg); 
  }
  66% { 
    transform: translateY(5px) rotate(240deg); 
  }
`;const b=m`
  0%, 100% { 
    transform: translateY(0px); 
  }
  50% { 
    transform: translateY(-20px); 
  }
`,v=m`
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
`,se=m`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`,z=m`
  from { 
    transform: translateY(20px); 
    opacity: 0; 
  }
  to { 
    transform: translateY(0); 
    opacity: 1; 
  }
`,ne=r.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #0891b2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  position: relative;
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  box-sizing: border-box;
`,n=r.div`
  position: absolute;
  color: rgba(255, 255, 255, 0.2);
  pointer-events: none;
  
  &.cloud-1 {
    top: 2.5rem;
    left: 2.5rem;
    animation: ${b} 3s ease-in-out infinite;
  }
  
  &.cloud-2 {
    top: 5rem;
    right: 5rem;
    opacity: 0.15;
    animation: ${b} 4s ease-in-out infinite;
    animation-delay: 1s;
  }
  
  &.cloud-rain {
    bottom: 5rem;
    left: 25%;
    opacity: 0.1;
    animation: ${b} 5s ease-in-out infinite;
    animation-delay: 2s;
  }
  
  &.sun {
    top: 4rem;
    right: 25%;
    color: rgba(253, 224, 71, 0.3);
    animation: ${se} 20s linear infinite;
  }
  
  &.lightning-1 {
    bottom: 33%;
    right: 2.5rem;
    color: rgba(254, 240, 138, 0.2);
    animation: ${v} 2s ease-in-out infinite;
  }
  
  &.lightning-2 {
    top: 33%;
    left: 4rem;
    color: rgba(254, 240, 138, 0.15);
    animation: ${v} 2.5s ease-in-out infinite;
    animation-delay: 1s;
  }
  
  &.wind {
    bottom: 2.5rem;
    right: 33%;
    animation: ${v} 3s ease-in-out infinite;
  }
`,ie=r.div`
  position: absolute;
  width: 8px;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  animation: ${b} ${o=>3+Math.random()*2}s ease-in-out infinite;
  animation-delay: ${o=>Math.random()*3}s;
  left: ${o=>Math.random()*100}%;
  top: ${o=>Math.random()*100}%;
`,le=r.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(30, 58, 138, 0.2) 0%, transparent 50%, rgba(6, 182, 212, 0.1) 100%);
  pointer-events: none;
`,ce=r.button`
  position: absolute;
  top: 2rem;
  left: 2rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 100;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(0);
  }
`,de=r.div`
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 28rem;
`,me=r.div`
  text-align: center;
  margin-bottom: 2rem;
  animation: ${z} 0.6s ease-out;
`,ge=r.div`
  width: 5rem;
  height: 5rem;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, #ffffff, #e0f2fe);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  
  img {
    width: 3.5rem;
    height: 3.5rem;
    object-fit: contain;
  }
`,pe=r.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: transparent;
  background: linear-gradient(135deg, #67e8f9, #93c5fd);
  background-clip: text;
  -webkit-background-clip: text;
  margin-bottom: 0.5rem;
`,ue=r.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  max-width: 20rem;
  margin: 0 auto;
  line-height: 1.5;
`,he=r.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  padding: 2.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.2);
  width: 100%;
  box-sizing: border-box;
  animation: ${z} 0.8s ease-out 0.2s both;
`,fe=r.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`,N=r.div`
  position: relative;
  display: flex;
  flex-direction: column;
`,y=r.div`
  position: relative;
  width: 100%;
`,F=r.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  color: rgba(255, 255, 255, 0.6);
  transition: color 0.3s ease;

  ${y}:focus-within & {
    color: rgba(255, 255, 255, 0.8);
  }
`,M=r.input`
  width: 100%;
  box-sizing: border-box;
  padding: 1rem 1rem 1rem 3rem;
  padding-right: ${o=>o.hasRightIcon?"3rem":"1rem"};
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid ${o=>o.hasError?"rgba(239, 68, 68, 0.5)":"rgba(255, 255, 255, 0.2)"};
  border-radius: 1rem;
  color: white;
  font-size: 1rem;
  outline: none;
  transition: all 0.3s ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  &:focus {
    border-color: rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-1px);
  }

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`,R=r.div`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${o=>o.success?"#4ade80":o.error?"#ef4444":"rgba(255, 255, 255, 0.6)"};
  cursor: ${o=>o.clickable?"pointer":"default"};
  transition: color 0.3s ease;

  &:hover {
    color: ${o=>o.clickable?"rgba(255, 255, 255, 0.8)":void 0};
  }
`,k=r.div`
  color: #fca5a5;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  margin-left: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  animation: ${z} 0.3s ease-out;
`,be=r.button`
  background: linear-gradient(135deg, #06b6d4, #3b82f6);
  color: white;
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 10px 25px rgba(6, 182, 212, 0.3);
  margin-top: 0.5rem;

  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 15px 35px rgba(6, 182, 212, 0.4);
    background: linear-gradient(135deg, #0891b2, #2563eb);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.5);
  }

  &:active {
    transform: translateY(0) scale(1);
  }
`,xe=r.div`
  text-align: right;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  margin-bottom: 0.5rem;
  padding: 0.25rem;
  border-radius: 0.5rem;
  transition: all 0.3s ease;

  &:hover {
    color: #67e8f9;
    background: rgba(255, 255, 255, 0.05);
  }
`,we=r.div`
  text-align: center;
  margin-top: 2rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
`,je=r.button`
  background: none;
  border: none;
  color: #67e8f9;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.3s ease;
  padding: 0.25rem;
  border-radius: 0.25rem;

  &:hover {
    color: #93c5fd;
    background: rgba(255, 255, 255, 0.05);
  }
`,Me=({isLoggedIn:o,setIsLoggedIn:g})=>{const c=B(),[a,x]=i.useState(""),[d,W]=i.useState(""),[w,G]=i.useState(!1),[E,p]=i.useState(""),[l,$]=i.useState({email:!1,password:!1});ae(),i.useEffect(()=>{navigator.geolocation&&navigator.geolocation.getCurrentPosition(t=>{const s={latitude:t.coords.latitude,longitude:t.coords.longitude};window.userLocation=s},t=>{})},[]);const A=t=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)?"":"Please enter a valid email",C=t=>t.length<1?"Password is required":"",_=t=>{x(t.target.value),l.email&&p("")},D=t=>{W(t.target.value),l.password&&p("")},S=t=>{$(s=>({...s,[t]:!0}))},T=async t=>{t.preventDefault(),$({email:!0,password:!0});const s=A(a),L=C(d);if(s||L){p(s||L);return}try{const f=await H({email:a,password:d});if(!f)throw new Error("No response received from the server.");(await U(f.user.id)).role==="admin"?c("/dashboard"):c("/wavelab"),g(!0)}catch(f){p(f.message||"Login failed. Please try again.")}},u=l.email?A(a):"",h=l.password?C(d):"",I=l.email&&!u&&a;return l.password,e.jsxs(ne,{children:[e.jsx(n,{className:"cloud-1",children:e.jsx(P,{size:80})}),e.jsx(n,{className:"cloud-2",children:e.jsx(P,{size:60})}),e.jsx(n,{className:"cloud-rain",children:e.jsx(O,{size:70})}),e.jsx(n,{className:"sun",children:e.jsx(Z,{size:90})}),e.jsx(n,{className:"lightning-1",children:e.jsx(Y,{size:50})}),e.jsx(n,{className:"lightning-2",children:e.jsx(Y,{size:40})}),e.jsx(n,{className:"wind",children:e.jsx(q,{size:60})}),[...Array(15)].map((t,s)=>e.jsx(ie,{},s)),e.jsx(le,{}),e.jsx(ce,{onClick:()=>c("/"),children:e.jsx(oe,{size:18})}),e.jsxs(de,{children:[e.jsxs(me,{children:[e.jsx(ge,{children:e.jsx("img",{src:"/pagasa-logo.png",alt:"PAGASA Logo"})}),e.jsx(pe,{children:"PAGASA"}),e.jsx(ue,{children:"Philippine Atmospheric, Geophysical and Astronomical Services Administration"})]}),e.jsx(he,{children:e.jsxs(fe,{onSubmit:T,children:[E&&e.jsxs(k,{children:[e.jsx(j,{size:16}),E]}),e.jsxs(N,{children:[e.jsxs(y,{children:[e.jsx(F,{children:e.jsx(K,{size:18})}),e.jsx(M,{type:"email",placeholder:"Email",value:a,onChange:_,onBlur:()=>S("email"),hasError:!!u,hasRightIcon:I}),I&&e.jsx(R,{success:!0,children:e.jsx(V,{size:18})})]}),u&&e.jsxs(k,{children:[e.jsx(j,{size:14}),u]})]}),e.jsxs(N,{children:[e.jsxs(y,{children:[e.jsx(F,{children:e.jsx(X,{size:18})}),e.jsx(M,{type:w?"text":"password",placeholder:"Password",value:d,onChange:D,onBlur:()=>S("password"),hasError:!!h,hasRightIcon:!0}),e.jsx(R,{clickable:!0,onClick:()=>G(!w),children:w?e.jsx(Q,{size:18}):e.jsx(ee,{size:18})})]}),h&&e.jsxs(k,{children:[e.jsx(j,{size:14}),h]})]}),e.jsx(xe,{children:"Forgot password?"}),e.jsx(be,{type:"submit",children:"Log In"}),e.jsxs(we,{children:["Don't have an account?"," ",e.jsx(je,{onClick:()=>c("/register"),children:"Register here"})]})]})})]})]})};export{Me as default};
