import { lazy } from "react";
import { Suspense } from "react";
import { Spin } from "antd";
const Regiser = lazy(() => import("../page/regiser/regiser"));
const Login = lazy(() => import("../page/login/login"));
const Main = lazy(() => import("../page/main/main"));
const Student = lazy(() => import("../page/student/stduent"));
const DetailCompany = lazy(()=>import("../page/student/company/detail-company"))
const College = lazy(()=>import("../page/college/base-college"))
const Company = lazy(()=>import("../page/company/base-company"))
const DetailCollege = lazy(()=>import("../page/student/college/detail-college"))
const Resourse = lazy(()=>import("../page/student/college/detail-page"))
const StudentJobDetail = lazy(()=>import("../page/company/compment/student-job-detail"))

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
      path:"/company/:id/:jobid",

      element: <Suspense fallback={<Spin tip="Loading" size="large"></Spin>}><DetailCompany/></Suspense>
    },
    {
      path:"/college",
      element: <Suspense fallback={<Spin tip="Loading" size="large"></Spin>}><College/></Suspense>
    },
    {
      path:"/company",
      element: <Suspense fallback={<Spin tip="Loading" size="large"></Spin>}><Company/></Suspense>
    },
    {
      path:"/college/:name",
      element: <Suspense fallback={<Spin tip="Loading" size="large"></Spin>}><DetailCollege/></Suspense>
    },{
      path:'/resourse/:id',
      element: <Suspense fallback={<Spin tip="Loading" size="large"></Spin>}><Resourse/></Suspense>
    },
    {
      path:'/studentdetail/:id/:jobId',

      element: <Suspense fallback={<Spin tip="Loading" size="large"></Spin>}><StudentJobDetail/></Suspense>
    }
]
export default router