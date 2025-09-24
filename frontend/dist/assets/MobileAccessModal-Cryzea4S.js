import{j as i,d as t}from"./index-CbM3mBlV.js";import{b as r}from"./index-Dm-_dRF2.js";import{A as a,m as s}from"./proxy-5lmoJ-mh.js";const c=t.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`,d=t(s.div)`
  background: white;
  padding: 30px 20px;
  border-radius: 16px;
  max-width: 320px;
  width: 100%;
  text-align: center;
  position: relative;
  box-shadow: 0px 12px 30px rgba(0, 0, 0, 0.1);
`,p=t.div`
  background: #f1f5f9;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto 16px;
`,l=t.h2`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
`,x=t.p`
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 24px;
`,h=t.button`
  background-color: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 16px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  justify-content: center;

  &:hover {
    background-color: #1d4ed8;
  }
`,m={hidden:{opacity:0,y:-20},visible:{opacity:1,y:0},exit:{opacity:0,y:-20}},u=({isOpen:o,onClose:e})=>i.jsx(a,{children:o&&i.jsx(c,{onClick:e,children:i.jsxs(d,{variants:m,initial:"hidden",animate:"visible",exit:"exit",onClick:n=>n.stopPropagation(),children:[i.jsx(p,{children:i.jsx(r,{size:22,color:"#FF3333"})}),i.jsx(l,{children:"Access Restricted"}),i.jsx(x,{children:"This feature is not available on smaller screens. Please switch to desktop or maximize your window."}),i.jsx(h,{onClick:e,children:"Okay, got it"})]})})});export{u as default};
