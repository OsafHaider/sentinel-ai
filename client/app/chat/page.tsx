"use client";
import { ChatInput } from "@/components/chat/chat-input";
import { FilePreview } from "@/components/chat/file-preview";
import { MessageList } from "@/components/chat/message-list";
import { Notification } from "@/components/chat/notification";
import { Header } from "@/components/header";
import React, { useState, useEffect } from "react";

interface Message {
  role: string;
  content: string;
}

interface UploadedFile {
  name: string;
  type: string;
  size: number;
  file: File;
}

export default function SentinelChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isIngesting, setIsIngesting] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    show: boolean;
  }>({
    message: "",
    show: false,
  });

  // Notification Listener (Backend Stream Sync)
  useEffect(() => {
    const es = new EventSource(
      `http://localhost:8008/api/v1/chat/stats/stream`,
      {
        withCredentials: true,
      },
    );

    es.addEventListener("notification", (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        setNotification({ message: data.message, show: true });
        setIsIngesting(false);

        setTimeout(() => setNotification({ message: "", show: false }), 5000);
      } catch (err) {
        console.error("❌ Notification Parse Error:", err);
      }
    });

    return () => es.close();
  }, []);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setUploadedFile({
      name: file.name,
      type: file.type,
      size: file.size,
      file,
    });
  };

  const removeFile = () => setUploadedFile(null);

  const ingestFile = async () => {
    if (!uploadedFile) return;
    setIsIngesting(true);
    const formData = new FormData();
    formData.append("file", uploadedFile.file);

    try {
      await fetch(`http://localhost:8008/api/v1/chat/ingest`, {
        method: "POST",
        body: formData,
      });
      setUploadedFile(null);
    } catch (error) {
      console.error("❌ Ingest Error:", error);
      setIsIngesting(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuery = input;
    setInput("");
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: userQuery }]);

    try {
      const response = await fetch(`http://localhost:8008/api/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userQuery }),
      });

      const data = await response.json();

      if (data.status === "completed") {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
        setIsLoading(false);
      } else if (data.status === "queued") {
        const es = new EventSource(
          `http://localhost:8008/api/v1/chat/stream/${data.jobId}`,
        );
        es.onmessage = (event) => {
          const result = JSON.parse(event.data);
          if (result.status === "completed") {
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: result.response },
            ]);
            setIsLoading(false);
            es.close();
          }
        };
        es.onerror = () => {
          es.close();
          setIsLoading(false);
        };
      }
    } catch (error) {
      console.error("🔥 Chat Error:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30 overflow-hidden">
      <Notification
        message={notification.message}
        show={notification.show}
        onClose={() => setNotification({ ...notification, show: false })}
      />

      <Header />

      <MessageList messages={messages} isLoading={isLoading} />

      <div className="border-t border-slate-800/50 bg-slate-950 space-y-4 pb-2">
        <FilePreview
          file={uploadedFile}
          isIngesting={isIngesting}
          onRemove={removeFile}
          onIngest={ingestFile}
        />

        <ChatInput
          input={input}
          isLoading={isLoading}
          onInputChange={setInput}
          onSubmit={sendMessage}
          onFileSelect={handleFileSelect}
        />
      </div>
    </div>
  );
}
