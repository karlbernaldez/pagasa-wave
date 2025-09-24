import{r as n,u as b,j as t,d as i}from"./index-CbM3mBlV.js";import{r as j}from"./auth-DWBqGp9a.js";const k="http://34.172.63.27:5000/api/auth",d=`${k}/check`,w=i.div`
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
`,A=i.div`
  background-color: #fff;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
`,E=i.div`
  margin-top: 10px;
  font-size: 18px;
  font-weight: bold;
`,L=i.div`
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
`,y=({element:l,requireAuth:u=!0,onDeny:o=null})=>{const[f,s]=n.useState(!1),[p,h]=n.useState(!0),[x,r]=n.useState(null),a=b(),g=async()=>{try{const e=await fetch(d,{method:"GET",credentials:"include"});if(e.ok){const c=await e.json();s(!0),r(c.user.role)}else if(e.status===403){await j();const m=await(await fetch(d,{method:"GET",credentials:"include"})).json();s(!0),r(m.user.role)}else s(!1)}catch(e){console.error("Error during authentication check:",e),s(!1)}h(!1)};return n.useEffect(()=>{g()},[]),p?t.jsx(w,{children:t.jsxs(A,{children:[t.jsx(L,{}),t.jsx(E,{children:"Loading..."})]})}):u&&!f?typeof o=="function"?o():a("/login"):x!=="admin"?typeof o=="function"?o():a("/unauthorized"):t.jsx(l,{})};export{y as default};
