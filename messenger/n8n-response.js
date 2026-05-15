(function () {
  function cleanText(value) {
    if (typeof value !== 'string') return null;
    const text = value.trim();
    return text.length > 0 ? text : null;
  }

  function extractKnoxReplyText(data) {
    if (!data || typeof data !== 'object') return null;

    const directReply =
      cleanText(data.reply) ||
      cleanText(data.answer) ||
      cleanText(data.draft) ||
      cleanText(data.message_text);
    if (directReply) return directReply;

    const agentResponse = data.agent_response || data.agentResponse;
    if (agentResponse && typeof agentResponse === 'object') {
      return (
        cleanText(agentResponse.draft) ||
        cleanText(agentResponse.answer) ||
        cleanText(agentResponse.reply)
      );
    }

    return null;
  }

  window.KnockN8nResponse = {
    extractKnoxReplyText,
  };
})();
