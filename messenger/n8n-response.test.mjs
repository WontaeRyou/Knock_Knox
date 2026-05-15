import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('./n8n-response.js', import.meta.url), 'utf8');
const context = { window: {} };
vm.createContext(context);
vm.runInContext(source, context);

const { extractKnoxReplyText } = context.window.KnockN8nResponse;

assert.equal(
  extractKnoxReplyText({
    mode: 'AI_DRAFT',
    agent_response: {
      draft: '모니모 MAU는 아래 SQL로 조회할 수 있습니다.',
      confidence: 0.91,
      sources: [],
    },
  }),
  '모니모 MAU는 아래 SQL로 조회할 수 있습니다.',
);

assert.equal(
  extractKnoxReplyText({
    status: 'received',
    message: '처리 완료',
  }),
  null,
);

assert.equal(
  extractKnoxReplyText({
    reply: '단순 reply 필드도 말풍선으로 표시합니다.',
  }),
  '단순 reply 필드도 말풍선으로 표시합니다.',
);
