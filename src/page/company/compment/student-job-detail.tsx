import {getjobdetail} from '../../../api/company/leader'
import {useParams} from 'react-router-dom'
import {useEffect} from 'react'


const StudentJobDetail = () => {
  const {id} = useParams()
const showjobdetail = async () => {
  const res = await getjobdetail(Number(id))
  console.log(res)

}
useEffect(() => {
  showjobdetail()
}, [])


   return(
    <div>

    </div>
   ) 
}
export default StudentJobDetail
