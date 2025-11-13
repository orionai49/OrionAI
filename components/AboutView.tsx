
import React from 'react';

const AboutView: React.FC = () => {
  return (
    <div className="h-full flex flex-col bg-gray-800 rounded-lg overflow-hidden p-8 text-gray-300">
      <div className="space-y-6 overflow-y-auto pr-4 flex-1">
        <h2 className="text-3xl font-bold text-white text-center mb-2">🌌 About OrionAI</h2>
        <p className="text-lg text-center text-cyan-300 italic">Where Intelligence Meets the Cosmos</p>

        <p>
          At OrionAI, we believe the future belongs to those who think beyond boundaries. Inspired by the Orion constellation, our mission is to illuminate the digital universe with powerful, human-like artificial intelligence that learns, reasons, and creates.
        </p>

        <h3 className="text-2xl font-semibold text-white pt-4">🚀 Our Vision</h3>
        <p>
          To make advanced AI accessible, intuitive, and inspiring — empowering creators, businesses, and dreamers to achieve more through intelligent interaction.
        </p>

        <h3 className="text-2xl font-semibold text-white pt-4">💡 What We Do</h3>
        <p>
          OrionAI is a next-gen conversational AI assistant designed to think, learn, and communicate naturally. It helps users with:
        </p>
        <ul className="list-none space-y-3 pl-2">
          <li>✨ Smart conversations & content creation</li>
          <li>⚙️ Coding, analysis, and automation</li>
          <li>🎨 AI-powered design & creativity tools</li>
          <li>📚 Learning support, research, and explanations</li>
          <li>🧠 Personalized productivity assistance</li>
        </ul>

        <h3 className="text-2xl font-semibold text-white pt-4">🌠 Our Philosophy</h3>
        <p>
          We see AI not as a replacement, but as a companion for human imagination. OrionAI is built on the principles of clarity, creativity, and consciousness — merging logic with emotion to help users explore limitless possibilities.
        </p>

        <h3 className="text-2xl font-semibold text-white pt-4">🔭 Why the Name “Orion”?</h3>
        <p>
          Just like the Orion constellation guides travelers through the night sky, OrionAI guides users through the digital cosmos — helping them navigate ideas, solve problems, and create something extraordinary.
        </p>
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-700 text-center text-gray-500">
          <p>Created by Angad Shah</p>
      </div>
    </div>
  );
};

export default AboutView;