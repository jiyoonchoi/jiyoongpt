import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

export default function PromptInterface() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<{ role: string; content: string; timestamp: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const storedMessages = localStorage.getItem('messages');
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }
  }, []);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
      alert('No token found. Please log in to reauthenticate.');
      return;
    }

    if (inputValue.trim() === '') {
      alert('Please enter a message.');
      return;
    }

    const newMessage = { role: 'user', content: inputValue, timestamp: getTimestamp() };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    localStorage.setItem('messages', JSON.stringify(updatedMessages));

    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('../../api/prompt.ts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'You are a chatbot with a doomsday personality. Your responses should reflect a sense of impending doom and urgency about the state of the world.' },
            ...updatedMessages
          ],
        }),
      });

      if (!res.ok) {
        const responseText = await res.text();
        console.error('Error response:', responseText);
        throw new Error('Failed to fetch response');
      }

      const data = await res.json();

      const responseMessage = { 
        role: data.message.role, content: data.message.content || 
        'No response', timestamp: getTimestamp() };
      const finalMessages = [...updatedMessages, responseMessage];

      setMessages(finalMessages);
      localStorage.setItem('messages', JSON.stringify(finalMessages));
    } catch (error) {
      console.error('Error retrieving response:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    localStorage.removeItem('messages');
    setMessages([]);
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const getTimestamp = () => {
    return new Date().toLocaleString();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header Section */}
      <div className="p-6">
        <h1 className="text-2xl text-gray-400 font-bold">JiyoonGPT</h1>
      </div>
      {/* Sign Out Button */}
      <button
        onClick={handleSignOut}
        className="absolute top-0 right-0 px-4 py-2 mt-4 mr-4 text-xl text-gray-400 font-semibold hover:text-gray-800"
      >
        Sign Out
      </button>
      {/* Main Content */}
      <div className="flex flex-col flex-grow w-full max-w-lg my-20 p-6 bg-white border border-gray-300 rounded-lg shadow-md mx-auto">
        <div className="flex-grow overflow-y-auto mb-4 max-h-80">
          <div className="space-y-2">
            {messages.map((message, index) => (
              <div key={index} className={`p-2 border text-black-600 ${message.role === 'assistant' ? 'bg-gray-100' : ''}`}>
                {message.role === 'assistant' ? (
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                ) : (
                  <p>{message.content}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">{message.timestamp}</p>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
        {isLoading && <p className="text-center text-gray-500 mb-4">Loading...</p>}
        <form onSubmit={handleSubmit} className="mt-4">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-600"
            placeholder="Type your message..."
            disabled={isLoading}
          />
          <div className="flex mt-4">
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
            <button
              type="button"
              onClick={handleNewConversation}
              className="px-4 py-2 ml-2 font-semibold text-slate-600 bg-slate-200 rounded-md hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              New Conversation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
