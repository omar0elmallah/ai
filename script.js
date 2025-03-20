const chatBody = document.querySelector('.chat-body');
const messageInput = document.querySelector('.message-input');
const sendMessageButton = document.querySelector('#send-message');
const fileInput = document.querySelector('#file-input');
const fileUploadWrapper = document.querySelector('.file-upload-wrapper');
const fileCancelButton = document.querySelector('#file-cancel');
const chatbotToggler = document.querySelector('#chatbot-toggler');
const closeChatbot = document.querySelector('#close-chatbot');

// API URL and API key
const API_KEY = 'AIzaSyCRUPETBzGbGPLOQny3u7LpfRfMRfikRgE';
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

const userData = {
    message: null,
    file: {
        data: null,
        mime_type: null,
    }    
};

const chatHistory = [];
const initialInputHeight = messageInput.scrollHeight;

// Create message element with dynamic classes and return it 
const createMessageElement = (content, ...classes) => {
    const div = document.createElement('div');
    div.classList.add('message', ...classes);
    div.innerHTML = content;
    return div;
};

// Generate bot response with enhanced Markdown support
const generateBotResponse = async (incomingMessageDiv) => {
    const messageElement = incomingMessageDiv.querySelector('.message-text');

    // Save user message to chat history
    chatHistory.push({
        role: 'user',
        parts: [{ text: userData.message }, ...(userData.file.data ? [{ inline_data: userData.file }] : [])]
    });

    // API request options
    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: chatHistory  
        }),
    };

    try {
        // Fetch data from API
        const response = await fetch(API_URL, requestOptions);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error.message);

        // Enhanced Markdown formatting
        const apiResponseText = data.candidates[0].content.parts[0].text
            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Bold
            .replace(/\*(.*?)\*/g, "<em>$1</em>") // Italic
            .replace(/__(.*?)__/g, "<strong>$1</strong>") // Bold (alternative)
            .replace(/_(.*?)_/g, "<em>$1</em>") // Italic (alternative)
            .replace(/~~(.*?)~~/g, "<del>$1</del>") // Strikethrough
            .replace(/```([\s\S]*?)```/g, `<pre><code>$1</code></pre>`) // Code block
            .replace(/`([^`]+)`/g, "<code>$1</code>") // Inline code
            .replace(/^> (.*$)/gm, "<blockquote>$1</blockquote>") // Blockquote
            .replace(/\[(.*?)\]\((.*?)\)/g, "<a href='$2' target='_blank'>$1</a>") // Links
            .replace(/!\[(.*?)\]\((.*?)\)/g, "<img src='$2' alt='$1' style='max-width: 100%;'>") // Images
            .replace(/^### (.*$)/gm, "<h3>$1</h3>") // Heading 3
            .replace(/^## (.*$)/gm, "<h2>$1</h2>") // Heading 2
            .replace(/^# (.*$)/gm, "<h1>$1</h1>") // Heading 1
            .replace(/^\* (.*$)/gm, "<ul><li>$1</li></ul>") // Unordered list
            .replace(/^\d+\. (.*$)/gm, "<ol><li>$1</li></ol>") // Ordered list
            .replace(/\n/g, "<br>") // Line breaks
            .trim();

        // Fix consecutive lists (combine ul/ol tags)
        const fixedResponse = apiResponseText
            .replace(/<\/ul>\s*<ul>/g, "")
            .replace(/<\/ol>\s*<ol>/g, "");

        messageElement.innerHTML = fixedResponse;

        // Save bot response to chat history
        chatHistory.push({
            role: 'model',
            parts: [{ text: apiResponseText }]
        });
    } catch (error) {
        console.error(error);
        messageElement.innerText = error.message;
        messageElement.style.color = 'red';
    } finally {
        userData.file = {};
        incomingMessageDiv.classList.remove('thinking');
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
    }
};

// Handle outgoing user message
const handleOutgoingMessage = (e) => {
    e.preventDefault();
    userData.message = messageInput.value.trim();
    messageInput.value = '';
    fileUploadWrapper.classList.remove('file-uploaded');
    messageInput.dispatchEvent(new Event('input'));

    // Create and display user message
    const messageContent = `<div class="message-text">${userData.message}</div> ${userData.file.data ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" alt="file" class="attachment">` : ''}`;

    const outgoingMessageDiv = createMessageElement(messageContent, 'user-message');
    chatBody.appendChild(outgoingMessageDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
    
    // Bot response thinking indicator in 600ms
    setTimeout(() => {
        const messageContent = `<svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
                    <path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z"></path>
                </svg>
                <div class="message-text">
                    <div class="thinking-indicator">
                        <div class="dot"></div>
                        <div class="dot"></div>
                        <div class="dot"></div>   
                    </div>     
                </div>`;

        const incomingMessageDiv = createMessageElement(messageContent, 'bot-message', 'thinking');
        chatBody.appendChild(incomingMessageDiv);
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: 'smooth' });
        generateBotResponse(incomingMessageDiv);
    }, 600);
};

// Handle Enter key press to send message
messageInput.addEventListener('keydown', (e) => {
    const userMessage = e.target.value.trim();
    if (e.key === 'Enter' && userMessage && !e.shiftKey && window.innerWidth > 768) {
        handleOutgoingMessage(e);
    }
});

// Auto resize message input field height
messageInput.addEventListener('input', () => {
    messageInput.style.height = `${initialInputHeight}px`;
    messageInput.style.height = `${messageInput.scrollHeight}px`;
    document.querySelector('.chat-form').style.borderRadius = messageInput.scrollHeight > initialInputHeight ? '15px' : '32px';  
});

// Handle file upload for input change and show selected file
fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const fileUploadWrapper = document.querySelector('.file-upload-wrapper');
        if (!fileUploadWrapper) {
            console.error('fileUploadWrapper element not found');
            return;
        }

        fileUploadWrapper.querySelector('img').src = e.target.result;
        fileUploadWrapper.classList.add('file-uploaded');
        const base64String = e.target.result.split(',')[1];

        // Save file data to userData
        userData.file = {
            data: base64String,
            mime_type: file.type,
        };
       
        fileInput.value = '';
    };
 
    reader.readAsDataURL(file);
});

// Handle file upload cancel
fileCancelButton.addEventListener('click', () => {
    userData.file = {};
    fileUploadWrapper.classList.remove('file-uploaded');
});

// Initialize emoji picker and emoji selector
const picker = new EmojiMart.Picker({
    theme: 'light',
    skinTonePosition: 'none',
    previewPosition: 'none',
    onEmojiSelect: (emoji) => {
        const { selectionStart: start, selectionEnd: end } = messageInput;
        messageInput.setRangeText(emoji.native, start, end, 'end');
        messageInput.focus();
    },
    onClickOutside: (e) => {
        if (e.target.id === 'emoji-picker') {
            document.body.classList.toggle('show-emoji-picker');
        } else {
            document.body.classList.remove('show-emoji-picker');
        }
    }
});

document.querySelector('.chat-form').appendChild(picker);

sendMessageButton.addEventListener('click', (e) => handleOutgoingMessage(e)); 
document.querySelector('#file-upload').addEventListener('click', () => fileInput.click());
chatbotToggler.addEventListener('click', () => document.body.classList.toggle('show-chatbot'));
closeChatbot.addEventListener('click', () => document.body.classList.remove('show-chatbot'));