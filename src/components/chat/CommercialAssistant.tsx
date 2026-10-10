import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  X,
  Send,
  Headphones,
  RotateCcw,
  ArrowRight,
  BookOpen,
  Crown,
  MessageCircle,
  ExternalLink,
  Minimize2,
} from 'lucide-react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedProducts?: Array<{
    id: string;
    title: string;
    author: string;
    slug: string;
    cover?: string;
    category?: string;
    normal_price?: number;
    sale_price?: number | null;
  }>;
}

const STARTER_SUGGESTIONS = [
  '📚 Quel livre pour démarrer un business rentable ?',
  '👑 Présentez-moi le Pack VIP et ses avantages',
  '💰 Quels sont vos livres sur la liberté financière ?',
  '🎁 Avez-vous une ressource gratuite à découvrir ?',
  '💬 Comment se déroule la commande sur WhatsApp ?',
];

export const CommercialAssistant: React.FC = () => {
  const { navigateTo, settings, currentPath } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const initialGreeting: ChatMessage = {
    id: 'welcome-msg',
    role: 'assistant',
    content:
      "Bonjour et bienvenue chez **VISION BOOKS** ! 🎧\n\nJe suis votre conseiller commercial dédié. Je suis à votre disposition pour vous recommander le livre audio le plus adapté à vos ambitions (Business, Investissement, Mindset, Vente), vous présenter notre **Pack VIP**, ou répondre à toutes vos questions.\n\nQuel projet ou défi souhaitez-vous accélérer aujourd'hui ?",
    timestamp: 'À l\'instant',
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialGreeting]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (userText?: string) => {
    const textToSend = (userText || inputMessage).trim();
    if (!textToSend || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInputMessage('');
    setLoading(true);

    try {
      // Build history for API
      const apiPayload = nextMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await api.chatWithAssistant(apiPayload);

      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        suggestedProducts: response.suggestedProducts,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const fallbackErrorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content:
          "Je vous prie de m'excuser, notre service de conseil IA est momentanément ralenti. Vous pouvez échanger directement avec notre équipe humaine sur WhatsApp au " +
          (settings.whatsapp_number || '+33 6 12 34 56 78') +
          " pour recevoir des conseils personnalisés ou un extrait offert !",
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackErrorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([initialGreeting]);
    setInputMessage('');
  };

  const whatsappNumber = settings.whatsapp_number || '+33 6 12 34 56 78';
  const cleanPhone = whatsappNumber.replace(/[^0-9+]/g, '');

  const openWhatsAppGeneral = () => {
    const text = encodeURIComponent("Bonjour VISION BOOKS, je souhaite avoir des conseils sur vos livres audio.");
    window.open(`https://wa.me/${cleanPhone.replace('+', '')}?text=${text}`, '_blank');
  };

  const openWhatsAppProduct = (title: string) => {
    const text = encodeURIComponent(`Bonjour VISION BOOKS, je souhaite commander le livre audio « ${title} ».`);
    window.open(`https://wa.me/${cleanPhone.replace('+', '')}?text=${text}`, '_blank');
  };

  // Helper to parse simple markdown formatting in assistant responses (bold, links)
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');

    return (
      <div className="space-y-2 text-xs leading-relaxed">
        {lines.map((line, lineIdx) => {
          if (!line.trim()) {
            return <div key={lineIdx} className="h-1.5" />;
          }

          // Regex to parse markdown links [Text](/path)
          const linkRegex = /\[(.*?)\]\((.*?)\)/g;
          const parts: React.ReactNode[] = [];
          let lastIndex = 0;
          let match: RegExpExecArray | null;

          while ((match = linkRegex.exec(line)) !== null) {
            const beforeText = line.substring(lastIndex, match.index);
            if (beforeText) {
              parts.push(renderBoldText(beforeText));
            }

            const linkLabel = match[1];
            const linkHref = match[2];

            if (linkHref.startsWith('/')) {
              parts.push(
                <button
                  key={`${lineIdx}-${match.index}`}
                  onClick={() => {
                    navigateTo(linkHref);
                    // On mobile, close widget to view product page cleanly
                    if (window.innerWidth < 640) {
                      setIsOpen(false);
                    }
                  }}
                  className="font-medium text-amber-400 hover:text-amber-300 underline decoration-amber-500/50 hover:decoration-amber-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>{linkLabel}</span>
                  <ArrowRight className="h-3 w-3 inline" />
                </button>
              );
            } else {
              parts.push(
                <a
                  key={`${lineIdx}-${match.index}`}
                  href={linkHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-amber-400 hover:text-amber-300 underline inline-flex items-center gap-1"
                >
                  <span>{linkLabel}</span>
                  <ExternalLink className="h-2.5 w-2.5 inline" />
                </a>
              );
            }

            lastIndex = match.index + match[0].length;
          }

          if (lastIndex < line.length) {
            parts.push(renderBoldText(line.substring(lastIndex)));
          }

          return <p key={lineIdx}>{parts.length > 0 ? parts : renderBoldText(line)}</p>;
        })}
      </div>
    );
  };

  // Helper for bold **text**
  const renderBoldText = (text: string): React.ReactNode => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const elements: React.ReactNode[] = [];
    let lastIdx = 0;
    let match: RegExpExecArray | null;

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIdx) {
        elements.push(text.substring(lastIdx, match.index));
      }
      elements.push(
        <strong key={`bold-${match.index}`} className="font-semibold text-white">
          {match[1]}
        </strong>
      );
      lastIdx = match.index + match[0].length;
    }

    if (lastIdx < text.length) {
      elements.push(text.substring(lastIdx));
    }

    return elements.length > 0 ? elements : text;
  };

  // Do not show floating assistant when user is inside the admin panel to keep admin clean
  if (currentPath.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      {/* Floating Trigger Button (Bottom Right) */}
      {!isOpen && (
        <div className="fixed bottom-5 right-5 z-40">
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Ouvrir l'assistant commercial VISION BOOKS"
            className="group relative flex items-center gap-3 rounded-full border border-amber-500/40 bg-neutral-900/95 px-4 py-3 text-neutral-100 shadow-2xl backdrop-blur-md transition-all hover:scale-105 hover:border-amber-400 hover:bg-neutral-850 hover:shadow-amber-500/20 active:scale-95 cursor-pointer"
          >
            {/* Ambient gold glow */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/10 blur-sm group-hover:opacity-100 transition-opacity" />

            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/30">
              <Headphones className="h-4 w-4" />
              {/* Online pulsing indicator */}
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-neutral-900" />
              </span>
            </div>

            <div className="relative hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                <span>Conseiller VISION BOOKS</span>
                <Sparkles className="h-3 w-3 text-amber-400" />
              </span>
              <span className="text-[10px] text-neutral-400">
                Besoin d'aide pour choisir un livre ?
              </span>
            </div>

            <span className="relative sm:hidden text-xs font-semibold text-amber-400">
              Conseiller
            </span>
          </button>
        </div>
      )}

      {/* Expanded Chat Drawer / Card */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col w-[calc(100vw-32px)] sm:w-[420px] h-[580px] max-h-[calc(100vh-80px)] rounded-2xl sm:rounded-3xl border border-neutral-800 bg-neutral-950/95 shadow-2xl backdrop-blur-2xl overflow-hidden transition-all duration-200 animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="relative flex items-center justify-between border-b border-neutral-800 bg-neutral-900/80 px-4 py-3.5 sm:px-5">
            <div className="flex items-center gap-3">
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20">
                <Headphones className="h-5 w-5" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-neutral-900" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white tracking-wide">
                    Conseiller VISION BOOKS
                  </h3>
                  <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400 border border-amber-500/20">
                    Gemini AI
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400">
                  En ligne • Réponses personnalisées instantanées
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Recommencer la conversation"
                className="rounded-lg p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Réduire l'assistant"
                className="rounded-lg p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Fermer l'assistant"
                className="rounded-lg p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scroll-smooth">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 ${
                    msg.role === 'user'
                      ? 'rounded-br-none bg-amber-500/15 border border-amber-500/30 text-amber-100'
                      : 'rounded-bl-none bg-neutral-900 border border-neutral-800 text-neutral-200 shadow-sm'
                  }`}
                >
                  {renderFormattedContent(msg.content)}

                  {/* Interactive Recommended Product Chips if returned by assistant */}
                  {msg.suggestedProducts && msg.suggestedProducts.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-neutral-800/80 space-y-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        <span>Livres audio suggérés :</span>
                      </span>

                      <div className="grid gap-2">
                        {msg.suggestedProducts.map((prod) => (
                          <div
                            key={prod.id}
                            className="flex items-center justify-between gap-2.5 rounded-xl border border-neutral-800 bg-neutral-950/70 p-2.5 hover:border-neutral-700 transition-all"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {prod.cover ? (
                                <img
                                  src={prod.cover}
                                  alt={prod.title}
                                  className="h-10 w-10 shrink-0 rounded-lg object-cover border border-neutral-800"
                                />
                              ) : (
                                <div className="h-10 w-10 shrink-0 rounded-lg bg-neutral-800 flex items-center justify-center text-amber-400">
                                  <BookOpen className="h-5 w-5" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <h4 className="font-semibold text-white truncate text-[11px]">
                                  {prod.title}
                                </h4>
                                <p className="text-[10px] text-neutral-400 truncate">
                                  {prod.author}
                                </p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[11px] font-bold text-amber-400">
                                    {prod.sale_price ? `${prod.sale_price} €` : `${prod.normal_price} €`}
                                  </span>
                                  {prod.sale_price && (
                                    <span className="text-[9px] text-neutral-500 line-through">
                                      {prod.normal_price} €
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col gap-1 shrink-0">
                              <button
                                onClick={() => {
                                  navigateTo(`/produit/${prod.slug}`);
                                  if (window.innerWidth < 640) setIsOpen(false);
                                }}
                                className="rounded-lg bg-neutral-800 px-2 py-1 text-[10px] font-medium text-white hover:bg-neutral-700 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <span>Voir</span>
                                <ArrowRight className="h-2.5 w-2.5" />
                              </button>
                              <button
                                onClick={() => openWhatsAppProduct(prod.title)}
                                className="rounded-lg bg-emerald-600/30 border border-emerald-500/40 px-2 py-1 text-[10px] font-semibold text-emerald-300 hover:bg-emerald-600/50 transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <span>WhatsApp</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <span className="mt-1 px-1 text-[9px] text-neutral-500 font-mono">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {/* Typing Indicator */}
            {loading && (
              <div className="flex items-start gap-2">
                <div className="rounded-2xl rounded-bl-none border border-neutral-800 bg-neutral-900 p-3.5 text-neutral-400 flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-400" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-400 [animation-delay:0.2s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-400 [animation-delay:0.4s]" />
                  </div>
                  <span className="text-[11px] text-neutral-400">Le conseiller analyse le catalogue...</span>
                </div>
              </div>
            )}

            {/* Quick Starter Suggestions when only welcome message is present */}
            {messages.length === 1 && !loading && (
              <div className="pt-2 space-y-1.5">
                <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-500 px-1">
                  Suggestions de questions rapides :
                </p>
                <div className="flex flex-col gap-1.5">
                  {STARTER_SUGGESTIONS.map((sugg, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(sugg)}
                      className="text-left rounded-xl border border-neutral-800/80 bg-neutral-900/50 hover:bg-neutral-850 hover:border-amber-500/30 p-2.5 text-[11px] text-neutral-300 hover:text-white transition-all cursor-pointer"
                    >
                      {sugg}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick WhatsApp Action Banner */}
          <div className="border-t border-neutral-850 bg-neutral-900/40 px-3 py-1.5 flex items-center justify-between text-[10px] text-neutral-400">
            <span className="truncate">Commande directe & instantanée :</span>
            <button
              onClick={openWhatsAppGeneral}
              className="shrink-0 flex items-center gap-1 font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
            >
              <MessageCircle className="h-3 w-3" />
              <span>WhatsApp ({whatsappNumber})</span>
            </button>
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="border-t border-neutral-800 bg-neutral-900/90 p-3 sm:p-3.5"
          >
            <div className="relative flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Posez votre question sur un livre, le Pack VIP..."
                disabled={loading}
                className="w-full rounded-xl border border-neutral-750 bg-neutral-950 px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || loading}
                aria-label="Envoyer"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-neutral-950 hover:bg-amber-400 active:scale-95 disabled:opacity-40 disabled:hover:bg-amber-500 transition-all cursor-pointer shadow-md shadow-amber-500/20"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[9px] text-neutral-500 px-0.5">
              <span>Conseils basés sur le catalogue officiel</span>
              <span>Sans engagement • Accès à vie</span>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
