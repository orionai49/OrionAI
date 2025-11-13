
import React, { useState } from 'react';

const ContactView: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formKey, setFormKey] = useState(Date.now()); // Used to reset form state

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    // Reset form after a delay
    setTimeout(() => {
        setSubmitted(false);
        setFormKey(Date.now());
    }, 3000);
  };

  return (
    <div className="h-full flex flex-col bg-gray-800 rounded-lg overflow-hidden p-8 text-gray-300">
      <h2 className="text-3xl font-bold text-white mb-6">Contact Us</h2>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <p>
            We'd love to hear from you! Whether you have a question about features, trials, pricing, or anything else, our team is ready to answer all your questions.
          </p>
          <p>
            Please note that this is a demonstration application, and the contact information below is for illustrative purposes only.
          </p>
          <div className="space-y-2 pt-4">
            <p><strong>Email:</strong> orionai49@gmail.com</p>
            <p><strong>Address:</strong> Ahmedabad, Gujarat, India</p>
          </div>
        </div>

        <form key={formKey} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-400">Your Name</label>
            <input type="text" id="name" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-400">Email Address</label>
            <input type="email" id="email" className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500" />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-400">Message</label>
            <textarea id="message" rows={4} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500"></textarea>
          </div>
          <div>
            <button type="submit" className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg transition-colors" disabled={submitted}>
              {submitted ? 'Message Sent!' : 'Send Message'}
            </button>
            {submitted && <p className="text-sm text-green-400 text-center mt-2">Thank you for your feedback!</p>}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContactView;
