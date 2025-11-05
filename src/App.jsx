import { useState, useRef, useEffect } from "react";
import codcozLogo from "./assets/codcoz_logo.svg";

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => {
    // gera um ID aleatório para a sessão
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  });
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text = null) => {
    const messageToSend = text || message.trim();
    if (!messageToSend) return;

    const userMessage = { role: "user", content: messageToSend };
    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://codcoz-chatbot-faq.onrender.com/chat/${sessionId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: messageToSend }),
        }
      );

      const data = await response.json();

      // resposta do bot
      const botMessage = {
        role: "assistant",
        content:
          data.message ||
          data.response ||
          "Desculpe, não consegui processar sua mensagem.",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      const errorMessage = {
        role: "assistant",
        content:
          "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSendMessage();
  };

  const suggestedQuestions = [
    "Gostaria de saber mais sobre o CodCoz",
    "Como funciona o CodCoz?",
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  // Função para processar markdown básico e renderizar formatação
  const renderFormattedMessage = (text) => {
    if (!text) return "";

    let formatted = text;

    formatted = formatted.replace(
      /`([^`]+)`/g,
      '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>'
    );

    formatted = formatted
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/__(.*?)__/g, '<strong class="font-semibold">$1</strong>');

    formatted = formatted
      .replace(/([^*])\*([^*]+?)\*([^*])/g, '$1<em class="italic">$2</em>$3')
      .replace(/([^_])_([^_]+?)_([^_])/g, '$1<em class="italic">$2</em>$3');

    formatted = formatted.replace(/\n/g, "<br />");

    const lines = formatted.split("<br />");
    const processedLines = [];
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const listMatch = line.match(/^[-*]\s+(.+)$/);

      if (listMatch) {
        if (!inList) {
          processedLines.push(
            '<ul class="list-disc list-inside space-y-1 my-2 ml-2">'
          );
          inList = true;
        }
        processedLines.push(`<li>${listMatch[1]}</li>`);
      } else {
        if (inList) {
          processedLines.push("</ul>");
          inList = false;
        }
        if (line) {
          processedLines.push(line);
        } else {
          processedLines.push("<br />");
        }
      }
    }

    if (inList) {
      processedLines.push("</ul>");
    }

    formatted = processedLines.join("");

    return formatted;
  };

  return (
    <div className="min-h-screen bg-[#0F1829] flex flex-col">
      <div className="absolute top-6 left-6">
        <img src={codcozLogo} alt="CodCoz" className="h-8 w-auto" />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="w-full max-w-3xl flex flex-col">
          {/* Greeting - apenas quando não há mensagens */}
          {messages.length === 0 && (
            <div className="text-center mb-12">
              <h1 className="text-white text-xl mb-2 font-normal">
                {getGreeting()}!
              </h1>
              <h2 className="text-[#FFCC00] text-3xl font-semibold">
                Você já conhece o CodCoz?
              </h2>
            </div>
          )}

          {/* Área de mensagens */}
          <div className="flex-1 mb-6 overflow-y-auto max-h-[calc(100vh-280px)] custom-scrollbar pr-1">
            {messages.length > 0 && (
              <div className="space-y-4 pr-3">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 ${
                      msg.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {msg.role === "assistant" && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white p-1.5 border border-gray-200">
                        <img
                          src={codcozLogo}
                          alt="CodCoz"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-5 py-4 border ${
                        msg.role === "user"
                          ? "bg-[#FFCC00] text-[#0F1829] border-[#FFCC00]/30"
                          : "bg-white text-[#0F1829] border-gray-200"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <div
                          className="text-base leading-relaxed prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{
                            __html: renderFormattedMessage(msg.content),
                          }}
                          style={{
                            lineHeight: "1.6",
                          }}
                        />
                      ) : (
                        <p className="text-base leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      )}
                    </div>
                    {msg.role === "user" && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#FFCC00] flex items-center justify-center border border-[#FFCC00]/30">
                        <svg
                          className="w-5 h-5 text-[#0F1829]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start gap-3 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white p-1.5 border border-gray-200">
                      <img
                        src={codcozLogo}
                        alt="CodCoz"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="bg-white rounded-2xl px-4 py-3 border border-gray-200">
                      <div className="flex space-x-1.5">
                        <div
                          className="w-2 h-2 bg-[#0F1829] rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-[#0F1829] rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-[#0F1829] rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="mt-auto">
            <form onSubmit={handleSubmit}>
              <div className="relative bg-white rounded-full shadow-lg flex items-center px-5 py-3.5">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua pergunta..."
                  className="flex-1 bg-transparent text-[#0F1829] placeholder-gray-400 outline-none text-sm pr-3"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !message.trim()}
                  className="bg-[#FFCC00] text-[#0F1829] p-2 rounded-full hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
            </form>

            {/* Perguntas sugeridas - apenas quando não há mensagens */}
            {messages.length === 0 && (
              <div className="mt-6">
                <p className="text-gray-400 text-xs mb-3 text-center">
                  Perguntas sugeridas:
                </p>
                <div className="space-y-2">
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(question)}
                      className="w-full text-left text-gray-300 hover:text-[#FFCC00] transition-colors py-2.5 px-4 rounded-lg hover:bg-white/5 flex items-center space-x-3 group text-sm"
                      disabled={isLoading}
                    >
                      <svg
                        className="w-4 h-4 text-gray-500 group-hover:text-[#FFCC00] transition-colors flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                        />
                      </svg>
                      <span className="flex-1">{question}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
