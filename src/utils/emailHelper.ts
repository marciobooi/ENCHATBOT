/**
 * Email Helper
 * Generates pre-filled support emails with diagnostic information
 */

import chatInsightsStore from '../state/globalChatState';

export interface DiagnosticInfo {
  timestamp: string;
  userAgent: string;
  url: string;
  platform: string;
  language: string;
  cookiesEnabled: boolean;
  online: boolean;
  chatHistory: Array<{
    number: number;
    timestamp: string;
    userMessage: string;
    processedMessage: string;
    detectedIntent: string;
    confidence: number;
  }>;
}

/**
 * Gather diagnostic information from the current environment and chat history
 */
export function gatherDiagnosticInfo(): DiagnosticInfo {
  const recentEntries = chatInsightsStore.entries.slice(-10);

  return {
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
    platform: typeof navigator !== 'undefined' ? navigator.platform : 'Unknown',
    language: typeof navigator !== 'undefined' ? navigator.language : 'Unknown',
    cookiesEnabled: typeof navigator !== 'undefined' ? navigator.cookieEnabled : false,
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    chatHistory: recentEntries.map((entry, index) => ({
      number: index + 1,
      timestamp: new Date(entry.timestamp).toLocaleString(),
      userMessage: entry.raw,
      processedMessage: entry.cleaned,
      detectedIntent: entry.resolution.primary,
      confidence: entry.resolution.scores[entry.resolution.primary] || 0
    }))
  };
}

/**
 * Format diagnostic information for email body
 */
export function formatDiagnosticInfo(info: DiagnosticInfo): string {
  return `
SYSTEM INFORMATION:
- Timestamp: ${info.timestamp}
- Browser: ${info.userAgent}
- Platform: ${info.platform}
- Language: ${info.language}
- Cookies Enabled: ${info.cookiesEnabled ? 'Yes' : 'No'}
- Online Status: ${info.online ? 'Yes' : 'No'}
- Current URL: ${info.url}

RECENT CHAT HISTORY (Last ${info.chatHistory.length} messages):
${info.chatHistory.map(msg => 
  `${msg.number}. [${msg.timestamp}]
   User Input: "${msg.userMessage}"
   Processed: "${msg.processedMessage}"
   Detected Intent: ${msg.detectedIntent} (confidence: ${msg.confidence})`
).join('\n\n')}
  `.trim();
}

/**
 * Generate a mailto URL for support email with diagnostic information
 */
export function generateSupportEmailUrl(recipientEmail = 'support@eurostat.eu'): string {
  const diagnosticInfo = gatherDiagnosticInfo();
  const formattedDiagnostics = formatDiagnosticInfo(diagnosticInfo);

  const subject = encodeURIComponent('Eurostat Chatbot - Technical Support Request');
  const body = encodeURIComponent(`Dear Eurostat Support Team,

I'm experiencing issues with the Eurostat Energy Chatbot and need assistance.

ISSUE DESCRIPTION:
[Please describe the problem you're experiencing here]

WHAT I WAS TRYING TO DO:
[Please describe what you were trying to accomplish]

EXPECTED BEHAVIOR:
[What did you expect to happen?]

=== DIAGNOSTIC INFORMATION (DO NOT EDIT BELOW) ===

${formattedDiagnostics}

=== END DIAGNOSTIC INFORMATION ===

Thank you for your assistance.

Best regards`);

  return `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
}
