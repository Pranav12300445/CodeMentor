import {
    useEffect,
    useRef,
    useState
} from "react";

import {
    Send,
    Bot,
    User,
    ChevronDown,
    ChevronRight,
    FileCode,
    Loader2,
    Copy,
    Check
} from "lucide-react";

import type {
    ChatMessage,
    Repository
} from "../types";

import { sendChatMessage } from "../services/api";


interface Props {
    repository: Repository;
}


export default function ChatPanel({
    repository
}: Props) {

    const [messages, setMessages] =
        useState<ChatMessage[]>([]);

    const [input, setInput] =
        useState("");

    const [sending, setSending] =
        useState(false);

    const [expandedSources, setExpandedSources] =
        useState<Set<string>>(new Set());

    const [copiedId, setCopiedId] =
        useState<string | null>(null);

    const messagesEndRef =
        useRef<HTMLDivElement>(null);

    const inputRef =
        useRef<HTMLTextAreaElement>(null);


    useEffect(() => {

        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });

    }, [messages]);


    useEffect(() => {
        setMessages([]);
        setInput("");
        setExpandedSources(new Set());
    }, [repository.id]);


    const toggleSource = (messageId: string) => {

        setExpandedSources((prev) => {

            const next = new Set(prev);

            if (next.has(messageId)) {
                next.delete(messageId);
            } else {
                next.add(messageId);
            }

            return next;
        });
    };


    const handleCopy = async (
        text: string,
        id: string
    ) => {

        try {

            await navigator.clipboard.writeText(text);

            setCopiedId(id);

            setTimeout(() => {
                setCopiedId(null);
            }, 2000);

        } catch {
            console.error("Failed to copy");
        }
    };


    const handleSend = async () => {

        const trimmed = input.trim();

        if (!trimmed || sending) {
            return;
        }

        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: trimmed,
            timestamp: new Date(),
        };

        setMessages((prev) => [
            ...prev,
            userMessage
        ]);

        setInput("");
        setSending(true);

        try {

            const response =
                await sendChatMessage(
                    repository.id,
                    trimmed
                );

            const assistantMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: "assistant",
                content: response.answer,
                sources: response.sources,
                sourceCount: response.source_count,
                timestamp: new Date(),
            };

            setMessages((prev) => [
                ...prev,
                assistantMessage
            ]);

        } catch (error) {

            console.error(
                "Chat failed:",
                error
            );

            const errorMessage: ChatMessage = {
                id: crypto.randomUUID(),
                role: "assistant",
                content:
                    "Sorry, something went wrong. Please check that the backend is running and try again.",
                timestamp: new Date(),
            };

            setMessages((prev) => [
                ...prev,
                errorMessage
            ]);

        } finally {

            setSending(false);

            inputRef.current?.focus();
        }
    };


    const handleKeyDown = (
        event: React.KeyboardEvent
    ) => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {
            event.preventDefault();
            handleSend();
        }
    };


    const renderContent = (text: string) => {

        const parts = text.split(
            /(```[\s\S]*?```)/g
        );

        return parts.map((part, index) => {

            if (part.startsWith("```")) {

                const match = part.match(
                    /```(\w*)\n?([\s\S]*?)```/
                );

                if (match) {

                    const language =
                        match[1] || "text";

                    const code = match[2].trim();

                    const blockId =
                        `code-block-${index}`;

                    return (
                        <div
                            key={index}
                            className="chat-code-block"
                        >
                            <div className="code-block-header">
                                <span>{language}</span>

                                <button
                                    className="copy-code-button"
                                    onClick={() =>
                                        handleCopy(
                                            code,
                                            blockId
                                        )
                                    }
                                    title="Copy code"
                                >
                                    {copiedId === blockId ? (
                                        <>
                                            <Check size={12} />
                                            Copied
                                        </>
                                    ) : (
                                        <>
                                            <Copy size={12} />
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>

                            <pre>
                                <code>{code}</code>
                            </pre>
                        </div>
                    );
                }
            }

            return (
                <span key={index}>
                    {part.split("\n").map(
                        (line, lineIndex) => (
                            <span key={lineIndex}>
                                {lineIndex > 0 && <br />}
                                {line}
                            </span>
                        )
                    )}
                </span>
            );
        });
    };


    return (
        <div className="chat-panel">

            <div className="chat-messages">

                {messages.length === 0 && (
                    <div className="chat-empty">

                        <Bot size={40} />

                        <h3>
                            Ask about {repository.name}
                        </h3>

                        <p>
                            Ask questions about the codebase
                            and I'll find relevant code to
                            help answer.
                        </p>

                        <div className="chat-suggestions">

                            <button
                                className="suggestion-chip"
                                onClick={() =>
                                    setInput(
                                        "What does this codebase do?"
                                    )
                                }
                            >
                                What does this codebase do?
                            </button>

                            <button
                                className="suggestion-chip"
                                onClick={() =>
                                    setInput(
                                        "What are the main entry points?"
                                    )
                                }
                            >
                                What are the main entry points?
                            </button>

                            <button
                                className="suggestion-chip"
                                onClick={() =>
                                    setInput(
                                        "Explain the architecture"
                                    )
                                }
                            >
                                Explain the architecture
                            </button>

                        </div>

                    </div>
                )}


                {messages.map((message) => (

                    <div
                        key={message.id}
                        className={`chat-message ${message.role}`}
                    >

                        <div className="message-avatar">
                            {message.role === "user"
                                ? <User size={18} />
                                : <Bot size={18} />
                            }
                        </div>

                        <div className="message-body">

                            <div className="message-content">
                                {renderContent(
                                    message.content
                                )}
                            </div>

                            {message.sources &&
                                message.sources.length > 0 && (

                                <div className="message-sources">

                                    <button
                                        className="sources-toggle"
                                        onClick={() =>
                                            toggleSource(
                                                message.id
                                            )
                                        }
                                    >
                                        {expandedSources.has(
                                            message.id
                                        ) ? (
                                            <ChevronDown
                                                size={14}
                                            />
                                        ) : (
                                            <ChevronRight
                                                size={14}
                                            />
                                        )}

                                        {message.sourceCount}{" "}
                                        source
                                        {message.sourceCount !== 1
                                            ? "s"
                                            : ""}
                                    </button>

                                    {expandedSources.has(
                                        message.id
                                    ) && (

                                        <div className="sources-list">

                                            {message.sources.map(
                                                (
                                                    source,
                                                    index
                                                ) => (

                                                    <div
                                                        key={index}
                                                        className="source-item"
                                                    >
                                                        <div className="source-header">

                                                            <FileCode
                                                                size={13}
                                                            />

                                                            <span className="source-path">
                                                                {source.file_path}
                                                            </span>

                                                            {source.name && (
                                                                <span className="source-tag name">
                                                                    {source.name}
                                                                </span>
                                                            )}

                                                            <span className="source-tag">
                                                                {source.node_type}
                                                            </span>

                                                            {source.language && (
                                                                <span className="source-tag language">
                                                                    {source.language}
                                                                </span>
                                                            )}

                                                            {source.start_line != null && (
                                                                <span className="source-lines">
                                                                    L{source.start_line}
                                                                    {source.end_line != null &&
                                                                        source.end_line !== source.start_line &&
                                                                        `–${source.end_line}`
                                                                    }
                                                                </span>
                                                            )}

                                                        </div>

                                                        <pre className="source-code">
                                                            <code>
                                                                {source.code}
                                                            </code>
                                                        </pre>
                                                    </div>
                                                )
                                            )}

                                        </div>

                                    )}

                                </div>

                            )}

                        </div>

                    </div>

                ))}


                {sending && (

                    <div className="chat-message assistant">

                        <div className="message-avatar">
                            <Bot size={18} />
                        </div>

                        <div className="message-body">
                            <div className="typing-indicator">
                                <Loader2
                                    size={16}
                                    className="spinning"
                                />
                                CodeMentor is analyzing the codebase...
                            </div>
                        </div>

                    </div>
                )}


                <div ref={messagesEndRef} />

            </div>


            <div className="chat-input-area">

                <div className="chat-input-wrapper">

                    <textarea
                        ref={inputRef}
                        className="chat-input"
                        value={input}
                        onChange={(event) =>
                            setInput(event.target.value)
                        }
                        onKeyDown={handleKeyDown}
                        placeholder={`Ask about ${repository.name}...`}
                        rows={1}
                        disabled={sending}
                    />

                    <button
                        className="send-button"
                        onClick={handleSend}
                        disabled={
                            !input.trim() ||
                            sending
                        }
                    >
                        <Send size={18} />
                    </button>

                </div>

                <span className="chat-hint">
                    Press Enter to send, Shift+Enter for new line
                </span>

            </div>

        </div>
    );
}
