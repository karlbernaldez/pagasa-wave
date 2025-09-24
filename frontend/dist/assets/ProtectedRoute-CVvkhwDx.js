import{r as o,u as O,j as e,d as i,N as W}from"./index-CbM3mBlV.js";import"./sweetalert2.esm.all-Bj_ZQUAw.js";import{l as E,r as Y}from"./auth-DWBqGp9a.js";import{A as G,m as B}from"./proxy-5lmoJ-mh.js";import{X as j}from"./x-D_uShodW.js";import{U}from"./user-Bk_FqQSg.js";import{T as L}from"./triangle-alert-DKsms_Dr.js";import{L as $}from"./log-out-vZsQLeKs.js";import"./createLucideIcon-BvXpfdCH.js";const w=i(B.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
  padding: 20px;
`,v=i(B.div)`
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  padding: 32px;
  border-radius: 16px;
  max-width: 28rem;
  width: 100%;
  text-align: center;
  position: relative;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
  }
`,y=i.button`
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(0, 0, 0, 0.05);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #64748b;
  
  &:hover {
    background: rgba(0, 0, 0, 0.1);
    transform: scale(1.1);
  }
`,k=i.div`
  background: ${t=>t.variant==="warning"?"linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)":"linear-gradient(135deg, #e2f3feff 0%, #cad3feff 100%)"};
  border-radius: 50%;
  width: 64px;
  height: 64px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 24px;
  position: relative;
  box-shadow: ${t=>t.variant==="warning"?"0 8px 16px rgba(245, 158, 11, 0.2)":"0 8px 16px rgba(68, 114, 239, 0.2)"};
  
  &::before {
    content: '';
    position: absolute;
    inset: -2px;
    background: ${t=>t.variant==="warning"?"linear-gradient(135deg, #f59e0b, #d97706)":"linear-gradient(135deg, #ef4444, #dc2626)"};
    border-radius: 50%;
    z-index: -1;
    opacity: 0.1;
  }
`,A=i.h2`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #1e293b;
  background: linear-gradient(135deg, #1e293b 0%, #64748b 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
`,S=i.h3`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: ${t=>t.variant==="warning"?"#f59e0b":"#ef4444"};
  opacity: 0.9;
`,C=i.p`
  font-size: 14px;
  color: #64748b;
  margin-bottom: 32px;
  line-height: 1.6;
  font-weight: 400;
`,z=i.div`
  display: flex;
  gap: 12px;
  flex-direction: column;
  
  @media (min-width: 640px) {
    flex-direction: row;
  }
`,T=i.button`
  background: ${t=>t.variant==="warning"?"linear-gradient(to right, #f59e0b 0%, #d97706 100%)":"linear-gradient(to right, #2563eb 0%, #1d4ed8 100%)"};
  color: white;
  border: none;
  border-radius: 12px;
  padding: 14px 24px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  font-family: inherit;
  font-size: 14px;
  transition: all 0.3s ease;
  flex: 1;
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
  
  &:hover {
    background: ${t=>t.variant==="warning"?"linear-gradient(to right, #d97706 0%, #b45309 100%)":"linear-gradient(to right, #1d4ed8 0%, #1e40af 100%)"};
    transform: translateY(-2px);
    box-shadow: ${t=>t.variant==="warning"?"0 8px 16px rgba(245, 158, 11, 0.3)":"0 8px 16px rgba(37, 99, 235, 0.3)"};
    
    &::before {
      left: 100%;
    }
  }
  
  &:active {
    transform: translateY(0);
  }
`,R=i.button`
  background: transparent;
  color: #64748b;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
  font-family: inherit;
  font-size: 14px;
  transition: all 0.3s ease;
  flex: 1;
  
  &:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
    color: #475569;
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`,I=({isOpen:t,onClose:s})=>{const[d,r]=o.useState(!1),[x,n]=o.useState(!1),f=O(),u=()=>{r(!0)},h=()=>{n(!0)},b=()=>{r(!1),s(),E()},M=()=>{f("/dashboard")},g=()=>{n(!1),s(),E()},m=()=>{n(!1)},p={hidden:{opacity:0,scale:.8,y:20},visible:{opacity:1,scale:1,y:0,transition:{type:"spring",stiffness:300,damping:25}},exit:{opacity:0,scale:.8,y:-20,transition:{duration:.2}}},c={hidden:{opacity:0},visible:{opacity:1},exit:{opacity:0}};return e.jsxs(G,{children:[t&&!d&&!x&&e.jsx(w,{variants:c,initial:"hidden",animate:"visible",exit:"exit",onClick:s,children:e.jsxs(v,{variants:p,initial:"hidden",animate:"visible",exit:"exit",onClick:a=>a.stopPropagation(),children:[e.jsx(y,{onClick:s,children:e.jsx(j,{size:18})}),e.jsx(k,{children:e.jsx(U,{size:28,color:"#2563eb"})}),e.jsx(A,{children:"Edit Access Required"}),e.jsx(S,{children:"Standard User Account Needed"}),e.jsx(C,{children:"To edit this content, you need to be signed in with a standard user account. Please sign in to your existing account or create a new one to continue."}),e.jsxs(z,{children:[e.jsxs(T,{onClick:u,children:[e.jsx(U,{size:16}),"Sign In"]}),e.jsx(R,{onClick:h,children:"Create Account"})]})]})}),d&&e.jsx(w,{variants:c,initial:"hidden",animate:"visible",exit:"exit",onClick:()=>r(!1),children:e.jsxs(v,{variants:p,initial:"hidden",animate:"visible",exit:"exit",onClick:a=>a.stopPropagation(),children:[e.jsx(y,{onClick:()=>r(!1),children:e.jsx(j,{size:18})}),e.jsx(k,{variant:"warning",children:e.jsx(L,{size:28,color:"#f59e0b"})}),e.jsx(A,{children:"Switch Account Required"}),e.jsx(S,{variant:"warning",children:"Current Session Will End"}),e.jsx(C,{children:"To access editing features, you'll need to sign out of your current session and sign in with a standard user account. Your current session will be terminated. Alternatively, you can go to the dashboard to continue without signing out."}),e.jsxs(z,{children:[e.jsxs(T,{variant:"warning",onClick:b,children:[e.jsx($,{size:16}),"Sign Out & Continue"]}),e.jsx(R,{onClick:M,children:"Go to Dashboard"})]})]})}),x&&e.jsx(w,{variants:c,initial:"hidden",animate:"visible",exit:"exit",onClick:()=>n(!1),children:e.jsxs(v,{variants:p,initial:"hidden",animate:"visible",exit:"exit",onClick:a=>a.stopPropagation(),children:[e.jsx(y,{onClick:()=>n(!1),children:e.jsx(j,{size:18})}),e.jsx(k,{variant:"warning",children:e.jsx(L,{size:28,color:"#f59e0b"})}),e.jsx(A,{children:"Account Registration Required"}),e.jsx(S,{variant:"warning",children:"Current Session Will End"}),e.jsx(C,{children:"To create a new standard user account, you'll need to sign out of your current session first. This will terminate your current session and redirect you to the registration page."}),e.jsxs(z,{children:[e.jsxs(T,{variant:"warning",onClick:g,children:[e.jsx($,{size:16}),"Sign Out & Register"]}),e.jsx(R,{onClick:m,children:"Stay Signed In"})]})]})})]})},N=i.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
`,q=i.div`
  background-color: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
`,D=i.div`
  margin-top: 10px;
  font-size: 18px;
  font-weight: bold;
`,H=i.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`,ie=({element:t,requireAuth:s=!0,onDeny:d=null,setIsLoggedIn:r})=>{const[x,n]=o.useState(!1),[f,u]=o.useState(!1),[h,b]=o.useState(!0),[M,g]=o.useState(!1),m=O(),c="http://34.172.63.27:5000/api/auth/check",a=async()=>{try{const l=await fetch(c,{method:"GET",credentials:"include"});if(l.ok){const P=await l.json();n(!0),r(!0),P.user.role==="admin"&&(u(!0),g(!0),console.warn("Access denied: Admins cannot access this route."))}else if(l.status===403){const P=await Y();n(!0),r(!0)}else n(!1),r(!1)}catch(l){console.error("Auth check error:",l),n(!1)}finally{b(!1)}};o.useEffect(()=>{a()},[]);const _=()=>{g(!1),m("/login")};return h?e.jsx(N,{children:e.jsxs(q,{children:[e.jsx(H,{}),e.jsx(D,{children:"Loading..."})]})}):s&&!x?typeof d=="function"?d():e.jsx(W,{to:"/login",replace:!0}):f?e.jsx(I,{isOpen:!0,onClose:_}):e.jsx(t,{})};export{ie as default};
