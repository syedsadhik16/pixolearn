import { MessageCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '919999999999'; // Replace with actual number
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Hi! I'm interested in PIXO for my child. Can you help me choose the right plan?"
);

export function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-5 w-5 fill-white" />
      <span className="text-sm font-semibold hidden sm:inline group-hover:inline">
        Chat with us
      </span>
    </a>
  );
}
