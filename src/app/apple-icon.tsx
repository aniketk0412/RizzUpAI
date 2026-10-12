import { ImageResponse } from 'next/og';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #1A1513 0%, #0C0A09 100%)',
          borderRadius: '40px',
        }}
      >
        <svg width="124" height="124" viewBox="0 0 64 64" fill="none">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M32 10C19.297 10 9 18.753 9 29.55C9 34.71 11.355 39.402 15.208 42.903C15.75 43.396 15.978 44.158 15.754 44.858L13.393 52.214C12.988 53.476 14.249 54.589 15.455 54.04L23.778 50.257C24.335 50.003 24.967 49.944 25.565 50.075C27.628 50.527 29.783 50.768 32 50.768C44.703 50.768 55 42.015 55 31.218C55 20.42 44.703 10 32 10ZM34.99 17.82C35.588 17.038 36.83 17.544 36.692 18.522L35.393 27.48H41.66C42.557 27.48 43.063 28.503 42.511 29.216L29.01 46.57C28.412 47.352 27.17 46.846 27.308 45.868L28.607 36.91H22.34C21.443 36.91 20.937 35.887 21.489 35.174L34.99 17.82Z"
            fill="#FC4C2B"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
