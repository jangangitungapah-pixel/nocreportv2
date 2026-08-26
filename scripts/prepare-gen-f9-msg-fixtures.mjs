import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import {
  decodeOutlookMsgBufferWithDefaultDecoder,
  parseOutlookMsgImportWithDefaultDecoder,
} from '../src/features/ticket-generator/lib/outlookMsgAdapter.js';

export const GEN_F9_MSG_UPSTREAM_COMMIT = '62c45222668fdc631a33e2fbbb596dd1d6ab770c';

const QUOTED_SENT_PATTERN = /(?:^|\r?\n)\s*Sent:\s*\S.+/im;

async function listMsgFiles(root) {
  const items = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(fullPath);
      else if (entry.name.toLowerCase().endsWith('.msg')) items.push(fullPath);
    }
  }
  await walk(root);
  return items.sort((left, right) => left.localeCompare(right));
}

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

export async function prepareGenF9MsgFixtures(upstreamRoot, outputRoot) {
  if (!upstreamRoot || !outputRoot) {
    throw new Error('Usage: node scripts/prepare-gen-f9-msg-fixtures.mjs <upstream-root> <output-root>');
  }

  const sentFixturePath = path.join(upstreamRoot, 'test', 'sent.msg');
  const sent = await inspectFixture(sentFixturePath);
  if (!sent.hasClientSubmitTime) {
    throw new Error('Pinned upstream test/sent.msg has no Client Submit Time.');
  }

  const files = await listMsgFiles(upstreamRoot);
  let quotedWithoutMetadata = null;
  let quotedWithMetadata = null;
  const decodeFailures = [];

  for (const filePath of files) {
    try {
      const inspected = await inspectFixture(filePath);
      if (!inspected.hasQuotedSent) continue;
      if (!inspected.hasClientSubmitTime && !quotedWithoutMetadata) quotedWithoutMetadata = inspected;
      if (inspected.hasClientSubmitTime && !quotedWithMetadata) quotedWithMetadata = inspected;
      if (quotedWithoutMetadata && quotedWithMetadata) break;
    } catch (error) {
      decodeFailures.push({
        fixture: relativeFixturePath(upstreamRoot, filePath),
        code: error?.code ?? 'DECODE_FAILED',
      });
    }
  }

  const quoted = quotedWithoutMetadata ?? quotedWithMetadata;
  if (!quoted) {
    throw new Error('No pinned upstream .msg fixture with a quoted Sent: body header was found.');
  }

  await mkdir(outputRoot, { recursive: true });
  const sentOutput = path.join(outputRoot, 'sent.msg');
  const quotedOutput = path.join(outputRoot, 'quoted-sent.msg');
  await copyFile(sent.filePath, sentOutput);
  await copyFile(quoted.filePath, quotedOutput);

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
      sourceFixture: relativeFixturePath(upstreamRoot, quoted.filePath),
      quotedSentPresent: true,
      rejectionMode: quoted.hasClientSubmitTime
        ? 'CURRENT_MESSAGE_METADATA_AUTHORITATIVE'
        : 'NO_METADATA_BODY_FALLBACK_REJECTED',
      ...safeCandidateMetadata(quoted.candidate),
    },
    decodeFailureCount: decodeFailures.length,
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
        decodeFailureCount: expected.decodeFailureCount,
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
