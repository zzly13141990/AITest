import React from 'react';

interface ImagePreviewProps {
  imageUrl: string | null;
  isLoading: boolean;
  onDownload?: () => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  imageUrl,
  isLoading,
  onDownload
}) => {
  return (
    <div className="image-preview-container">
      <div className={`image-preview-box ${imageUrl ? 'has-image' : ''}`}>
        {isLoading ? (
          <LoadingState />
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt="Generated"
            className="image-preview-img"
          />
        ) : (
          <EmptyState />
        )}
      </div>

      {imageUrl && onDownload && (
        <div className="download-section">
          <button
            onClick={onDownload}
            className="download-button"
          >
            <svg
              className="download-button-icon"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            下载图片
          </button>
        </div>
      )}
    </div>
  );
};

const LoadingState: React.FC = () => (
  <div className="image-preview-loading">
    <svg
      className="loading-spinner"
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="var(--color-primary)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="60 20"
        fill="transparent"
      />
    </svg>
    <p className="image-preview-text">正在生成图片...</p>
  </div>
);

const EmptyState: React.FC = () => (
  <div className="image-preview-empty">
    <svg
      className="image-preview-icon"
      width="64"
      height="64"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--color-n300)"
      strokeWidth="1.5"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21,15 16,10 5,21" />
    </svg>
    <p className="image-preview-text">输入描述并点击生成</p>
  </div>
);
