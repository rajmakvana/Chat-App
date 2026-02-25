import React from 'react'

const ChatNotSelected : React.FC = () => {
  return (
    <div className="flex items-center justify-center h-full flex-1 bg-gray-600">
      <h2 className="text-2xl font-bold text-white  ">Select a chat to start messaging</h2>
    </div>
  )
}

export default ChatNotSelected