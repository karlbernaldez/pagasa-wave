import{u as l,j as e,d as t}from"./index-CbM3mBlV.js";import{l as p}from"./auth-DWBqGp9a.js";import{c as x,d as n}from"./index-Dm-_dRF2.js";import{A as g,m as o}from"./proxy-5lmoJ-mh.js";const b=t.div`
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
`,f=t(o.div)`
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  padding: 32px;
  border-radius: 20px;
  max-width: 400px;
  width: 100%;
  text-align: center;
  position: relative;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.8);
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
`,h=t.button`
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
`,u=t.div`
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border-radius: 50%;
  width: 64px;
  height: 64px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 24px;
  position: relative;
  box-shadow: 0 8px 16px rgba(239, 68, 68, 0.2);
  
  &::before {
    content: '';
    position: absolute;
    inset: -2px;
    background: linear-gradient(135deg, #ef4444, #dc2626);
    border-radius: 50%;
    z-index: -1;
    opacity: 0.1;
  }
`,m=t.h2`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
  color: #1e293b;
  background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
`,y=t.h3`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #ef4444;
  opacity: 0.9;
`,v=t.p`
  font-size: 15px;
  color: #64748b;
  margin-bottom: 32px;
  line-height: 1.6;
  font-weight: 400;
`,k=t.div`
  display: flex;
  gap: 12px;
  flex-direction: column;
  
  @media (min-width: 400px) {
    flex-direction: row;
  }
`,w=t.button`
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
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
    background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
    
    &::before {
      left: 100%;
    }
  }
  
  &:active {
    transform: translateY(0);
  }
`,j=t.button`
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
`,z={hidden:{opacity:0,scale:.8,y:20},visible:{opacity:1,scale:1,y:0,transition:{type:"spring",stiffness:300,damping:25}},exit:{opacity:0,scale:.8,y:-20,transition:{duration:.2}}},A={hidden:{opacity:0},visible:{opacity:1},exit:{opacity:0}},Y=({isOpen:r,onClose:i})=>{const a=l(),s=()=>{a("/wavelab")},d=()=>{i(),p()};return e.jsx(g,{children:r&&e.jsx(o.div,{variants:A,initial:"hidden",animate:"visible",exit:"exit",children:e.jsx(b,{onClick:i,children:e.jsxs(f,{variants:z,initial:"hidden",animate:"visible",exit:"exit",onClick:c=>c.stopPropagation(),children:[e.jsx(h,{onClick:i,children:e.jsx(x,{size:18})}),e.jsx(u,{children:e.jsx(n,{size:28,color:"#ef4444"})}),e.jsx(m,{children:"Access Restricted"}),e.jsx(y,{children:"Admin Credentials Required"}),e.jsx(v,{children:"This page requires administrator privileges to access. Please log in with your admin account or go to your dashboard to continue."}),e.jsxs(k,{children:[e.jsxs(w,{onClick:d,children:[e.jsx(n,{size:16}),"Login as Admin"]}),e.jsx(j,{onClick:s,children:"Go to Dashboard"})]})]})})})})};export{Y as default};
