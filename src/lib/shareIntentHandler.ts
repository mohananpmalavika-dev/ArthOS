/**
 * Share Intent Handler
 * 
 * Rich sharing with Web Share API, share target detection,
 * and deep linking context preservation.
 */

export interface ShareableAsset {
  title: string;
  description: string;
  type: 'assessment' | 'insight' | 'milestone' | 'comparison';
  contentId: string;

  // Visual
  imageUrl?: string;
  thumbnailUrl?: string;

  // Sharing
  url: string;            // Full shareable URL
  deepLink: string;       // arthOS:// URL

  // Access control
  isPublic: boolean;
  expiresAt?: number;
  accessToken?: string;   // For private shares
}

export interface ShareMetadata {
  sharedAt: number;
  sharedBy: string;
  sharedWith?: string[];
  channel?: string;       // 'native' | 'email' | 'link' | 'qr'
  viewCount: number;
}

class ShareIntentHandler {
  private static instance: ShareIntentHandler;
  private shareStats: Map<string, any> = new Map();

  private constructor() {
    this.registerShareTarget();
  }

  static getInstance(): ShareIntentHandler {
    if (!ShareIntentHandler.instance) {
      ShareIntentHandler.instance = new ShareIntentHandler();
    }
    return ShareIntentHandler.instance;
  }

  /**
   * Share assessment result via Web Share API or fallback
   */
  async shareAssessment(
    assessmentId: string,
    options?: { title?: string; message?: string }
  ): Promise<ShareMetadata> {
    const asset = await this.prepareShareableAsset('assessment', assessmentId);

    return this.shareAsset(asset, {
      ...options,
      title: options?.title || 'My Financial Assessment',
      message: options?.message || 'Check out my financial wellness score'
    });
  }

  /**
   * Share insight/recommendation
   */
  async shareInsight(
    insightId: string,
    _options?: { template?: 'image' | 'link' }
  ): Promise<ShareMetadata> {
    const asset = await this.prepareShareableAsset('insight', insightId);

    return this.shareAsset(asset, {
      title: 'Financial Insight from ARTH.OS',
      message: 'An interesting financial recommendation'
    });
  }

  /**
   * Share financial milestone
   */
  async shareMilestone(milestoneId: string): Promise<ShareMetadata> {
    const asset = await this.prepareShareableAsset('milestone', milestoneId);

    return this.shareAsset(asset, {
      title: 'Financial Milestone',
      message: 'I achieved a financial milestone!'
    });
  }

  /**
   * Generate shareable graphic (assessment summary card)
   */
  async generateShareableGraphic(_assessmentId: string): Promise<Blob> {
    // In a real implementation, this would:
    // 1. Fetch assessment data
    // 2. Generate SVG or canvas image
    // 3. Return as Blob
    
    // Placeholder: return a simple canvas-based image
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 630;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context unavailable');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 630);

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('My Financial Assessment', 600, 250);

    ctx.font = '32px Arial';
    ctx.fillText('View on ARTH.OS', 600, 350);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob || new Blob());
      });
    });
  }

  /**
   * Generate QR code for mobile scanning
   */
  async generateQrCode(url: string, size: number = 200): Promise<string> {
    // Simple QR code generation using API (in production, use qrcode.js library)
    // Format: https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://example.com
    
    const encodedUrl = encodeURIComponent(url);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedUrl}`;

    return qrUrl;
  }

  /**
   * Handle incoming shared link (deep link processing)
   */
  async handleIncomingShare(deepLink: string): Promise<ShareableAsset> {
    // Parse deep link: arthOS://[type]/[id]?token=[accessToken]
    // Example: arthOS://assessment/abc123?token=xyz

    const url = new URL(deepLink.replace('arthOS://', 'https://temp.local/'));
    const [, type, id] = url.pathname.split('/');
    const accessToken = url.searchParams.get('token');

    // Validate share access
    if (!accessToken) {
      throw new Error('Share token required for private assets');
    }

    // Fetch shared asset from server
    const response = await fetch(`/api/share/${type}/${id}`, {
      headers: {
        'X-Share-Token': accessToken
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch shared asset');
    }

    const asset = await response.json();

    // Increment view count
    this.shareStats.set(id, {
      ...(this.shareStats.get(id) || {}),
      viewCount: (this.shareStats.get(id)?.viewCount || 0) + 1
    });

    return asset;
  }

  /**
   * Get share statistics
   */
  async getShareStats(contentId: string): Promise<{
    viewCount: number;
    clickCount: number;
    shareCount: number;
    topChannels: string[];
  }> {
    const stats = this.shareStats.get(contentId) || {
      viewCount: 0,
      clickCount: 0,
      shareCount: 0,
      topChannels: []
    };

    return stats;
  }

  /**
   * Register as Web Share Target
   */
  registerShareTarget(): void {
    // This is handled via manifest.json
    // Inclusion here for documentation purposes
    console.info('Share target registered via manifest.json');
  }

  /**
   * Revoke share access (private shares only)
   */
  async revokeShare(contentId: string, accessToken: string): Promise<void> {
    const response = await fetch(`/api/share/${contentId}/revoke`, {
      method: 'POST',
      headers: {
        'X-Share-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to revoke share');
    }

    console.info('Share revoked', { contentId });
  }

  // ============ Private helpers ============

  private async shareAsset(
    asset: ShareableAsset,
    options: { title?: string; message?: string }
  ): Promise<ShareMetadata> {
    const metadata: ShareMetadata = {
      sharedAt: Date.now(),
      sharedBy: 'current_user', // Would come from auth context
      channel: 'link',
      viewCount: 0
    };

    // Try Web Share API first
    if ('share' in navigator && navigator.canShare) {
      try {
        const shareData = {
          title: options.title || asset.title,
          text: options.message || asset.description,
          url: asset.url
        };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          metadata.channel = 'native';
          console.info('Asset shared via native share', { assetId: asset.contentId });
          return metadata;
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Native share failed:', error);
        }
      }
    }

    // Fallback: show share options UI
    await this.showShareUI(asset, metadata);

    return metadata;
  }

  private async prepareShareableAsset(
    type: 'assessment' | 'insight' | 'milestone' | 'comparison',
    contentId: string
  ): Promise<ShareableAsset> {
    const baseUrl = window.location.origin;
    const accessToken = this.generateAccessToken();

    return {
      title: `My ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      description: `Check out my financial ${type} on ARTH.OS`,
      type,
      contentId,
      imageUrl: await this.generateShareableGraphic(contentId)
        .then((blob) => URL.createObjectURL(blob))
        .catch(() => undefined),
      url: `${baseUrl}/share/${type}/${contentId}?token=${accessToken}`,
      deepLink: `arthOS://${type}/${contentId}?token=${accessToken}`,
      isPublic: false,
      accessToken,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
    };
  }

  private async showShareUI(asset: ShareableAsset, metadata: ShareMetadata): Promise<void> {
    // Show modal/panel with share options
    // 1. Copy link button
    // 2. QR code
    // 3. Email form
    // 4. Social links (pre-filled)

    const event = new CustomEvent('arth:show-share-dialog', {
      detail: {
        asset,
        onCopyLink: async () => {
          await navigator.clipboard.writeText(asset.url);
          metadata.channel = 'link';
        },
        onEmail: (email: string) => {
          window.location.href = `mailto:${email}?subject=${encodeURIComponent(asset.title)}&body=${encodeURIComponent(asset.url)}`;
          metadata.channel = 'email';
        },
        onQrCode: async () => {
          const qrUrl = await this.generateQrCode(asset.url);
          metadata.channel = 'qr';
          window.open(qrUrl, '_blank');
        }
      }
    });

    window.dispatchEvent(event);
  }

  private generateAccessToken(): string {
    // Simple token generation (in production, use cryptographically secure method)
    return Array.from(globalThis.crypto.getRandomValues(new Uint8Array(16)))
      .map((byte: number) => byte.toString(16).padStart(2, '0'))
      .join('');
  }
}

/**
 * Global singleton getter
 */
export function getShareIntentHandler(): ShareIntentHandler {
  return ShareIntentHandler.getInstance();
}

export default ShareIntentHandler;
