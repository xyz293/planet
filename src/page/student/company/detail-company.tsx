import {useParams} from 'react-router-dom'
import {getcompanydetail} from '../../../api/company'
import {useEffect,useState} from 'react'
import './detail.scss'

interface DetailCompanyParams{
     company:string,
     id?:number,
     location:string,
     position:string,
     requirement:string,
     salary:string
}
const DetailCompany = ()=>{
    const params = useParams()
    const id = Number(params.id)
    const [company,setCompany] = useState<DetailCompanyParams>()
    const showdetail = async()=>{
        const res = await getcompanydetail(id)
        console.log(res)
        setCompany(res.data.data)
    }
    useEffect(()=>{
        showdetail()
    },[])
    return(
        <div className="detail-company">
    <h2>{company?.company}</h2>
    <p>职位：{company?.position}</p>
    <p>地点：{company?.location}</p>
    <p>要求：{company?.requirement}</p>
    <p>薪资：{company?.salary}</p>
  </div>
    )
}
export default DetailCompany