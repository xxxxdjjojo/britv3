/* eslint-disable no-console -- TODO Sprint 1: migrate console.error to captureException (see src/lib/observability/capture-exception.ts) */
"use client";

import { useEffect } from "react";
import { Wrench, RefreshCw, Home } from "lucide-react";
import { captureException } from "@/lib/observability/capture-exception";

/**
 * global-error.tsx — catches errors in the root layout itself.
 * Must render its own <html> and <body> since the root layout is unavailable.
 */
export default function GlobalError({
  error,
  reset,
}: Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>) {
  useEffect(() => {
    captureException(error, {
      module: "app",
      feature: "error-boundary",
      operation: "global-error",
      extra: { digest: error.digest },
    });
    console.error("[GlobalErrorBoundary]", error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Something went wrong | TrueDeed</title>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: "Inter", system-ui, sans-serif;
            background: #F8F8FA;
            color: #171719;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 24px;
          }
          .card {
            background: white;
            border-radius: 24px;
            border: 1px solid rgba(27,77,62,0.05);
            padding: 48px 32px;
            text-align: center;
            max-width: 440px;
            width: 100%;
            box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          }
          .icon-wrap {
            width: 120px; height: 120px;
            border-radius: 9999px;
            background: #E8F5EE;
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 28px;
          }
          .icon-wrap svg { width: 52px; height: 52px; color: #1B4D3E; }
          h1 { font-size: 28px; font-weight: 700; margin: 0 0 12px; }
          p { color: #5E5E6A; margin: 0 0 32px; line-height: 1.6; }
          .digest { font-family: monospace; font-size: 11px; color: #9E9EAB; margin-bottom: 24px; }
          .btn {
            display: inline-flex; align-items: center; justify-content: center; gap: 8px;
            width: 100%; padding: 14px 24px; border-radius: 10px;
            font-size: 15px; font-weight: 700; cursor: pointer; border: none;
            transition: opacity 0.15s;
          }
          .btn:hover { opacity: 0.9; }
          .btn-primary { background: #1B4D3E; color: white; margin-bottom: 10px; }
          .btn-secondary { background: #E8F5EE; color: #1B4D3E; }
          svg { display: inline-block; vertical-align: middle; }
        `}</style>
      </head>
      <body>
        <div className="card" style={{background:'white',borderRadius:'24px',border:'1px solid rgba(27,77,62,0.05)',padding:'48px 32px',textAlign:'center',maxWidth:'440px',width:'100%',boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}}>
          <div style={{width:'120px',height:'120px',borderRadius:'9999px',background:'#E8F5EE',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 28px'}}>
            <Wrench style={{width:'52px',height:'52px',color:'#1B4D3E'}} aria-hidden="true" />
          </div>
          <h1 style={{fontFamily:'"Inter",system-ui,sans-serif',fontSize:'28px',fontWeight:700,margin:'0 0 12px',color:'#171719'}}>
            Something went wrong
          </h1>
          <p style={{color:'#5E5E6A',margin:'0 0 8px',lineHeight:1.6}}>
            A critical error occurred. Please reload or return home.
          </p>
          {error.digest && (
            <p style={{fontFamily:'monospace',fontSize:'11px',color:'#9E9EAB',marginBottom:'24px'}}>
              ref: {error.digest}
            </p>
          )}
          <div style={{marginTop:'28px',display:'flex',flexDirection:'column',gap:'10px'}}>
            <button
              onClick={reset}
              style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',width:'100%',padding:'14px 24px',borderRadius:'10px',fontSize:'15px',fontWeight:700,cursor:'pointer',border:'none',background:'#1B4D3E',color:'white'}}
            >
              <RefreshCw style={{width:'18px',height:'18px'}} aria-hidden="true" />
              Try Again
            </button>
            <button
              onClick={() => { window.location.href = "/"; }}
              style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',width:'100%',padding:'14px 24px',borderRadius:'10px',fontSize:'15px',fontWeight:700,cursor:'pointer',border:'none',background:'#E8F5EE',color:'#1B4D3E'}}
            >
              <Home style={{width:'18px',height:'18px'}} aria-hidden="true" />
              Go Home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
