import { findDuplicateTicketCandidates } from '../../../infrastructure/firebase/firestoreTicketRepository.js';
import {
  hasDuplicateLookupSignal,
  rankDuplicateCandidates,
} from './duplicateDetection.js';

export async function findDuplicateCandidates(ticket, { excludeTicketId = null, limit = 12 } = {}) {
  if (!hasDuplicateLookupSignal(ticket)) return [];

  const candidates = await findDuplicateTicketCandidates({
    ticket,
    excludeTicketId,
    limit: Math.min(Math.max(Number(limit) || 12, 1) * 2, 32),
  });

  return rankDuplicateCandidates(ticket, candidates, {
    excludeTicketId,
    limit,
  });
}
