import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  decodeOutlookMsgBufferWithDefaultDecoder,
  parseOutlookMsgImportWithDefaultDecoder,
} from '../src/features/ticket-generator/lib/outlookMsgAdapter.js';

export const GEN_F9_MSG_UPSTREAM_COMMIT = '62c45222668fdc631a33e2fbbb596dd1d6ab770c';

const QUOTED_SENT_PATTERN = /(?:^|\r?\n)\s*Sent:\s*\S.+/im;
const UNICODE_BODY_STREAM = '__substg1.0_1000001F';
const ANSI_BODY_STREAM = '__substg1.0_1000001E';
const QUOTED_SENT_BLOCK = [
  '',
  '',
  '-----Original Message-----',
  'From: previous.sender@example.test',
  'Sent: Tuesday, August 25, 2026 4:00 PM',
  'Subject: Previous operational message',
  '',
  'This quoted block is a synthetic GEN-F9 runtime fixture.',
].join('\r\n');

function safeCandidateMetadata(candidate) {
  const dispatch = candidate?.fields?.dispatchAt ?? null;
  return {
    messageSentAt: candidate?.source?.messageSentAt ?? null,
    dispatchAt: dispatch?.value ?? null,
    dispatchSource: dispatch?.source ?? null,
  };
}

async function inspectFixture(filePath) {
  const bytes = await readFile(filePath);
  const sourceName = path.basename(filePath);
  const decoded = await decodeOutlookMsgBufferWithDefaultDecoder(bytes, { sourceName });
  const candidate = await parseOutlookMsgImportWithDefaultDecoder(bytes, { sourceName });
  return {
    filePath,
    sourceName,
    hasQuotedSent: QUOTED_SENT_PATTERN.test(decoded.body ?? ''),
    hasClientSubmitTime: Boolean(decoded.clientSubmitTime),
    candidate,
  };
}

function relativeFixturePath(upstreamRoot, filePath) {
  return path.relative(upstreamRoot, filePath).split(path.sep).join('/');
}

async function createQuotedSentRuntimeFixture(sourcePath, outputPath) {
  const cfbModule = await import('cfb');
  const CFB = cfbModule.default ?? cfbModule;
  const sourceBytes = await readFile(sourcePath);
  const container = CFB.read(sourceBytes, { type: 'buffer' });
  const unicodePath = container.FullPaths.find((item) => item.endsWith(UNICODE_BODY_STREAM));
  const ansiPath = container.FullPaths.find((item) => item.endsWith(ANSI_BODY_STREAM));

  if (unicodePath) {
    const index = container.FullPaths.indexOf(unicodePath);
    const existing = Buffer.from(container.FileIndex[index]?.content ?? []);
    const baseText = existing.toString('utf16le').replace(/\0+$/u, '');
    CFB.utils.cfb_add(
      container,
      unicodePath,
      Buffer.from(`${baseText}${QUOTED_SENT_BLOCK}\0`, 'utf16le'),
    );
  } else if (ansiPath) {
    const index = container.FullPaths.indexOf(ansiPath);
    const existing = Buffer.from(container.FileIndex[index]?.content ?? []);
    const baseText = existing.toString('latin1').replace(/\0+$/u, '');
    CFB.utils.cfb_add(
      container,
      ansiPath,
      Buffer.from(`${baseText}${QUOTED_SENT_BLOCK}\0`, 'latin1'),
    );
  } else {
    const rootPath = container.FullPaths[0] ?? 'Root Entry/';
    const targetPath = `${rootPath}${rootPath.endsWith('/') ? '' : '/'}${UNICODE_BODY_STREAM}`;
    CFB.utils.cfb_add(
      container,
      targetPath,
      Buffer.from(`${QUOTED_SENT_BLOCK.trimStart()}\0`, 'utf16le'),
    );
  }

  await writeFile(outputPath, CFB.write(container, { type: 'buffer' }));
}

export async function prepareGenF9MsgFixtures(upstreamRoot, outputRoot) {
  if (!upstreamRoot || !outputRoot) {
    throw new Error('Usage: node scripts/prepare-gen-f9-msg-fixtures.mjs <upstream-root> <output-root>');
  }

  const sentFixturePath = path.join(upstreamRoot, 'test', 'sent.msg');
  const sent = await inspectFixture(sentFixturePath);
  if (!sent.hasClientSubmitTime) {
    throw new Error('Pinned upstream test/sent.msg has no Client Submit Time.');
  }
  if (sent.candidate?.fields?.dispatchAt?.source !== 'message_metadata') {
    throw new Error('Pinned upstream test/sent.msg did not map Client Submit Time to Dispatch Time.');
  }

  await mkdir(outputRoot, { recursive: true });
  const sentOutput = path.join(outputRoot, 'sent.msg');
  const quotedOutput = path.join(outputRoot, 'quoted-sent.msg');
  await copyFile(sent.filePath, sentOutput);
  await createQuotedSentRuntimeFixture(sent.filePath, quotedOutput);

  const quoted = await inspectFixture(quotedOutput);
  if (!quoted.hasQuotedSent) {
    throw new Error('Runtime-derived quoted Sent fixture did not expose the injected body header.');
  }
  if (!quoted.hasClientSubmitTime || quoted.candidate?.fields?.dispatchAt?.source !== 'message_metadata') {
    throw new Error('Quoted Sent runtime fixture did not preserve authoritative Client Submit Time.');
  }
  if (quoted.candidate?.fields?.dispatchAt?.value !== sent.candidate?.fields?.dispatchAt?.value) {
    throw new Error('Quoted body Sent header changed Dispatch Time away from current-message metadata.');
  }

  const expected = {
    schemaVersion: 1,
    upstream: {
      repository: 'HiraokaHyperTools/msgreader-web-ng',
      commit: GEN_F9_MSG_UPSTREAM_COMMIT,
    },
    sent: {
      file: sentOutput,
      sourceFixture: relativeFixturePath(upstreamRoot, sent.filePath),
      ...safeCandidateMetadata(sent.candidate),
    },
    quotedSent: {
      file: quotedOutput,
      sourceFixture: `runtime-derived:${relativeFixturePath(upstreamRoot, sent.filePath)}`,
      quotedSentPresent: true,
      rejectionMode: 'CURRENT_MESSAGE_METADATA_AUTHORITATIVE',
      ...safeCandidateMetadata(quoted.candidate),
    },
  };

  const expectedPath = path.join(outputRoot, 'expected.json');
  await writeFile(expectedPath, `${JSON.stringify(expected, null, 2)}\n`, 'utf8');
  console.log(
    JSON.stringify(
      {
        expectedPath,
        sentFixture: expected.sent.sourceFixture,
        sentDispatchSource: expected.sent.dispatchSource,
        quotedFixture: expected.quotedSent.sourceFixture,
        quotedRejectionMode: expected.quotedSent.rejectionMode,
        quotedDispatchSource: expected.quotedSent.dispatchSource,
      },
      null,
      2,
    ),
  );
  return { expectedPath, expected };
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  await prepareGenF9MsgFixtures(process.argv[2], process.argv[3]);
}
