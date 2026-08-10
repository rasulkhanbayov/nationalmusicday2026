/**
 * Commontone brand marks, vectorised from the supplied logo artwork.
 *
 * The source files (images/logo.jpeg, images/circle_logo.jpeg) are JPEGs with a
 * white background and near-black lettering — unusable directly on the site's
 * dark navy chrome. These paths were traced from that artwork so the mark is
 * transparent, sharp at any size, and can take its colour from context: the
 * "common" half inherits currentColor while "tone" keeps the brand gold.
 *
 * viewBox matches the artwork's wordmark bounding box (1013 x 95).
 */

const GOLD = "#c9a14a";

const COMMON_PATH =
  "M 684.0 64.5 L 682.5 15.0 L 684.0 2.5 L 684.0 64.5 Z M 47.0 93.5 L 30.0 93.5 L 18.0 88.5 L 8.5 81.0 L -0.5 63.0 L -0.5 48.0 L 4.5 35.0 L 14.0 24.5 L 29.0 17.5 L 43.0 16.5 L 54.0 19.5 L 64.0 25.5 L 73.5 38.0 L 73.0 40.5 L 61.0 40.5 L 46.0 31.5 L 36.0 30.5 L 23.0 35.5 L 14.5 47.0 L 14.5 64.0 L 19.5 72.0 L 29.0 78.5 L 45.0 79.5 L 58.0 71.5 L 73.5 72.0 L 65.0 84.5 L 58.0 89.5 L 47.0 93.5 Z M 134.0 94.5 L 125.0 93.5 L 112.0 88.5 L 102.5 80.0 L 94.5 63.0 L 94.5 48.0 L 101.5 32.0 L 112.0 22.5 L 130.0 16.5 L 143.0 17.5 L 160.0 26.5 L 167.5 36.0 L 172.5 50.0 L 171.5 66.0 L 163.5 81.0 L 151.0 90.5 L 134.0 94.5 Z M 320.0 91.5 L 306.5 91.0 L 306.5 51.0 L 304.5 43.0 L 297.0 34.5 L 285.0 30.5 L 277.0 31.5 L 271.0 34.5 L 263.5 44.0 L 262.0 91.5 L 248.5 91.0 L 248.5 46.0 L 240.0 34.5 L 229.0 30.5 L 220.0 31.5 L 208.5 40.0 L 205.5 48.0 L 205.5 91.0 L 192.0 91.5 L 191.5 46.0 L 193.5 39.0 L 197.5 32.0 L 206.0 23.5 L 219.0 17.5 L 228.0 16.5 L 239.0 18.5 L 250.0 24.5 L 256.0 30.5 L 264.0 22.5 L 276.0 17.5 L 286.0 16.5 L 299.0 19.5 L 312.5 30.0 L 319.5 44.0 L 320.0 91.5 Z M 469.0 91.5 L 455.5 91.0 L 454.5 44.0 L 452.5 40.0 L 445.0 33.5 L 435.0 30.5 L 422.0 33.5 L 417.5 37.0 L 412.5 46.0 L 412.0 91.5 L 398.5 91.0 L 397.5 44.0 L 395.5 40.0 L 388.0 33.5 L 377.0 30.5 L 367.0 32.5 L 358.5 40.0 L 355.5 46.0 L 354.5 55.0 L 355.5 90.0 L 354.0 91.5 L 342.0 91.5 L 340.5 90.0 L 341.5 45.0 L 343.5 38.0 L 354.0 24.5 L 368.0 17.5 L 378.0 16.5 L 391.0 19.5 L 397.0 22.5 L 405.0 30.5 L 417.0 20.5 L 425.0 17.5 L 434.0 16.5 L 448.0 19.5 L 455.0 23.5 L 463.5 32.0 L 468.5 42.0 L 469.0 91.5 Z M 530.0 94.5 L 514.0 91.5 L 504.0 85.5 L 494.5 74.0 L 489.5 59.0 L 490.5 46.0 L 496.5 33.0 L 509.0 21.5 L 524.0 16.5 L 535.0 16.5 L 552.0 23.5 L 564.5 38.0 L 568.5 53.0 L 567.5 64.0 L 559.5 80.0 L 553.0 86.5 L 544.0 91.5 L 530.0 94.5 Z M 659.0 91.5 L 645.5 91.0 L 644.5 45.0 L 640.5 38.0 L 635.0 33.5 L 626.0 30.5 L 616.0 31.5 L 610.0 34.5 L 603.5 42.0 L 601.5 48.0 L 601.5 91.0 L 587.5 91.0 L 588.5 43.0 L 593.5 32.0 L 602.0 23.5 L 615.0 17.5 L 632.0 17.5 L 640.0 20.5 L 652.5 31.0 L 659.5 48.0 L 659.0 91.5 Z M 140.5 79.0 L 148.0 75.5 L 154.5 69.0 L 158.5 58.0 L 157.5 48.0 L 153.5 40.0 L 147.0 34.5 L 135.0 30.5 L 126.0 31.5 L 117.0 36.5 L 111.5 43.0 L 108.5 51.0 L 109.5 64.0 L 113.5 71.0 L 124.0 78.5 L 140.5 79.0 Z M 535.5 79.0 L 545.0 74.5 L 551.5 67.0 L 553.5 61.0 L 553.5 49.0 L 549.5 41.0 L 544.0 35.5 L 537.0 31.5 L 526.0 30.5 L 517.0 33.5 L 508.5 41.0 L 504.5 49.0 L 504.5 61.0 L 507.5 68.0 L 514.0 75.5 L 522.0 79.5 L 535.5 79.0 Z M 949.0 63.5 L 949.0 60.5 L 1011.5 60.0 L 1011.0 61.5 L 951.0 61.5 L 949.0 63.5 Z";

const TONE_PATH =
  "M 727.0 92.5 L 710.0 92.5 L 703.0 90.5 L 689.5 79.0 L 686.5 73.0 L 684.5 65.0 L 685.0 2.5 L 697.5 3.0 L 698.0 20.5 L 723.5 21.0 L 724.5 32.0 L 723.0 33.5 L 697.5 34.0 L 697.5 67.0 L 701.5 74.0 L 710.0 79.5 L 724.0 79.5 L 727.0 92.5 Z M 789.0 93.5 L 773.0 92.5 L 762.0 87.5 L 752.5 79.0 L 745.5 65.0 L 745.5 46.0 L 751.5 33.0 L 763.0 22.5 L 777.0 17.5 L 791.0 17.5 L 805.0 23.5 L 814.5 33.0 L 821.5 48.0 L 821.5 63.0 L 815.5 77.0 L 803.0 88.5 L 789.0 93.5 Z M 912.0 91.5 L 901.0 91.5 L 899.5 90.0 L 899.5 46.0 L 897.5 41.0 L 889.5 34.0 L 889.0 31.5 L 882.0 30.5 L 868.0 31.5 L 857.5 40.0 L 854.5 50.0 L 854.5 91.0 L 843.0 91.5 L 841.5 90.0 L 841.5 48.0 L 847.5 33.0 L 852.0 27.5 L 858.0 22.5 L 868.0 18.5 L 883.0 17.5 L 893.0 20.5 L 905.5 30.0 L 910.5 39.0 L 913.5 51.0 L 913.5 87.0 L 912.0 91.5 Z M 978.0 93.5 L 967.0 93.5 L 950.0 86.5 L 939.5 75.0 L 934.5 62.0 L 934.5 48.0 L 940.5 34.0 L 950.0 24.5 L 967.0 17.5 L 987.0 19.5 L 997.0 25.5 L 1004.5 33.0 L 1008.5 40.0 L 1011.5 51.0 L 1011.5 59.0 L 1010.0 60.5 L 948.5 61.0 L 953.5 73.0 L 963.0 79.5 L 983.0 79.5 L 992.0 72.5 L 1005.0 72.5 L 1006.5 74.0 L 1001.5 82.0 L 996.0 86.5 L 987.0 91.5 L 978.0 93.5 Z M 787.5 80.0 L 793.0 79.5 L 805.5 68.0 L 808.5 60.0 L 807.5 47.0 L 803.5 40.0 L 793.0 31.5 L 773.0 31.5 L 767.0 35.5 L 759.5 45.0 L 757.5 52.0 L 758.5 63.0 L 761.5 70.0 L 772.0 78.5 L 780.0 80.5 L 787.5 80.0 Z M 997.5 47.0 L 993.5 40.0 L 986.0 34.5 L 985.0 31.5 L 978.0 30.5 L 962.0 31.5 L 953.5 38.0 L 949.5 45.0 L 950.0 47.5 L 997.5 47.0 Z";

/** Full "commontone" wordmark. Sized by the caller via className (height). */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1013 95"
      className={className}
      role="img"
      aria-label="Commontone"
    >
      <path d={COMMON_PATH} fill="currentColor" fillRule="evenodd" />
      <path d={TONE_PATH} fill={GOLD} fillRule="evenodd" />
    </svg>
  );
}

/**
 * The circular mark's waveform — five rounded bars, symmetric about the
 * centre (heights measured from the artwork: 34/83/128/83/34). Used for the
 * favicon, where the wordmark inside the circle would be illegible.
 */
export function BrandWaveform({ className }: { className?: string }) {
  const bars = [34, 83, 128, 83, 34];
  const w = 15;
  const pitch = 33;
  return (
    <svg
      viewBox="0 0 146 128"
      className={className}
      role="img"
      aria-label="Commontone"
    >
      {bars.map((h, i) => (
        <rect
          key={i}
          x={i * pitch}
          y={(128 - h) / 2}
          width={w}
          height={h}
          rx={w / 2}
          fill={GOLD}
        />
      ))}
    </svg>
  );
}
