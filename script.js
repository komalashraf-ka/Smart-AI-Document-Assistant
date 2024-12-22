    const chatContainer = document.getElementById("chat-container");
    const chatWindow = document.getElementById("chat-messages");
    const fileInput = document.getElementById("file-upload");
    const messageInput = document.getElementById("message-input");
    const sendButton = document.getElementById("send-button");
    const form = document.getElementById("questionForm");

    chatContainer.addEventListener("dragover", (e) => {
        e.preventDefault();
        chatContainer.classList.add("dragover");
    });


    chatContainer.addEventListener("dragleave", () => {
        chatContainer.classList.remove("dragover");
    });


    chatContainer.addEventListener("drop", (e) => {
        e.preventDefault();
        chatContainer.classList.remove("dragover");


        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            appendMessage("You", `Uploaded file: ${files[0].name}`, "user");
        }
    });


    function toggleInput(disabled) {
        messageInput.disabled = disabled;
        sendButton.disabled = disabled;
        fileInput.disabled = disabled;
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData();
        const file = fileInput.files[0];
        const question = messageInput.value.trim();
        if (!question && !file) {
            alert("Please enter a message or upload a file.");
            return;
        }

        if (question) formData.append("question", question);
        if (file) formData.append("file", file);

        appendMessage("You", question || `Uploaded file: ${file.name}`, "user");
        const aiMessage = appendMessage("AI", "Processing...", "ai");
        const aiText = aiMessage.querySelector(".text");

        toggleInput(true);
        try {
            const response = await fetch('/ask', { method: 'POST', body: formData });
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            aiText.textContent = "";


            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value, { stream: true });
                aiText.textContent += chunk;
            }
        } catch (error) {
            aiText.textContent = "Something went wrong. Please try again.";
        }
        toggleInput(false);
        form.reset();
    });

    function appendMessage(username, text, type) {
        const message = document.createElement("div");
        message.classList.add("message", type);
        message.innerHTML = `<strong>${username}:</strong> <span class="text">${text}</span>`;
        chatWindow.appendChild(message);
        chatWindow.scrollTop = chatWindow.scrollHeight;
        return message;
    }


