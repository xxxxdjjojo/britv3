"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckIcon, CopyIcon, MailIcon, MessageCircleIcon } from "lucide-react";

// Facebook and X don't have lucide icons that perfectly match; use inline SVG paths
function FacebookIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-4"
      aria-hidden="true"
    >
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622 1.972 1.972 0 0 0-.244.874c-.03.292-.046.686-.046 1.185v1.99h4.062l-.471 3.514-.521.153H13.237v8.003H9.101Z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-4"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117Z" />
    </svg>
  );
}

type Props = Readonly<{
  propertyUrl: string;
  propertyTitle: string;
  isOpen: boolean;
  onClose: () => void;
}>;

type ShareOption = Readonly<{
  label: string;
  href: string;
  icon: React.ReactNode;
  bgClass: string;
  textClass: string;
}>;

export function ShareModal({ propertyUrl, propertyTitle, isOpen, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(propertyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that block clipboard API
      const textarea = document.createElement("textarea");
      textarea.value = propertyUrl;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [propertyUrl]);

  const shareText = `Check out this property: ${propertyTitle}`;

  const shareOptions: ShareOption[] = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${propertyUrl}`)}`,
      icon: <MessageCircleIcon className="size-4" aria-hidden="true" />,
      bgClass: "bg-[#25D366]/10 hover:bg-[#25D366]/20",
      textClass: "text-[#25D366]",
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(propertyUrl)}`,
      icon: <FacebookIcon />,
      bgClass: "bg-[#1877F2]/10 hover:bg-[#1877F2]/20",
      textClass: "text-[#1877F2]",
    },
    {
      label: "X / Twitter",
      href: `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(propertyUrl)}`,
      icon: <XIcon />,
      bgClass: "bg-foreground/10 hover:bg-foreground/20",
      textClass: "text-foreground",
    },
    {
      label: "Email",
      href: `mailto:?subject=${encodeURIComponent(propertyTitle)}&body=${encodeURIComponent(propertyUrl)}`,
      icon: <MailIcon className="size-4" aria-hidden="true" />,
      bgClass: "bg-muted hover:bg-muted/80",
      textClass: "text-foreground",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md" aria-label="Share property">
        <DialogHeader>
          <DialogTitle>Share this property</DialogTitle>
          <DialogDescription className="truncate text-xs">
            {propertyTitle}
          </DialogDescription>
        </DialogHeader>

        {/* Copy link row */}
        <div className="flex items-center gap-2 rounded-lg border border-input bg-muted/40 px-3 py-2">
          <span
            className="flex-1 truncate text-xs text-muted-foreground"
            title={propertyUrl}
          >
            {propertyUrl}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="shrink-0 gap-1.5"
            aria-label={copied ? "Link copied" : "Copy link"}
          >
            {copied ? (
              <>
                <CheckIcon className="size-3.5 text-green-600" />
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <CopyIcon className="size-3.5" />
                <span>Copy</span>
              </>
            )}
          </Button>
        </div>

        {/* Social share grid */}
        <div className="grid grid-cols-2 gap-2">
          {shareOptions.map(({ label, href, icon, bgClass, textClass }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${bgClass} ${textClass}`}
            >
              {icon}
              {label}
            </a>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
