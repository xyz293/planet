import {getconserversation} from '../../../api/company/leader'
import {useEffect, useState} from 'react'
interface student {
   id:number
   name:string
   school:string
}
interface conversation {
    student:student

}


const Conservationlist = () => {
    const [student, setStudent] = useState<conversation[]>([]);

    const show = async () => {
        const res = await getconserversation(5003);
        setStudent(res.data.data);

        console.log(res);
      }
      useEffect(() => {
        show();
      }, []);
      const enter = (id:number) => {
       
      }



    return (
        <div>
          {
            student.map((item) => (
              <div onClick ={()=>enter} key={item.student.id} style={{border:'1px solid #ccc', borderRadius: '10px', padding: '20px', backgroundColor: '#f9f9f9'}}>

                <p>学生姓名：{item.student.name}</p>
                <p>学生学校：{item.student.school}</p>
              </div>
            ))
          }
        </div>
    )
}
export default Conservationlist;

