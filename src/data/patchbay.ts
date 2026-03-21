import type { PatchbayBay, PatchbayPoint, PatchbayRow, PatchbayLabelColor, NormallingType } from '@/types/studio';

// Helper to create points for a row
function createRowPoints(
  bay: number,
  row: number,
  labelColor: PatchbayLabelColor,
  labels: (string | null)[],
  type: 'send' | 'return',
  normallingType: NormallingType = 'half',
  gearMapping: Record<number, { gearId: string; gearIOId?: string }> = {},
  verifiedPositions: number[] = []
): PatchbayPoint[] {
  return labels.map((label, index) => {
    const position = index + 1;
    const mapping = gearMapping[position];
    const isVerified = verifiedPositions.includes(position) || verifiedPositions.length === 0;

    if (label === null) {
      return {
        id: `bay${bay}-row${row}-pos${position}`,
        label: '',
        bay,
        row,
        position,
        type,
        labelColor,
        normallingType: 'none' as NormallingType,
        verified: true, // empty is verified
      };
    }

    return {
      id: `bay${bay}-row${row}-pos${position}`,
      label,
      bay,
      row,
      position,
      type,
      gearId: mapping?.gearId,
      gearIOId: mapping?.gearIOId,
      labelColor,
      normalledTo: type === 'send' ? `bay${bay}-row${row + 1}-pos${position}` : undefined,
      normallingType,
      verified: isVerified,
    };
  });
}

// ============================================================
// PATCHBAY TOPOLOGY
// Based on studio photos - organized by rack position (top to bottom)
// Each bay has 2 rows forming normalled pairs (top=send, bottom=return)
// ============================================================

export const patchbayBays: PatchbayBay[] = [
  // ============================================================
  // UPPER RACK - Bay 1: Stage & Room Routing
  // ============================================================
  {
    id: 1,
    brand: 'Signex',
    label: 'Stage & Room Routing',
    rows: [
      {
        bayId: 1,
        rowNumber: 1,
        label: 'STAGE/ROOM OUTPUTS',
        labelColor: 'green',
        points: createRowPoints(
          1, 1, 'green',
          [
            'TALK', 'TALK', // Stereo talkback
            'TRIM B OUT L', 'TRIM B OUT R',
            'STAGE FROM CABINE L', 'STAGE FROM CABINE R',
            'FROM SALON L', 'FROM SALON R',
            'FROM TAPE L', 'FROM TAPE R',
            'STAGE FROM LIVE L', 'STAGE FROM LIVE R',
            null, null, null, null, null, null, null, null, null, null, null, null, // Empty positions
          ],
          'send',
          'half',
          {
            9: { gearId: 'studer-a82', gearIOId: 'a82-from-tape' },
            10: { gearId: 'studer-a82', gearIOId: 'a82-from-tape' },
          }
        ),
      },
      {
        bayId: 1,
        rowNumber: 2,
        label: 'STAGE/ROOM INPUTS',
        labelColor: 'green',
        points: createRowPoints(
          1, 2, 'green',
          [
            'CW S2 L', 'CW S2 R',
            'CW S3 L', 'CW S3 R',
            'CASQUE L', 'CASQUE R',
            'STAGE TO CABINE L', 'STAGE TO CABINE R',
            'TO SALON L', 'TO SALON R',
            'TO TAPE L', 'TO TAPE R',
            null, null, null, null, null, null, null, null, null, null, null, null,
          ],
          'return',
          'half',
          {
            1: { gearId: 'crookwood', gearIOId: 'cw-s2' },
            2: { gearId: 'crookwood', gearIOId: 'cw-s2' },
            3: { gearId: 'crookwood', gearIOId: 'cw-s3' },
            4: { gearId: 'crookwood', gearIOId: 'cw-s3' },
            11: { gearId: 'studer-a82', gearIOId: 'a82-to-tape' },
            12: { gearId: 'studer-a82', gearIOId: 'a82-to-tape' },
          }
        ),
      },
    ],
  },

  // ============================================================
  // UPPER RACK - Bay 2: Outboard Sends/Returns
  // ============================================================
  {
    id: 2,
    brand: 'Signex',
    label: 'Outboard I/O',
    rows: [
      {
        bayId: 2,
        rowNumber: 1,
        label: 'OUTBOARD OUTPUTS',
        labelColor: 'orange',
        points: createRowPoints(
          2, 1, 'orange',
          [
            'STA L', 'STA R', // Sta-Level (mono but patched L/R)
            'RE501 L', 'RE501 R',
            'MPX1 L', 'MPX1 R',
            'BAE OUT', null, // BAE is mono
            'API 3124 OUT 1', 'API 3124 OUT 2', 'API 3124 OUT 3', 'API 3124 OUT 4',
            null, null, null, null, null, null, null, null, null, null, null, null,
          ],
          'send',
          'half',
          {
            1: { gearId: 'retro-sta-level', gearIOId: 'sta-out' },
            7: { gearId: 'bae-preamp', gearIOId: 'bae-out' },
            9: { gearId: 'api-3124', gearIOId: 'api3124-out' },
            10: { gearId: 'api-3124', gearIOId: 'api3124-out' },
            11: { gearId: 'api-3124', gearIOId: 'api3124-out' },
            12: { gearId: 'api-3124', gearIOId: 'api3124-out' },
          },
          [1, 2, 7, 9, 10, 11, 12]
        ),
      },
      {
        bayId: 2,
        rowNumber: 2,
        label: 'OUTBOARD INPUTS',
        labelColor: 'orange',
        points: createRowPoints(
          2, 2, 'orange',
          [
            'STA L', 'STA R',
            'RE501 L', 'RE501 R',
            'MPX1 L', 'MPX1 R',
            'BAE IN', null,
            'API 3124 IN 1', 'API 3124 IN 2', 'API 3124 IN 3', 'API 3124 IN 4',
            null, null, null, null, null, null, null, null, null, null, null, null,
          ],
          'return',
          'half',
          {
            1: { gearId: 'retro-sta-level', gearIOId: 'sta-in' },
            7: { gearId: 'bae-preamp', gearIOId: 'bae-mic' },
          },
          [1, 2, 7, 9, 10, 11, 12]
        ),
      },
    ],
  },

  // ============================================================
  // UPPER RACK - Bay 3: Bus Compressors & Console I/O
  // ============================================================
  {
    id: 3,
    brand: 'Signex',
    label: 'Bus & Console',
    rows: [
      {
        bayId: 3,
        rowNumber: 1,
        label: 'BUS COMPRESSOR / CONSOLE OUT',
        labelColor: 'red',
        points: createRowPoints(
          3, 1, 'red',
          [
            'API 2500 L', 'API 2500 R',
            'MPL-2 L', 'MPL-2 R',
            null, null, null, null, null, null, null, null,
            null, null, null, null, null, null,
            'MFC 42 L', 'MFC 42 R',
            'STUDER LINE OUT L', 'STUDER LINE OUT R',
            null, null,
          ],
          'send',
          'half',
          {
            1: { gearId: 'api-2500', gearIOId: 'api2500-out-l' },
            2: { gearId: 'api-2500', gearIOId: 'api2500-out-r' },
            3: { gearId: 'maselec-mpl2', gearIOId: 'mpl2-out-l' },
            4: { gearId: 'maselec-mpl2', gearIOId: 'mpl2-out-r' },
            21: { gearId: 'studer-269', gearIOId: 'studer-line-out' },
            22: { gearId: 'studer-269', gearIOId: 'studer-line-out' },
          },
          [1, 2, 3, 4, 21, 22]
        ),
      },
      {
        bayId: 3,
        rowNumber: 2,
        label: 'BUS COMPRESSOR / CONSOLE IN',
        labelColor: 'red',
        points: createRowPoints(
          3, 2, 'red',
          [
            'API 2500 L', 'API 2500 R',
            'MPL-2 L', 'MPL-2 R',
            null, null, null, null, null, null, null, null,
            null, null, null, null, null, null,
            'MFC 42 L', 'MFC 42 R',
            'STUDER LINE IN L', 'STUDER LINE IN R',
            null, null,
          ],
          'return',
          'half',
          {
            1: { gearId: 'api-2500', gearIOId: 'api2500-in-l' },
            2: { gearId: 'api-2500', gearIOId: 'api2500-in-r' },
            3: { gearId: 'maselec-mpl2', gearIOId: 'mpl2-in-l' },
            4: { gearId: 'maselec-mpl2', gearIOId: 'mpl2-in-r' },
            21: { gearId: 'studer-269', gearIOId: 'studer-line-in' },
            22: { gearId: 'studer-269', gearIOId: 'studer-line-in' },
          },
          [1, 2, 3, 4, 21, 22]
        ),
      },
    ],
  },

  // ============================================================
  // MIDDLE RACK - Bay 4: Digital Converters
  // ============================================================
  {
    id: 4,
    brand: 'Signex',
    label: 'Digital Converters',
    rows: [
      {
        bayId: 4,
        rowNumber: 1,
        label: 'CONVERTER OUTPUTS (DA)',
        labelColor: 'pink',
        points: createRowPoints(
          4, 1, 'pink',
          [
            'LYNX OUT 1', 'LYNX OUT 2', 'LYNX OUT 3', 'LYNX OUT 4',
            'LYNX OUT 5', 'LYNX OUT 6', 'LYNX OUT 7', 'LYNX OUT 8',
            null, null, null, null, null, null, null, null,
            'EXTERNAL AD/DA OUT L', 'EXTERNAL AD/DA OUT R',
            null, null, null, null, null, null,
          ],
          'send',
          'half',
          {
            1: { gearId: 'lynx-aurora', gearIOId: 'lynx-da' },
            2: { gearId: 'lynx-aurora', gearIOId: 'lynx-da' },
            3: { gearId: 'lynx-aurora', gearIOId: 'lynx-da' },
            4: { gearId: 'lynx-aurora', gearIOId: 'lynx-da' },
            5: { gearId: 'lynx-aurora', gearIOId: 'lynx-da' },
            6: { gearId: 'lynx-aurora', gearIOId: 'lynx-da' },
            7: { gearId: 'lynx-aurora', gearIOId: 'lynx-da' },
            8: { gearId: 'lynx-aurora', gearIOId: 'lynx-da' },
          },
          [1, 2, 3, 4, 5, 6, 7, 8]
        ),
      },
      {
        bayId: 4,
        rowNumber: 2,
        label: 'CONVERTER INPUTS (AD)',
        labelColor: 'pink',
        points: createRowPoints(
          4, 2, 'pink',
          [
            'LYNX IN 1', 'LYNX IN 2', 'LYNX IN 3', 'LYNX IN 4',
            'LYNX IN 5', 'LYNX IN 6', 'LYNX IN 7', 'LYNX IN 8',
            'BURL IN 1', 'BURL IN 2', 'BURL IN 3', 'BURL IN 4',
            'BURL IN 5', 'BURL IN 6', 'BURL IN 7', 'BURL IN 8',
            'EXTERNAL AD/DA IN L', 'EXTERNAL AD/DA IN R',
            null, null, null, null, null, null,
          ],
          'return',
          'half',
          {
            1: { gearId: 'lynx-aurora', gearIOId: 'lynx-ad' },
            9: { gearId: 'burl-converter', gearIOId: 'burl-in' },
          },
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
        ),
      },
    ],
  },

  // ============================================================
  // MIDDLE RACK - Bay 5: Crookwood Inserts
  // ============================================================
  {
    id: 5,
    brand: 'Signex',
    label: 'Crookwood Inserts',
    rows: [
      {
        bayId: 5,
        rowNumber: 1,
        label: 'CROOKWOOD INSERT SEND',
        labelColor: 'yellow',
        points: createRowPoints(
          5, 1, 'yellow',
          [
            'CW INSERT 1 L', 'CW INSERT 1 R',
            'CW INSERT 2 L', 'CW INSERT 2 R',
            'CW INSERT 3 L', 'CW INSERT 3 R',
            'CW INSERT 4 L', 'CW INSERT 4 R',
            'CW INSERT 5 L', 'CW INSERT 5 R',
            'CW INSERT 6 L', 'CW INSERT 6 R',
            'CW INSERT 7 L', 'CW INSERT 7 R',
            null, null, null, null,
            'MN/ST MFC 42 OUT L', 'MN/ST MFC 42 OUT R',
            null, null, null, null,
          ],
          'send',
          'half',
          {
            1: { gearId: 'crookwood', gearIOId: 'cw-insert-send' },
            2: { gearId: 'crookwood', gearIOId: 'cw-insert-send' },
          },
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 19, 20]
        ),
      },
      {
        bayId: 5,
        rowNumber: 2,
        label: 'CROOKWOOD INSERT RETURN',
        labelColor: 'yellow',
        points: createRowPoints(
          5, 2, 'yellow',
          [
            'CW RETURN 1 L', 'CW RETURN 1 R',
            'CW RETURN 2 L', 'CW RETURN 2 R',
            'CW RETURN 3 L', 'CW RETURN 3 R',
            'CW RETURN 4 L', 'CW RETURN 4 R',
            'CW RETURN 5 L', 'CW RETURN 5 R',
            'CW RETURN 6 L', 'CW RETURN 6 R',
            'CW RETURN 7 L', 'CW RETURN 7 R',
            null, null, null, null,
            'MN/ST MFC 42 IN L', 'MN/ST MFC 42 IN R',
            null, null, null, null,
          ],
          'return',
          'half',
          {
            1: { gearId: 'crookwood', gearIOId: 'cw-insert-return' },
            2: { gearId: 'crookwood', gearIOId: 'cw-insert-return' },
          },
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 19, 20]
        ),
      },
    ],
  },

  // ============================================================
  // MIDDLE RACK - Bay 6: Dynamics Processing
  // ============================================================
  {
    id: 6,
    brand: 'Isopatch',
    label: 'Dynamics',
    rows: [
      {
        bayId: 6,
        rowNumber: 1,
        label: 'DYNAMICS OUTPUTS',
        labelColor: 'orange',
        points: createRowPoints(
          6, 1, 'orange',
          [
            '1178 L', '1178 R',
            'Mo3a L', 'Mo3a R',
            '1176', null, // MoFET76 is mono
            '165', null, // DBX 165 is mono
            'FATSO L', 'FATSO R',
            'VARI MU L', 'VARI MU R',
            null, null, null, null, null, null, null, null, null, null, null, null,
          ],
          'send',
          'half',
          {
            1: { gearId: 'urei-1178', gearIOId: '1178-out-l' },
            2: { gearId: 'urei-1178', gearIOId: '1178-out-r' },
            3: { gearId: 'mohog-mo3a-l', gearIOId: 'mo3a-l-out' },
            4: { gearId: 'mohog-mo3a-r', gearIOId: 'mo3a-r-out' },
            5: { gearId: 'mohog-mofet76', gearIOId: 'mofet76-out' },
            7: { gearId: 'dbx-165', gearIOId: 'dbx165-out' },
            9: { gearId: 'empirical-labs-fatso', gearIOId: 'fatso-out-l' },
            10: { gearId: 'empirical-labs-fatso', gearIOId: 'fatso-out-r' },
            11: { gearId: 'manley-vari-mu', gearIOId: 'varimu-out-l' },
            12: { gearId: 'manley-vari-mu', gearIOId: 'varimu-out-r' },
          },
          [1, 2, 3, 4, 5, 7, 9, 10, 11, 12]
        ),
      },
      {
        bayId: 6,
        rowNumber: 2,
        label: 'DYNAMICS INPUTS',
        labelColor: 'orange',
        points: createRowPoints(
          6, 2, 'orange',
          [
            '1178 L', '1178 R',
            'Mo3a L', 'Mo3a R',
            '1176', null,
            '165', null,
            'FATSO L', 'FATSO R',
            'VARI MU L', 'VARI MU R',
            null, null, null, null, null, null, null, null, null, null, null, null,
          ],
          'return',
          'half',
          {
            1: { gearId: 'urei-1178', gearIOId: '1178-in-l' },
            2: { gearId: 'urei-1178', gearIOId: '1178-in-r' },
            3: { gearId: 'mohog-mo3a-l', gearIOId: 'mo3a-l-in' },
            4: { gearId: 'mohog-mo3a-r', gearIOId: 'mo3a-r-in' },
            5: { gearId: 'mohog-mofet76', gearIOId: 'mofet76-in' },
            7: { gearId: 'dbx-165', gearIOId: 'dbx165-in' },
            9: { gearId: 'empirical-labs-fatso', gearIOId: 'fatso-in-l' },
            10: { gearId: 'empirical-labs-fatso', gearIOId: 'fatso-in-r' },
            11: { gearId: 'manley-vari-mu', gearIOId: 'varimu-in-l' },
            12: { gearId: 'manley-vari-mu', gearIOId: 'varimu-in-r' },
          },
          [1, 2, 3, 4, 5, 7, 9, 10, 11, 12]
        ),
      },
    ],
  },

  // ============================================================
  // LOWER RACK - Bay 7: Prism AD/DA & Mastering
  // ============================================================
  {
    id: 7,
    brand: 'Isopatch',
    label: 'Prism & Mastering',
    rows: [
      {
        bayId: 7,
        rowNumber: 1,
        label: 'PRISM / MASTERING OUT',
        labelColor: 'pink',
        points: createRowPoints(
          7, 1, 'pink',
          [
            'PRISM AD/DA 8XR OUT 1', 'PRISM AD/DA 8XR OUT 2',
            'PRISM AD/DA 8XR OUT 3', 'PRISM AD/DA 8XR OUT 4',
            'PRISM AD/DA 8XR OUT 5', 'PRISM AD/DA 8XR OUT 6',
            'PRISM AD/DA 8XR OUT 7', 'PRISM AD/DA 8XR OUT 8',
            'DAC OUT L', 'DAC OUT R',
            'TALK', null,
            null, null, null, null, null, null, null, null, null, null, null, null,
          ],
          'send',
          'half',
          {
            1: { gearId: 'prism-8xr', gearIOId: 'prism-da-1-8' },
            2: { gearId: 'prism-8xr', gearIOId: 'prism-da-1-8' },
            3: { gearId: 'prism-8xr', gearIOId: 'prism-da-1-8' },
            4: { gearId: 'prism-8xr', gearIOId: 'prism-da-1-8' },
            5: { gearId: 'prism-8xr', gearIOId: 'prism-da-1-8' },
            6: { gearId: 'prism-8xr', gearIOId: 'prism-da-1-8' },
            7: { gearId: 'prism-8xr', gearIOId: 'prism-da-1-8' },
            8: { gearId: 'prism-8xr', gearIOId: 'prism-da-1-8' },
          },
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
        ),
      },
      {
        bayId: 7,
        rowNumber: 2,
        label: 'PRISM / MASTERING IN',
        labelColor: 'pink',
        points: createRowPoints(
          7, 2, 'pink',
          [
            'PRISM AD/DA 8XR IN 1', 'PRISM AD/DA 8XR IN 2',
            'PRISM AD/DA 8XR IN 3', 'PRISM AD/DA 8XR IN 4',
            'PRISM AD/DA 8XR IN 5', 'PRISM AD/DA 8XR IN 6',
            'PRISM AD/DA 8XR IN 7', 'PRISM AD/DA 8XR IN 8',
            'CW S1 L', 'CW S1 R',
            'CW S2 L', 'CW S2 R',
            'CW S3 L', 'CW S3 R',
            null, null, null, null, null, null, null, null, null, null,
          ],
          'return',
          'half',
          {
            1: { gearId: 'prism-8xr', gearIOId: 'prism-ad-1-8' },
            2: { gearId: 'prism-8xr', gearIOId: 'prism-ad-1-8' },
            3: { gearId: 'prism-8xr', gearIOId: 'prism-ad-1-8' },
            4: { gearId: 'prism-8xr', gearIOId: 'prism-ad-1-8' },
            5: { gearId: 'prism-8xr', gearIOId: 'prism-ad-1-8' },
            6: { gearId: 'prism-8xr', gearIOId: 'prism-ad-1-8' },
            7: { gearId: 'prism-8xr', gearIOId: 'prism-ad-1-8' },
            8: { gearId: 'prism-8xr', gearIOId: 'prism-ad-1-8' },
            9: { gearId: 'crookwood', gearIOId: 'cw-s1' },
            10: { gearId: 'crookwood', gearIOId: 'cw-s1' },
            11: { gearId: 'crookwood', gearIOId: 'cw-s2' },
            12: { gearId: 'crookwood', gearIOId: 'cw-s2' },
            13: { gearId: 'crookwood', gearIOId: 'cw-s3' },
            14: { gearId: 'crookwood', gearIOId: 'cw-s3' },
          },
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
        ),
      },
    ],
  },

  // ============================================================
  // LOWER RACK - Bay 8: Mastering EQ
  // ============================================================
  {
    id: 8,
    brand: 'Isopatch',
    label: 'Mastering EQ',
    rows: [
      {
        bayId: 8,
        rowNumber: 1,
        label: 'MASTERING EQ OUT',
        labelColor: 'blue',
        points: createRowPoints(
          8, 1, 'blue',
          [
            'MEA2 L', 'MEA2 R',
            'CURVE B L', 'CURVE B R',
            null, null, null, null, null, null, null, null,
            null, null, null, null, null, null,
            'DI OUT A', 'DI OUT B', 'DI OUT C', 'DI OUT D',
            null, null,
          ],
          'send',
          'half',
          {
            1: { gearId: 'maselec-mea2', gearIOId: 'mea2-out-l' },
            2: { gearId: 'maselec-mea2', gearIOId: 'mea2-out-r' },
            3: { gearId: 'chandler-curve-bender', gearIOId: 'curve-out-l' },
            4: { gearId: 'chandler-curve-bender', gearIOId: 'curve-out-r' },
            19: { gearId: 'palmer-audionomix', gearIOId: 'di-out' },
            20: { gearId: 'palmer-audionomix', gearIOId: 'di-out' },
            21: { gearId: 'palmer-audionomix', gearIOId: 'di-out' },
            22: { gearId: 'palmer-audionomix', gearIOId: 'di-out' },
          },
          [1, 2, 3, 4, 19, 20, 21, 22]
        ),
      },
      {
        bayId: 8,
        rowNumber: 2,
        label: 'MASTERING EQ IN',
        labelColor: 'blue',
        points: createRowPoints(
          8, 2, 'blue',
          [
            'MEA2 L', 'MEA2 R',
            'CURVE B L', 'CURVE B R',
            null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, null, null, null, null, null, null,
          ],
          'return',
          'half',
          {
            1: { gearId: 'maselec-mea2', gearIOId: 'mea2-in-l' },
            2: { gearId: 'maselec-mea2', gearIOId: 'mea2-in-r' },
            3: { gearId: 'chandler-curve-bender', gearIOId: 'curve-in-l' },
            4: { gearId: 'chandler-curve-bender', gearIOId: 'curve-in-r' },
          },
          [1, 2, 3, 4]
        ),
      },
    ],
  },
];

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

export function getAllPoints(): PatchbayPoint[] {
  const points: PatchbayPoint[] = [];
  for (const bay of patchbayBays) {
    for (const row of bay.rows) {
      points.push(...row.points);
    }
  }
  return points;
}

export function getPointById(id: string): PatchbayPoint | undefined {
  return getAllPoints().find(p => p.id === id);
}

export function getPointsByGear(gearId: string): PatchbayPoint[] {
  return getAllPoints().filter(p => p.gearId === gearId);
}

export function getPointsByBay(bayId: number): PatchbayPoint[] {
  const bay = patchbayBays.find(b => b.id === bayId);
  if (!bay) return [];
  const points: PatchbayPoint[] = [];
  for (const row of bay.rows) {
    points.push(...row.points);
  }
  return points;
}

export function getUnverifiedPoints(): PatchbayPoint[] {
  return getAllPoints().filter(p => !p.verified && p.label !== '');
}

export function getBayById(id: number): PatchbayBay | undefined {
  return patchbayBays.find(b => b.id === id);
}

export function searchPoints(query: string): PatchbayPoint[] {
  const q = query.toLowerCase();
  return getAllPoints().filter(p =>
    p.label.toLowerCase().includes(q)
  );
}
