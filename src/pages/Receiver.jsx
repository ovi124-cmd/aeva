import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { decodeProposal } from '../lib/encode.js';
import { supabase, handleJwtExpiration } from '../lib/supabase.js';
import RomanticClassic from '../templates/RomanticClassic.jsx';
import { HeartCrack, Sparkles, ArrowRight, Loader2 } from 'lucide-react';

export default function Receiver() {
  const { id } = useParams();
  const [proposalData, setProposalData] = useState(null);
  const [templateHtml, setTemplateHtml] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [yesToast, setYesToast] = useState('');

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError('');

      const decoded = decodeProposal(id);
      if (!decoded) {
        setError('invalid_link');
        setIsLoading(false);
        return;
      }
      setProposalData(decoded);

      const hardcodedTemplates = [
        'celestial-vow', 'golden-hour', 'rosewater-whisper', 
        'midnight-paris', 'letters-florence', 'eternal-velvet'
      ];

      if (hardcodedTemplates.includes(decoded.templateId)) {
        setIsLoading(false);
        return;
      }

      try {
        let { data, error: dbError } = await supabase
          .from('templates')
          .select('entry_path, name')
          .eq('id', decoded.templateId)
          .single();

        if (dbError && (await handleJwtExpiration(dbError))) {
          const retry = await supabase
            .from('templates')
            .select('entry_path, name')
            .eq('id', decoded.templateId)
            .single();
          data = retry.data;
          dbError = retry.error;
        }

        if (dbError || !data) {
          setError('template_missing');
        } else {
          const { data: urlData } = supabase.storage
            .from('templates')
            .getPublicUrl(data.entry_path);
          
          // 🔥 TRICK: Fetch the HTML text directly
          const response = await fetch(urlData.publicUrl);
          let htmlText = await response.text();

          // Inject a <base> tag so external CSS/Images inside the ZIP load correctly
          const baseUrl = urlData.publicUrl.substring(0, urlData.publicUrl.lastIndexOf('/') + 1);
          const baseTag = `<base href="${baseUrl}">`;
          
          // Add the base tag inside <head>
          if (htmlText.includes('<head>')) {
            htmlText = htmlText.replace('<head>', `<head>\n${baseTag}`);
          } else {
            htmlText = `${baseTag}\n${htmlText}`;
          }

          // Pass the names and message via JavaScript injection (safer than URL params for srcDoc)
          const dataScript = `
            <script>
              window.AEVA_DATA = ${JSON.stringify({
                receiver: decoded.receiverName,
                sender: decoded.senderName,
                message: decoded.message,
                code: decoded.secretCode,
                music: decoded.musicUrl
              })};
            </script>
          `;
          htmlText = htmlText.replace('<head>', `<head>\n${dataScript}`);

          setTemplateHtml(htmlText);
        }
      } catch (err) {
        console.error('Error fetching dynamic template:', err);
        setError('template_missing');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [id]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'AEVA_YES') {
        import('../lib/telegram.js').then(({ sendAdminYesAlert }) => {
          sendAdminYesAlert({
            senderName: proposalData?.senderName,
            receiverName: proposalData?.receiverName,
            templateName: 'Dynamic Template'
          });
        });

        try { alert('Your YES has been sent! 💛'); } catch {}
        setYesToast('Your YES has been sent! 💛');
        setTimeout(() => setYesToast(''), 6000);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [proposalData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-9 h-9 animate-spin text-[#C59B63] mb-3" />
        <p className="font-serif text-lg font-medium text-[#2B1F1A]">Unveiling your proposal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-6 text-center">
        <HeartCrack className="w-12 h-12 text-[#C59B63] mb-4" />
        <h1 className="font-serif text-2xl font-normal text-[#2B1F1A]">
          {error === 'invalid_link' ? 'This link is invalid' : 'Template Unavailable'}
        </h1>
        <Link to="/create" className="mt-4 px-6 py-3 rounded-full bg-[#C59B63] text-white text-sm font-medium">
          Create your own
        </Link>
      </div>
    );
  }

  if (templateHtml) {
    return (
      <div className="w-full h-screen bg-[#FAF7F2] relative overflow-hidden">
        {yesToast && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full bg-[#2B1F1A] text-[#FAF7F2] text-xs font-medium shadow-2xl border border-[#C59B63] animate-bounce">
            {yesToast}
          </div>
        )}
        {/* 🔥 Render using srcDoc instead of src */}
        <iframe
          srcDoc={templateHtml}
          title="AEVA Proposal"
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-popups allow-forms"
        />
      </div>
    );
  }

  return (
    <RomanticClassic
      proposalId={id}
      templateId={proposalData?.templateId || 'celestial-vow'}
      receiverName={proposalData?.receiverName}
      senderName={proposalData?.senderName}
      message={proposalData?.message}
      secretCode={proposalData?.secretCode}
      musicUrl={proposalData?.musicUrl || ''}
      onAnswer={(ans) => console.log('Proposal answered:', ans)}
    />
  );
}