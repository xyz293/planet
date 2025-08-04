import { lazy } from "react";
import { Suspense } from "react";
import { Spin } from "antd";
const Regiser = lazy(() => import("../page/regiser/regiser"));
const Login = lazy(() => import("../page/login/login"));
const Main = lazy(() => import("../page/main/main"));
const Student = lazy(() => import("../page/student/stduent"));
const DetailCompany = lazy(()=>import("../page/student/company/detail-company"))
const College = lazy(()=>import("../page/college/base-college"))
const router =[
    {
      path:"/regiser", 
      element: <Suspense fallback={<Spin tip="Loading" size="large"></Spin>}><Regiser/></Suspense>
    },
    {
        path:"/login",
        element: <Suspense fallback={<Spin tip="Loading" size="large"></Spin>}><Login/></Suspense>
    },
    {
      path:"/main",
      element: <Suspense fallback={<Spin tip="Loading" size="large"></Spin>}><Main/></Suspense>
    },
    {
      path:"/student",
      element: <Suspense fallback={<Spin tip="Loading" size="large"></Spin>}><Student/></Suspense>
    },
    {
      path:"/company/:id",
      element: <Suspense fallback={<Spin tip="Loading" size="large"></Spin>}><DetailCompany/></Suspense>
    },
    {
      path:"/college",
      element: <Suspense fallback={<Spin tip="Loading" size="large"></Spin>}><College/></Suspense>
    },
    
]
export default router