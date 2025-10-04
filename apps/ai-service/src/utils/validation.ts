/**
 * 入力検証とサニタイゼーション機能
 * セキュリティ強化のための包括的な検証システム
 */

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class InputValidator {
  /**
   * ユーザーIDの検証（UUID形式）
   */
  static validateUserId(userId: string): string {
    if (!userId || typeof userId !== 'string') {
      throw new ValidationError('User ID is required and must be a string');
    }

    const trimmedUserId = userId.trim();
    
    // UUID v4 形式の検証
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(trimmedUserId)) {
      throw new ValidationError('Invalid user ID format');
    }

    return trimmedUserId;
  }

  /**
   * アートワークIDの検証
   */
  static validateArtworkId(artworkId: string): string {
    if (!artworkId || typeof artworkId !== 'string') {
      throw new ValidationError('Artwork ID is required and must be a string');
    }

    const trimmedArtworkId = artworkId.trim();
    
    // UUID v4 形式の検証
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(trimmedArtworkId)) {
      throw new ValidationError('Invalid artwork ID format');
    }

    return trimmedArtworkId;
  }

  /**
   * カテゴリの検証
   */
  static validateCategory(category?: string): string | undefined {
    if (!category) return undefined;

    if (typeof category !== 'string') {
      throw new ValidationError('Category must be a string');
    }

    const trimmedCategory = category.trim().toUpperCase();
    
    // 許可されたカテゴリのみ
    const allowedCategories = ['PAINTING', 'SCULPTURE', 'DIGITAL', 'PHOTOGRAPHY', 'ILLUSTRATION', 'MIXED_MEDIA'];
    if (!allowedCategories.includes(trimmedCategory)) {
      throw new ValidationError(`Invalid category. Allowed: ${allowedCategories.join(', ')}`);
    }

    return trimmedCategory;
  }

  /**
   * 制限数の検証
   */
  static validateLimit(limit?: number): number {
    if (limit === undefined || limit === null) {
      return 10; // デフォルト値
    }

    const numLimit = Number(limit);
    if (isNaN(numLimit) || !Number.isInteger(numLimit)) {
      throw new ValidationError('Limit must be an integer');
    }

    if (numLimit < 1) {
      throw new ValidationError('Limit must be greater than 0');
    }

    if (numLimit > 100) {
      throw new ValidationError('Limit cannot exceed 100');
    }

    return numLimit;
  }

  /**
   * スタイル配列の検証
   */
  static validateStyles(styles?: string[]): string[] | undefined {
    if (!styles) return undefined;

    if (!Array.isArray(styles)) {
      throw new ValidationError('Styles must be an array');
    }

    if (styles.length > 10) {
      throw new ValidationError('Too many styles. Maximum 10 allowed');
    }

    const validatedStyles = styles.map(style => {
      if (typeof style !== 'string') {
        throw new ValidationError('Each style must be a string');
      }

      const trimmedStyle = style.trim();
      if (trimmedStyle.length === 0) {
        throw new ValidationError('Style cannot be empty');
      }

      if (trimmedStyle.length > 50) {
        throw new ValidationError('Style name too long. Maximum 50 characters');
      }

      // 英数字、ハイフン、アンダースコアのみ許可
      if (!/^[a-zA-Z0-9_-]+$/.test(trimmedStyle)) {
        throw new ValidationError('Style contains invalid characters');
      }

      return trimmedStyle;
    });

    return validatedStyles.length > 0 ? validatedStyles : undefined;
  }

  /**
   * 価格範囲の検証
   */
  static validatePriceRange(priceRange?: { min: number; max: number }): { min: number; max: number } | undefined {
    if (!priceRange) return undefined;

    if (typeof priceRange !== 'object' || priceRange === null) {
      throw new ValidationError('Price range must be an object');
    }

    const { min, max } = priceRange;

    if (typeof min !== 'number' || typeof max !== 'number') {
      throw new ValidationError('Price range min and max must be numbers');
    }

    if (isNaN(min) || isNaN(max)) {
      throw new ValidationError('Price range values cannot be NaN');
    }

    if (min < 0 || max < 0) {
      throw new ValidationError('Price range cannot be negative');
    }

    if (min > max) {
      throw new ValidationError('Price range min cannot be greater than max');
    }

    if (max > 1000000) {
      throw new ValidationError('Price range too high. Maximum 1,000,000');
    }

    return { min, max };
  }

  /**
   * アルゴリズムタイプの検証
   */
  static validateAlgorithm(algorithm?: string): string | undefined {
    if (!algorithm) return undefined;

    if (typeof algorithm !== 'string') {
      throw new ValidationError('Algorithm must be a string');
    }

    const trimmedAlgorithm = algorithm.trim().toLowerCase();
    const allowedAlgorithms = ['hybrid', 'collaborative', 'content', 'auto'];
    
    if (!allowedAlgorithms.includes(trimmedAlgorithm)) {
      throw new ValidationError(`Invalid algorithm. Allowed: ${allowedAlgorithms.join(', ')}`);
    }

    return trimmedAlgorithm;
  }

  /**
   * レーティング値の検証（0.0 - 1.0）
   */
  static validateRating(rating: number): number {
    if (typeof rating !== 'number' || isNaN(rating)) {
      throw new ValidationError('Rating must be a valid number');
    }

    if (rating < 0.0 || rating > 1.0) {
      throw new ValidationError('Rating must be between 0.0 and 1.0');
    }

    return rating;
  }

  /**
   * フィードバックタイプの検証
   */
  static validateFeedbackType(feedbackType: string): string {
    if (!feedbackType || typeof feedbackType !== 'string') {
      throw new ValidationError('Feedback type is required and must be a string');
    }

    const trimmedType = feedbackType.trim().toLowerCase();
    const allowedTypes = ['like', 'dislike', 'favorite', 'share', 'view'];
    
    if (!allowedTypes.includes(trimmedType)) {
      throw new ValidationError(`Invalid feedback type. Allowed: ${allowedTypes.join(', ')}`);
    }

    return trimmedType;
  }

  /**
   * 推薦リクエストの包括的検証
   */
  static validateRecommendationRequest(request: any): {
    userId: string;
    limit: number;
    category?: string;
    style?: string[];
    priceRange?: { min: number; max: number };
    algorithm?: string;
  } {
    if (!request || typeof request !== 'object') {
      throw new ValidationError('Request must be a valid object');
    }

    return {
      userId: this.validateUserId(request.userId),
      limit: this.validateLimit(request.limit),
      category: this.validateCategory(request.category),
      style: this.validateStyles(request.style),
      priceRange: this.validatePriceRange(request.priceRange),
      algorithm: this.validateAlgorithm(request.algorithm)
    };
  }
}

/**
 * データサニタイゼーション機能
 */
export class DataSanitizer {
  /**
   * HTMLエスケープ
   */
  static escapeHtml(text: string): string {
    if (typeof text !== 'string') {
      return String(text);
    }

    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  /**
   * SQLインジェクション対策のための文字列サニタイズ
   */
  static sanitizeForDatabase(value: string): string {
    if (typeof value !== 'string') {
      return String(value);
    }

    // 危険な文字をエスケープ
    return value
      .replace(/'/g, "''")
      .replace(/;/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '')
      .trim();
  }

  /**
   * ログ出力用の機密情報マスキング
   */
  static maskSensitiveData(data: any): any {
    if (typeof data === 'string') {
      // ユーザーIDのマスキング（最初8文字 + ****）
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(data)) {
        return data.substring(0, 8) + '****';
      }
      
      // メールアドレスのマスキング
      if (data.includes('@')) {
        const [local, domain] = data.split('@');
        return local.substring(0, 2) + '***@' + domain;
      }
      
      return data;
    }

    if (typeof data === 'object' && data !== null) {
      const masked = { ...data };
      
      // 機密性の高いフィールドをマスキング
      const sensitiveFields = ['userId', 'email', 'password', 'token', 'apiKey'];
      for (const field of sensitiveFields) {
        if (masked[field]) {
          masked[field] = this.maskSensitiveData(masked[field]);
        }
      }
      
      return masked;
    }

    return data;
  }
}

/**
 * セキュアなエラーハンドリング
 */
export class SecurityErrorHandler {
  /**
   * 本番環境向けエラーメッセージの生成
   */
  static createSafeErrorMessage(error: Error): string {
    if (error instanceof ValidationError) {
      return error.message; // バリデーションエラーは安全なので詳細を返す
    }

    // その他のエラーは汎用メッセージ
    return 'An internal error occurred. Please try again later.';
  }

  /**
   * セキュアなログ出力
   */
  static logError(error: Error, context: string, additionalData?: any): void {
    const maskedData = additionalData ? DataSanitizer.maskSensitiveData(additionalData) : {};
    
    console.error(`[${context}] Error:`, {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      ...maskedData
    });
  }
}