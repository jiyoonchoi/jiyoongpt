import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

export default function PromptInterface() {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<{ role: string; content: string; timestamp: string }[]>([]);

  // Restore the previous state of messages if the page is refreshed
  useEffect(() => {
    const storedMessages = localStorage.getItem('messages');
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
    }
  }, []);

  // Autoscrolls to bottom of chatbox
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView();
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
    console.log('Successfully retrieved JWT from local storage.');

    const newMessage = { role: 'user', content: inputValue, timestamp: getTimestamp() };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    localStorage.setItem('messages', JSON.stringify(updatedMessages));

    setInputValue('');

    try {
      const res = await fetch('http://localhost:3001/prompt', {
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

      // "data" represents the GPT response in JSON format
      const data = await res.json();
      console.log('Response data:', data);

      // Ensure data.choices is an array and has at least one item
      const responseMessage = { role: data.message.role, content: data.message.content || 'No response', timestamp: getTimestamp() };
      const finalMessages = [...updatedMessages, responseMessage];

      // Update the state value (messages) so we can update the
      // messages in local storage
      setMessages(finalMessages);

      // Save messages to local storage for persistent page loads
      localStorage.setItem('messages', JSON.stringify(finalMessages));
    } catch (error) {
      console.error('Error retrieving response:', error);
    }
  };

  const handleNewConversation = () => {
    localStorage.removeItem('messages');
    setMessages([]);
    console.log('Cleared messages in local storage.');
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const getTimestamp = () => {
    console.log('Retrieving timestamp:', Date().toLocaleString());
    return new Date().toLocaleString();
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-gray-100">
      <div className="p-6 absolute top-0 left-0">
        <h1 className="text-2xl text-gray-400 font-bold">JiyoonGPT</h1>
      </div>
      <button
        id="sign-out"
        onClick={handleSignOut}
        className="absolute top-0 right-0 px-4 py-2 mt-4 mr-4 text-xl text-gray-400 font-semibold hover:text-gray-800"
      >
        Sign Out
      </button>
      <div className="flex flex-col flex-grow w-full max-w-lg my-20 p-6 bg-white border border-gray-300 rounded-lg shadow-md">
        <div className="flex-grow overflow-y-auto mb-4 h-80 overflow-x-hidden">
          <div className="space-y-2">
            {messages.map((message, index) => (
              <div key={index} className={`p-2 border text-black-600 ${message.role === 'assistant' ? 'bg-gray-100' : ''} overflow-x-hidden`}>
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
