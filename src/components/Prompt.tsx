import React, { useState } from 'react';

export default function PromptInterface() {
  const [inputValue, setInputValue] = useState('');
  const [response, setResponse] = useState<string | null>(null);

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

    try {
      const res = await fetch('http://localhost:3001/prompt', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: inputValue }]
        })
      });

      if (!res.ok) {
        throw new Error('Failed to fetch response');
      }

      const data = await res.json();
      setResponse(data.choices[0]?.message?.content || 'No response');
    } catch (error) {
      console.error('Error:', error);
      setResponse('Failed to fetch response');
    }
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-gray-100">
      <div className="flex flex-col flex-grow w-full max-w-md my-20 p-6 bg-white border border-gray-300 rounded-lg shadow-md">
        <div className="flex-grow overflow-auto">
          <p>{response}</p>
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
            type="submit"
            className="px-4 py-2 mt-4 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
