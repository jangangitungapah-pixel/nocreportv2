import { z } from 'zod';

import { validateCoordinatePair } from '../../../entities/ticket/index.js';

export const ticketFormSchema = z
  .object({
    title: z.string(),
    impactList: z.array(z.object({ value: z.string() })),
    occurAt: z.string(),
    dispatchAt: z.string(),
    closedAt: z.string(),
    pic: z.string(),
    rootcause: z.string(),
    cutPoint: z.string(),
    latitude: z.string(),
    longitude: z.string(),
    coordinateSource: z.enum(['manual', 'ocr']).default('manual'),
    coordinateDetectedFormat: z.string().nullable().default('DD'),
    coordinateVerified: z.boolean().default(true),
  })
  .superRefine((value, context) => {
    const latitude = value.latitude.trim();
    const longitude = value.longitude.trim();

    if (!latitude && !longitude) {
      return;
    }

    if (!latitude || !longitude) {
      const path = latitude ? ['longitude'] : ['latitude'];
      context.addIssue({
        code: 'custom',
        path,
        message: 'Latitude and Longitude must be provided together.',
      });
      return;
    }

    const validation = validateCoordinatePair(latitude, longitude);
    if (!validation.valid) {
      const path = validation.code === 'LONGITUDE_OUT_OF_RANGE' ? ['longitude'] : ['latitude'];
      context.addIssue({
        code: 'custom',
        path,
        message:
          validation.code === 'LATITUDE_OUT_OF_RANGE'
            ? 'Latitude must be between -90 and 90.'
            : validation.code === 'LONGITUDE_OUT_OF_RANGE'
              ? 'Longitude must be between -180 and 180.'
              : 'Coordinate must be a valid number.',
      });
    }
  });

export function validateTicketForm(values) {
  return ticketFormSchema.safeParse(values);
}
