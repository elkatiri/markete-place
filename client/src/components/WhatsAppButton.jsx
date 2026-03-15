import { FaWhatsapp } from "react-icons/fa";

const WHATSAPP_NUMBER = "212651625941";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;

export default function WhatsAppButton() {
  return (
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact us on WhatsApp"
      className="fixed bottom-24 right-4 z-40 inline-flex items-center  rounded-full bg-[#25D366] px-3 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.02] hover:bg-[#20ba5a] active:scale-[0.98] md:bottom-6 md:right-6"
    >
      <span className="flex  items-center justify-center rounded-full bg-white/15 text-2xl">
        <FaWhatsapp />
      </span>
    </a>
  );
}