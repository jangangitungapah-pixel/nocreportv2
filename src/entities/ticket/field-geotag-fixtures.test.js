import { describe, expect, it } from 'vitest';

import { parseCoordinateText } from './index.js';

const FIELD_WATERMARK_FIXTURES = [
  {
    name: 'Bogor DMS watermark with decimal comma',
    text: `20 Agu 2026 21.07.33
6°35'39,378"S 106°39'57,78"E
No.13 Ruko Bale Arsa
Cibatok 2
Kecamatan Cibungbulang
Kabupaten Bogor
Jawa Barat`,
    format: 'DMS',
    latitude: -6.594271666666667,
    longitude: 106.66605,
  },
  {
    name: 'Jakarta DMS watermark with long fractional seconds',
    text: `Network: 20 Agu 2026 21.32.43 WIB
Local: 20 Agu 2026 21.32.43 WIB
6°9'53,16077"S 106°43'47,46256"E
Daerah Khusus Ibukota Jakarta`,
    format: 'DMS',
    latitude: -6.164766880555556,
    longitude: 106.72985071111111,
  },
  {
    name: 'North Sumatra decimal-comma hemisphere watermark',
    text: `20 Agu 2026 17.01.04
3,5244N 98,7691E
Jalan Lintas Sumatera
Limau Manis
Kecamatan Tanjung Morawa
Kabupaten Deli Serdang
Sumatera Utara`,
    format: 'DD',
    latitude: 3.5244,
    longitude: 98.7691,
  },
  {
    name: 'Central Java dot-decimal hemisphere watermark',
    text: `Kamis, 20 Agustus 2026
7.14880862S 110.42380314E
Jalan Lingga Timur
Gedanganak
Kecamatan Ungaran Timur
Kabupaten Semarang
Jawa Tengah`,
    format: 'DD',
    latitude: -7.14880862,
    longitude: 110.42380314,
  },
  {
    name: 'Jepara signed decimal-comma plus hemisphere watermark',
    text: `Kamis, 20 Agustus 2026
-6,5306S +110,7314E
Jambu Timur
Kecamatan Mlonggo
Kabupaten Jepara
Jawa Tengah`,
    format: 'DD',
    latitude: -6.5306,
    longitude: 110.7314,
  },
  {
    name: 'Subang signed decimal-comma watermark',
    text: `20 Agu 2026 21:13:55.704
-6,7709S +107,6371E
Raya Subang
Kecamatan Ciater
Kabupaten Subang
Jawa Barat`,
    format: 'DD',
    latitude: -6.7709,
    longitude: 107.6371,
  },
  {
    name: 'Bandung unsigned numeric value with south hemisphere',
    text: `21/08/2026 00:19
6,9049S 107,6010E
Jalan Doktor Cipto
Pasir Kaliki
Kecamatan Cicendo
Kota Bandung
Jawa Barat`,
    format: 'DD',
    latitude: -6.9049,
    longitude: 107.601,
  },
  {
    name: 'Sumedang signed decimal-comma watermark',
    text: `18 Agu 2026 23.54.41
-6,7890S +108,0844E
Kecamatan Tomo, Kabupaten Sumedang 45382
Indonesia`,
    format: 'DD',
    latitude: -6.789,
    longitude: 108.0844,
  },
];

describe('field geotag watermark regressions', () => {
  for (const fixture of FIELD_WATERMARK_FIXTURES) {
    it(`parses ${fixture.name}`, () => {
      const result = parseCoordinateText(fixture.text);

      expect(result).toMatchObject({
        status: 'success',
        format: fixture.format,
      });
      expect(result.latitude).toBeCloseTo(fixture.latitude, 8);
      expect(result.longitude).toBeCloseTo(fixture.longitude, 8);
    });
  }

  it('does not invent a coordinate from an address-only watermark', () => {
    const result = parseCoordinateText(`21:41 | 20/08/2026
Jl. Gatot Subroto No.185, RT.12/RW.1,
Kuningan, Karet Kuningan, Kecamatan Setiabudi,
Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12870`);

    expect(result).toEqual({
      status: 'not_found',
      format: null,
      code: 'NO_COORDINATE',
    });
  });
});
