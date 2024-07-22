import React, { useState, useEffect, useRef } from 'react';

export default function PromptInterface() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);

  // Restore the previous state of messages if the page is refreshed
  useEffect(() => {
    const storedMessages = localStorage.getItem('messages');
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }
  }, []);

  // Autoscrolls to bottom of chatbox
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    // @ts-ignore
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages]);

  
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      alert('No token found. Please log in.');
      return;
    }
    console.log('Successfully retrieved JWT from local storage.');

    const newMessage = { role: 'user', content: inputValue };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    localStorage.setItem('messages', JSON.stringify(updatedMessages));

    try {
      const res = await fetch('http://localhost:3001/prompt', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: updatedMessages
        })
      });

      if (!res.ok) {
        const responseText = await res.text();
        console.error('Error response:', responseText);
        throw new Error('Failed to fetch response');
      }

      // "data" represents the GPT response in JSON format
      const data = await res.json();
      console.log('Response data:', data);

      // Ensure data.choices is an array and has at least one item
      const responseMessage = { role: data.message.role, content: data.message.content || 'No response' };


      const finalMessages = [...updatedMessages, responseMessage];

      // Update the state value (messages) so we can update the
      // messages in local storage
      setMessages(finalMessages);

      // Save messages to local storage for persistant page loads
      localStorage.setItem('messages', JSON.stringify(finalMessages));

    } catch (error) {
      console.error('Error retrieving response:', error);
    } finally {
      // Clear input field
      setInputValue('');
    }
  };

  const handleNewConversation = () => {
    localStorage.removeItem('messages');
    setMessages([]);
    console.log('Cleared messages in local storage.');
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-gray-100">
      <div className="flex flex-col flex-grow w-full max-w-md my-20 p-6 bg-white border border-gray-300 rounded-lg shadow-md">
        <div className="flex-grow overflow-y-auto mb-4 h-80">
          <div className="space-y-2">
            {messages.map((message, index) => (
              <div key={index} className={`p-2 ${message.role === 'user' ? 'text-black-600' : 'text-indigo-600'}`}>
                <p>{message.content}</p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        <form id="prompt-form" onSubmit={handleSubmit} className="mt-4">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600"
            placeholder="Type your message..."
          />
          <button
            id="send-prompt"
            type="submit"
            className="px-4 py-2 mt-4 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            Send
          </button>
          <button
            id="new-conversation"
            type="button"
            onClick={handleNewConversation}
            className="px-4 py-2 ml-2 mt-4 font-semibold text-slate-600 bg-slate-200 rounded-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            New Conversation
          </button>
        </form>
      </div>
    </div>
  );
}
