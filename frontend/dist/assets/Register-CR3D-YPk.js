import{d as a,m as C,r as z,u as q,j as e}from"./index-CbM3mBlV.js";import{b as H}from"./auth-DWBqGp9a.js";import{C as W,Z as O}from"./zap-DMj-vocH.js";import{C as J}from"./cloud-rain-CO_z5SpS.js";import{S as K}from"./sun-zLVnWhv0.js";import{W as Q}from"./wind-CnGxrsCz.js";import{U as F}from"./user-Bk_FqQSg.js";import{M as ee,E as te}from"./mail-BLOUlvvw.js";import{c as R}from"./createLucideIcon-BvXpfdCH.js";import{C as re}from"./calendar-QWcjwBBT.js";import{M as oe}from"./map-pin-Dvg0btCB.js";import{L}from"./lock-NE9apGJw.js";import{E as ae}from"./eye-2Fu8EHtf.js";import{C as ie}from"./check-HktKWu_G.js";import{C as _}from"./circle-alert-TIXdJSGU.js";/**
 * @license lucide-react v0.525.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const se=[["path",{d:"M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16",key:"jecpp"}],["rect",{width:"20",height:"14",x:"2",y:"6",rx:"2",key:"i6l2r4"}]],ne=R("briefcase",se);/**
 * @license lucide-react v0.525.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ce=[["rect",{width:"16",height:"20",x:"4",y:"2",rx:"2",ry:"2",key:"76otgf"}],["path",{d:"M9 22v-4h6v4",key:"r93iot"}],["path",{d:"M8 6h.01",key:"1dz90k"}],["path",{d:"M16 6h.01",key:"1x0f13"}],["path",{d:"M12 6h.01",key:"1vi96p"}],["path",{d:"M12 10h.01",key:"1nrarc"}],["path",{d:"M12 14h.01",key:"1etili"}],["path",{d:"M16 10h.01",key:"1m94wz"}],["path",{d:"M16 14h.01",key:"1gbofw"}],["path",{d:"M8 10h.01",key:"19clt8"}],["path",{d:"M8 14h.01",key:"6423bh"}]],de=R("building",ce);/**
 * @license lucide-react v0.525.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const le=[["path",{d:"M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384",key:"9njp5v"}]],me=R("phone",le);C`
  0%, 100% { 
    transform: translateY(0px) rotate(0deg); 
  }
  33% { 
    transform: translateY(-10px) rotate(120deg); 
  }
  66% { 
    transform: translateY(5px) rotate(240deg); 
  }
`;const A=C`
  0%, 100% { 
    transform: translateY(0px); 
  }
  50% { 
    transform: translateY(-20px); 
  }
`,D=C`
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.8; }
`,pe=C`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`,he=C`
  from { 
    transform: translateX(20px); 
    opacity: 0; 
  }
  to { 
    transform: translateX(0); 
    opacity: 1; 
  }
`,ge=C`
  from { 
    transform: translateX(-20px); 
    opacity: 0; 
  }
  to { 
    transform: translateX(0); 
    opacity: 1; 
  }
`,fe=a.div`
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
`,v=a.div`
  position: absolute;
  color: rgba(255, 255, 255, 0.2);
  pointer-events: none;
  
  &.cloud-1 {
    top: 2.5rem;
    left: 2.5rem;
    animation: ${A} 3s ease-in-out infinite;
  }
  
  &.cloud-2 {
    top: 5rem;
    right: 5rem;
    opacity: 0.15;
    animation: ${A} 4s ease-in-out infinite;
    animation-delay: 1s;
  }
  
  &.cloud-rain {
    bottom: 5rem;
    left: 25%;
    opacity: 0.1;
    animation: ${A} 5s ease-in-out infinite;
    animation-delay: 2s;
  }
  
  &.sun {
    top: 4rem;
    right: 25%;
    color: rgba(253, 224, 71, 0.3);
    animation: ${pe} 20s linear infinite;
  }
  
  &.lightning-1 {
    bottom: 33%;
    right: 2.5rem;
    color: rgba(254, 240, 138, 0.2);
    animation: ${D} 2s ease-in-out infinite;
  }
  
  &.lightning-2 {
    top: 33%;
    left: 4rem;
    color: rgba(254, 240, 138, 0.15);
    animation: ${D} 2.5s ease-in-out infinite;
    animation-delay: 1s;
  }
  
  &.wind {
    bottom: 2.5rem;
    right: 33%;
    animation: ${D} 3s ease-in-out infinite;
  }
`,ue=a.div`
  position: absolute;
  width: 8px;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  animation: ${A} ${t=>3+Math.random()*2}s ease-in-out infinite;
  animation-delay: ${t=>Math.random()*3}s;
  left: ${t=>Math.random()*100}%;
  top: ${t=>Math.random()*100}%;
`,xe=a.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(30, 58, 138, 0.2) 0%, transparent 50%, rgba(6, 182, 212, 0.1) 100%);
  pointer-events: none;
`,be=a.div`
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 28rem;
`,we=a.div`
  text-align: center;
  margin-bottom: 2rem;
`,ye=a.div`
  width: 5rem;
  height: 5rem;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, #ffffffff, #8eb6f7ff);
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
`,je=a.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: transparent;
  background: linear-gradient(135deg, #67e8f9, #93c5fd);
  background-clip: text;
  -webkit-background-clip: text;
  margin-bottom: 0.5rem;
`,ke=a.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  max-width: 20rem;
  margin: 0 auto;
  line-height: 1.5;
`,ve=a.div`
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
`,Se=a.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`,U=a.div`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
  transition: all 0.3s ease;
  background: ${t=>t.active?"linear-gradient(135deg, #06b6d4, #3b82f6)":"rgba(255, 255, 255, 0.2)"};
  color: ${t=>t.active?"white":"rgba(255, 255, 255, 0.6)"};
`,Pe=a.div`
  width: 3rem;
  height: 4px;
  border-radius: 2px;
  transition: all 0.3s ease;
  background: ${t=>t.active?"linear-gradient(135deg, #06b6d4, #3b82f6)":"rgba(255, 255, 255, 0.2)"};
`,ze=a.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  padding: 2rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.2);
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
`,Ce=a.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`,G=a.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: ${t=>t.direction==="right"?he:ge} 0.3s ease-out;
`,X=a.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: white;
  margin-bottom: 1rem;
`,Z=a.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`,Me=a.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
`,V=a.div`
  position: relative;
  width: 100%;
  box-sizing: border-box;
`,$e=a.div`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  color: rgba(255, 255, 255, 0.6);
  transition: color 0.3s ease;

  ${V}:focus-within & {
    color: rgba(255, 255, 255, 0.8);
  }
`,Ne=a.input`
  width: 100%;
  box-sizing: border-box;
  padding: 1rem 1rem 1rem 3rem;
  padding-right: ${t=>t.hasRightIcon?"3rem":"1rem"};
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid ${t=>t.hasError?"rgba(239, 68, 68, 0.5)":"rgba(255, 255, 255, 0.2)"};
  border-radius: 1rem;
  color: white;
  font-size: 1rem;
  outline: none;
  transition: all 0.3s ease;
  min-width: 0;
  max-width: 100%;

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

  /* Date input specific styles */
  &[type="date"] {
    &::-webkit-calendar-picker-indicator {
      filter: invert(1);
      opacity: 0.6;
      cursor: pointer;
    }
    
    &::-webkit-datetime-edit {
      color: white;
    }
    
    &::-webkit-datetime-edit-fields-wrapper {
      padding: 0;
    }
    
    &::-webkit-datetime-edit-text {
      color: rgba(255, 255, 255, 0.6);
      padding: 0 0.2em;
    }
    
    &::-webkit-datetime-edit-month-field,
    &::-webkit-datetime-edit-day-field,
    &::-webkit-datetime-edit-year-field {
      padding: 0;
      color: white;
    }
  }
`,Y=a.div`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${t=>t.success?"#4ade80":t.error?"#ef4444":"rgba(255, 255, 255, 0.6)"};
  cursor: ${t=>t.clickable?"pointer":"default"};
  transition: color 0.3s ease;

  &:hover {
    color: ${t=>t.clickable?"rgba(255, 255, 255, 0.8)":void 0};
  }
`,Ae=a.p`
  color: #fca5a5;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  margin-left: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`,Ee=a.div`
  display: flex;
  gap: 1rem;
`,T=a.button`
  flex: ${t=>t.flex||"1"};
  padding: 1rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  outline: none;

  ${t=>t.primary?`
    background: linear-gradient(135deg, #06b6d4, #3b82f6);
    color: white;
    box-shadow: 0 10px 25px rgba(6, 182, 212, 0.3);

    &:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 15px 35px rgba(6, 182, 212, 0.4);
      background: linear-gradient(135deg, #0891b2, #2563eb);
    }

    &:focus {
      box-shadow: 0 0 0 4px rgba(6, 182, 212, 0.5);
    }

    &:active {
      transform: translateY(0) scale(1);
    }
  `:`
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);

    &:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }
  `}
`,Ie=a.div`
  text-align: center;
  margin-top: 2rem;
`,Fe=a.button`
  background: none;
  border: none;
  color: #67e8f9;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.3s ease;

  &:hover {
    color: #93c5fd;
  }
`,b=({icon:t,type:E="text",name:i,placeholder:m,showToggle:M=!1,formData:s,errors:y,touched:d,showPassword:p,showConfirmPassword:h,setShowPassword:g,setShowConfirmPassword:j,handleInputChange:N,handleBlur:S,getMaxDate:f,getMinDate:u})=>{const k=i==="password"||i==="confirmPassword",$=i==="password"?p:h,I=i==="password"?g:j,P=y[i]&&d[i],l=!y[i]&&s[i]&&d[i],x={type:k&&!$?"password":E,name:i,value:s[i],onChange:N,onBlur:S,placeholder:m,hasError:P,hasRightIcon:k||P||l,...i==="dateOfBirth"&&{max:f(),min:u()}};return e.jsxs(Me,{children:[e.jsxs(V,{children:[e.jsx($e,{children:e.jsx(t,{size:18})}),e.jsx(Ne,{...x}),k&&e.jsx(Y,{clickable:!0,onClick:()=>I(!$),children:$?e.jsx(te,{size:18}):e.jsx(ae,{size:18})}),!k&&l&&e.jsx(Y,{success:!0,children:e.jsx(ie,{size:18})}),!k&&P&&e.jsx(Y,{error:!0,children:e.jsx(_,{size:18})})]}),P&&e.jsxs(Ae,{children:[e.jsx(_,{size:14}),y[i]]})]})},He=()=>{const[t,E]=z.useState({firstName:"",lastName:"",username:"",email:"",contact:"",password:"",confirmPassword:"",address:"",agency:"",position:"",birthday:""}),i=q(),[m,M]=z.useState({}),[s,y]=z.useState({}),[d,p]=z.useState(!1),[h,g]=z.useState(!1),[j,N]=z.useState(1),S=(n,r)=>{switch(n){case"firstName":case"lastName":return r.trim().length<2?"Must be at least 2 characters":"";case"username":return r.length<3?"Username must be at least 3 characters":/^[a-zA-Z0-9_]+$/.test(r)?"":"Only letters, numbers, and underscore allowed";case"email":return/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r)?"":"Please enter a valid email";case"contact":return/^(?:\+63|0)(9\d{9}|2\d{7,8}|[3-9]\d{7})$/.test(r.replace(/\s/g,""))?"":"Please enter a valid Philippine phone number";case"password":return r.length<8?"Password must be at least 8 characters":/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(r)?"":"Must contain uppercase, lowercase, and number";case"confirmPassword":return r!==t.password?"Passwords do not match":"";case"birthday":if(!r)return"Date of birth is required";const c=new Date(r),o=new Date;let w=o.getFullYear()-c.getFullYear();const B=o.getMonth()-c.getMonth();return(B<0||B===0&&o.getDate()<c.getDate())&&w--,c>o?"Birth date cannot be in the future":w<16?"Must be at least 16 years old":w>120?"Please enter a valid birth date":"";case"address":case"agency":case"position":return r.trim().length<2?"This field is required":"";default:return""}},f=n=>{const{name:r,value:c}=n.target;E(o=>({...o,[r]:c})),s[r]&&M(o=>({...o,[r]:S(r,c)}))},u=n=>{const{name:r,value:c}=n.target;y(o=>({...o,[r]:!0})),M(o=>({...o,[r]:S(r,c)}))},k=async n=>{n.preventDefault();const r={},c={};if(Object.keys(t).forEach(o=>{c[o]=!0;const w=S(o,t[o]);w&&(r[o]=w)}),y(c),M(r),Object.keys(r).length===0)try{const o=await H(t);alert("Registration successful! Welcome to VOTE WAVE!"),i("/login")}catch(o){console.error("Registration error:",o.message),alert("Registration failed. Please try again.")}},$=()=>{i("/login")},I=()=>{const n=["firstName","lastName","username","email"],r={},c={};n.forEach(o=>{c[o]=!0;const w=S(o,t[o]);w&&(r[o]=w)}),y(o=>({...o,...c})),M(o=>({...o,...r})),Object.keys(r).length===0&&N(2)},P=()=>{N(1)},l=()=>new Date().toISOString().split("T")[0],x=()=>{const n=new Date;return n.setFullYear(n.getFullYear()-120),n.toISOString().split("T")[0]};return e.jsxs(fe,{children:[e.jsx(v,{className:"cloud-1",children:e.jsx(W,{size:80})}),e.jsx(v,{className:"cloud-2",children:e.jsx(W,{size:60})}),e.jsx(v,{className:"cloud-rain",children:e.jsx(J,{size:70})}),e.jsx(v,{className:"sun",children:e.jsx(K,{size:90})}),e.jsx(v,{className:"lightning-1",children:e.jsx(O,{size:50})}),e.jsx(v,{className:"lightning-2",children:e.jsx(O,{size:40})}),e.jsx(v,{className:"wind",children:e.jsx(Q,{size:60})}),[...Array(15)].map((n,r)=>e.jsx(ue,{},r)),e.jsx(xe,{}),e.jsxs(be,{children:[e.jsxs(we,{children:[e.jsx(ye,{children:e.jsx("img",{src:"/pagasa-logo.png",alt:"Logo",style:{width:"60px",height:"auto"}})}),e.jsx(je,{children:"PAGASA"}),e.jsx(ke,{children:"Philippine Atmospheric, Geophysical and Astronomical Services Administration"})]}),e.jsx(ve,{children:e.jsxs(Se,{children:[e.jsx(U,{active:j>=1,children:"1"}),e.jsx(Pe,{active:j>=2}),e.jsx(U,{active:j>=2,children:"2"})]})}),e.jsxs(ze,{children:[e.jsxs(Ce,{children:[j===1&&e.jsxs(G,{direction:"right",children:[e.jsx(X,{children:"Personal Information"}),e.jsxs(Z,{children:[e.jsx(b,{icon:F,name:"firstName",placeholder:"First Name",formData:t,errors:m,touched:s,showPassword:d,showConfirmPassword:h,setShowPassword:p,setShowConfirmPassword:g,handleInputChange:f,handleBlur:u,getMaxDate:l,getMinDate:x}),e.jsx(b,{icon:F,name:"lastName",placeholder:"Last Name",formData:t,errors:m,touched:s,showPassword:d,showConfirmPassword:h,setShowPassword:p,setShowConfirmPassword:g,handleInputChange:f,handleBlur:u,getMaxDate:l,getMinDate:x})]}),e.jsx(b,{icon:F,name:"username",placeholder:"Username",formData:t,errors:m,touched:s,showPassword:d,showConfirmPassword:h,setShowPassword:p,setShowConfirmPassword:g,handleInputChange:f,handleBlur:u,getMaxDate:l,getMinDate:x}),e.jsx(b,{icon:ee,type:"email",name:"email",placeholder:"Email Address",formData:t,errors:m,touched:s,showPassword:d,showConfirmPassword:h,setShowPassword:p,setShowConfirmPassword:g,handleInputChange:f,handleBlur:u,getMaxDate:l,getMinDate:x}),e.jsx(T,{primary:!0,onClick:I,children:"Continue to Next Step"})]}),j===2&&e.jsxs(G,{direction:"left",children:[e.jsx(X,{children:"Complete Your Profile"}),e.jsx(b,{icon:me,type:"tel",name:"contact",placeholder:"Phone Number",formData:t,errors:m,touched:s,showPassword:d,showConfirmPassword:h,setShowPassword:p,setShowConfirmPassword:g,handleInputChange:f,handleBlur:u,getMaxDate:l,getMinDate:x}),e.jsx(b,{icon:re,type:"date",name:"birthday",placeholder:"Date of Birth",formData:t,errors:m,touched:s,showPassword:d,showConfirmPassword:h,setShowPassword:p,setShowConfirmPassword:g,handleInputChange:f,handleBlur:u,getMaxDate:l,getMinDate:x}),e.jsx(b,{icon:oe,name:"address",placeholder:"Address",formData:t,errors:m,touched:s,showPassword:d,showConfirmPassword:h,setShowPassword:p,setShowConfirmPassword:g,handleInputChange:f,handleBlur:u,getMaxDate:l,getMinDate:x}),e.jsxs(Z,{children:[e.jsx(b,{icon:de,name:"agency",placeholder:"Agency",formData:t,errors:m,touched:s,showPassword:d,showConfirmPassword:h,setShowPassword:p,setShowConfirmPassword:g,handleInputChange:f,handleBlur:u,getMaxDate:l,getMinDate:x}),e.jsx(b,{icon:ne,name:"position",placeholder:"Position",formData:t,errors:m,touched:s,showPassword:d,showConfirmPassword:h,setShowPassword:p,setShowConfirmPassword:g,handleInputChange:f,handleBlur:u,getMaxDate:l,getMinDate:x})]}),e.jsx(b,{icon:L,name:"password",placeholder:"Password",showToggle:!0,formData:t,errors:m,touched:s,showPassword:d,showConfirmPassword:h,setShowPassword:p,setShowConfirmPassword:g,handleInputChange:f,handleBlur:u,getMaxDate:l,getMinDate:x}),e.jsx(b,{icon:L,name:"confirmPassword",placeholder:"Confirm Password",showToggle:!0,formData:t,errors:m,touched:s,showPassword:d,showConfirmPassword:h,setShowPassword:p,setShowConfirmPassword:g,handleInputChange:f,handleBlur:u,getMaxDate:l,getMinDate:x}),e.jsxs(Ee,{children:[e.jsx(T,{onClick:P,children:"Back"}),e.jsx(T,{primary:!0,onClick:k,children:"Create Account"})]})]})]}),e.jsx(Ie,{children:e.jsxs("p",{style:{color:"rgba(255, 255, 255, 0.7)",fontSize:"0.875rem"},children:["Already have an account?"," ",e.jsx(Fe,{onClick:$,style:{cursor:"pointer"},children:"Sign in here"})]})})]})]})]})};export{He as default};
