"use client";

import { useEffect } from "react";
import { Wrench, RefreshCw, Home } from "lucide-react";

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
    console.error("[GlobalErrorBoundary]", error);
  }, [error]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Something went wrong | Britestate</title>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; }
          body {
            margin: 0;
            font-family: "Plus Jakarta Sans", "Inter", system-ui, sans-serif;
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
            border-radius: 16px;
            border: 1px solid rgba(27,77,62,0.08);
            padding: 48px 32px;
            text-align: center;
            max-width: 440px;
            width: 100%;
            box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(229,229,229,0.6);
          }
          .icon-wrap {
            width: 120px; height: 120px;
            border-radius: 9999px;
            background: #E8F5EE;
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 28px;
          }
          .icon-wrap svg { width: 52px; height: 52px; color: #1B4D3E; }
          h1 {
            font-family: "Plus Jakarta Sans", "Inter", system-ui, sans-serif;
            font-size: 24px; font-weight: 700; margin: 0 0 10px;
          }
          p { color: #737373; margin: 0 0 8px; line-height: 1.6; font-size: 15px; }
          .digest { font-family: monospace; font-size: 11px; color: #A3A3A3; margin-bottom: 24px; }
          .btn {
            display: inline-flex; align-items: center; justify-content: center; gap: 8px;
            width: 100%; padding: 12px 24px; border-radius: 10px;
            font-size: 14px; font-weight: 500; cursor: pointer; border: none;
            font-family: "Plus Jakarta Sans", "Inter", system-ui, sans-serif;
            transition: opacity 0.15s;
          }
          .btn:hover { opacity: 0.9; }
          .btn-primary { background: #1B4D3E; color: white; margin-bottom: 10px; }
          .btn-secondary { background: #E8F5EE; color: #1B4D3E; }
          svg { display: inline-block; vertical-align: middle; }
        `}</style>
      </head>
      <body>
        <div className="card" style={{background:'white',borderRadius:'16px',border:'1px solid rgba(27,77,62,0.08)',padding:'48px 32px',textAlign:'center',maxWidth:'440px',width:'100%',boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}}>
          <div style={{width:'120px',height:'120px',borderRadius:'9999px',background:'#E8F5EE',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 28px'}}>
            <Wrench style={{width:'52px',height:'52px',color:'#1B4D3E'}} aria-hidden="true" />
          </div>
          <h1 style={{fontFamily:'"Plus Jakarta Sans","Inter",system-ui,sans-serif',fontSize:'24px',fontWeight:700,margin:'0 0 10px',color:'#171719'}}>
            Something went wrong
          </h1>
          <p style={{color:'#737373',margin:'0 0 8px',lineHeight:1.6,fontSize:'15px'}}>
            A critical error occurred. Please reload or return home.
          </p>
          {error.digest && (
            <p style={{fontFamily:'monospace',fontSize:'11px',color:'#A3A3A3',marginBottom:'24px'}}>
              ref: {error.digest}
            </p>
          )}
          <div style={{marginTop:'28px',display:'flex',flexDirection:'column',gap:'10px'}}>
            <button
              onClick={reset}
              style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',width:'100%',padding:'12px 24px',borderRadius:'10px',fontSize:'14px',fontWeight:500,cursor:'pointer',border:'none',background:'#1B4D3E',color:'white',fontFamily:'"Plus Jakarta Sans","Inter",system-ui,sans-serif'}}
            >
              <RefreshCw style={{width:'18px',height:'18px'}} aria-hidden="true" />
              Try Again
            </button>
            <button
              onClick={() => { window.location.href = "/"; }}
              style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',width:'100%',padding:'12px 24px',borderRadius:'10px',fontSize:'14px',fontWeight:500,cursor:'pointer',border:'none',background:'#E8F5EE',color:'#1B4D3E',fontFamily:'"Plus Jakarta Sans","Inter",system-ui,sans-serif'}}
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
