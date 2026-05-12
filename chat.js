function appendMessage(text, type, sender = "You") {
    const feed = document.getElementById('message-container');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const div = document.createElement('div');
    div.className = `msg ${type}`;
    
    // Structure: Only show name if it's a received group message
    const senderHtml = type === 'received' ? `<strong>${sender}</strong><br>` : '';
    
    div.innerHTML = `
        ${senderHtml}
        ${text}
        <span class="msg-time">${time}</span>
    `;
    
    feed.appendChild(div);
    
    // Smooth Scroll to bottom
    feed.scrollTo({
        top: feed.scrollHeight,
        behavior: 'smooth'
    });
}

// Attach to Send Button
document.getElementById('send-btn').addEventListener('click', () => {
    const input = document.getElementById('msg-input');
    if (input.value.trim() !== "") {
        appendMessage(input.value, 'sent');
        input.value = "";
    }
});
