import {useRoutes} from 'react-router-dom'
import router from './router/index'
import 'antd/dist/reset.css'; 
function App() {
  const element = useRoutes(router)
  return (
    <>
    {element}
    </>
  )
}

export default App
