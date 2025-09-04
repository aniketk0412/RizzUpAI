# **App Name**: RizzUp AI

## Core Features:

- Collapsible Sidebar: A sidebar with a hamburger menu icon for managing chat sessions and settings.
- Dynamic Chat Interface: UI with messages displayed with the proper styles; user-sent on the right and AI-generated on the left, and a header with 'Relation' and 'Tone' options.
- Advanced Chat Input: Modern chat input area featuring automatic resizing, image attachments, speech-to-text, and a send button.
- Contextual AI Chat: Use a Genkit flow to create a creative AI chat assistant that utilizes selected Tone and Relation options to maintain session memory and generate responses based on chat history and optional image attachments; this flow incorporates a tool to decide if and when to use attachments and history.
- Credit System: Implement a credit system with a free initial credit balance, a 24-hour reset for credits, a display of current balance, and in-app purchase options.
- Chat History Management: Enable saving, loading, renaming, and deleting chat sessions, settings, credit balance, and reset timers using localStorage.
- Notifications: Show a toast notification and open a credit dialog when the user runs out of credits.

## Style Guidelines:

- Background color: Desaturated teal (#E0F2F7) to maintain focus on content. 
- Primary color: Vibrant turquoise (#00B5D8) for chat bubbles and highlights, to reflect a friendly tone.
- Accent color: Soft green (#A0D995) for secondary elements and accents. The color green emphasizes positive user action (credits added, timer reset, successful prompts, etc).
- Headline font: 'Poppins' (sans-serif) for headlines to give a precise and contemporary feel. Note: currently only Google Fonts are supported.
- Body font: 'Inter' (sans-serif) for body text to ensure readability and a modern look. Note: currently only Google Fonts are supported.
- Modern, minimalist icons for actions like sending messages, attaching images, and voice recording.
- Clean and structured layout with a collapsible sidebar for easy navigation and chat management.
- Subtle animations for transitions and user interactions to enhance the user experience.