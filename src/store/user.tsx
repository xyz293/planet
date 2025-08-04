import {create} from 'zustand'
import { persist } from 'zustand/middleware'
interface UserStore {
  token: string;
  setToken: (token: string) => void;
  id: number;
  setId: (id: number) => void;
}
const userStore = create<UserStore>((set) => ({
   token: '',
   id: 0,
   setToken: (token) => set({token}),
    setId: (id) => set({id}),
}))
export default userStore