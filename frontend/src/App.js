import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [chatStarted, setChatStarted] = useState(false);
  const [reportText, setReportText] = useState("");
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [botTyping, setBotTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const chatRef = useRef(null);

  const faqQuestions = [
    "What does the report say?",
    "How severe is the condition?",
    "Are there any treatments for the condition?",
    "Should he/she consult a specialist?",
  ];

  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://localhost:5000/upload", formData);
      setReportText(response.data.report_text);
      setMessages([
        { sender: "bot", text: "📃 Medical report uploaded! Start chatting now." },
        { sender: "bot", text: `📝 Summary: ${response.data.summary}` },
        { sender: "bot", text: `⚠️ Severity: ${response.data.severity}` },
      ]);
      setChatStarted(true);
    } catch (error) {
      console.error("Error uploading file:", error);
    }

    setUploading(false);
  };

  const handleSend = async () => {
    if (!userInput.trim()) return;

    const newMessages = [...messages, { sender: "user", text: userInput }];
    setMessages(newMessages);
    setUserInput("");
    setBotTyping(true);

    try {
      const response = await axios.post("http://localhost:5000/chat", {
        report_text: reportText,
        query: userInput,
      });
      setMessages([...newMessages, { sender: "bot", text: response.data.response }]);
    } catch (error) {
      console.error("Error sending message:", error);
    }

    setBotTyping(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSend();
    }
  };

  const handleFaqClick = (question) => {
    setUserInput(question); 
  };

  return (
    <div className="chat-container">
      <div className="chat-header">💬 Medical Chatbot</div>

      <div className="chat-box" ref={chatRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
        {botTyping && <div className="typing"><span></span><span></span><span></span></div>}
      </div>

      {!chatStarted ? (
        <div className="bottom-section">
          <div className="upload-section">
            <p>📁 Upload a medical report to start chatting</p>
            <input type="file" onChange={handleFileChange} />
            <button className={uploading ? "uploading" : ""} onClick={handleUpload} disabled={uploading}>
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="faq-section">
            <p>Common Questions:</p>
            {faqQuestions.map((question, index) => (
              <button key={index} onClick={() => handleFaqClick(question)}>{question}</button>
            ))}
          </div>

          <div className="input-box">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your report..."
            />
            <button onClick={handleSend}>Send</button>
          </div>
        </>
      )}

      <p className="footer">Developed by Maruvar Kulali Nayaki J</p>
    </div>
  );
}

export default App;
