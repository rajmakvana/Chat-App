import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Chat from './pages/Chat'
import ChatSection from "./components/ChatSection";
import ChatNotSelected from './components/ChatNotSelected'

const App : React.FC = () => {
  return (
    <Routes>
      <Route index element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path='/chat' element={<Chat/>} >
          <Route index element={<ChatNotSelected/>}/>
          <Route path=":userId" element={<ChatSection />} />
      </Route>
    </Routes>
  )
}

export default App