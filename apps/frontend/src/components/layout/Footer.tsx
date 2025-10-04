'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-calm-900 text-calm-100">
      {/* メインフッターコンテンツ */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* サービス情報 */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-white">CreatorVridge</h3>
            <p className="text-calm-300 text-sm leading-relaxed mb-4">
              VTuberと絵師をマッチングする特化型プラットフォーム。
              安全で信頼性の高い環境での創造的コラボレーションを実現します。
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-calm-400 hover:text-white transition-colors" aria-label="Twitter">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="#" className="text-calm-400 hover:text-white transition-colors" aria-label="Discord">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* サービス */}
          <div>
            <h4 className="text-base font-semibold mb-4 text-white">サービス</h4>
            <ul className="space-y-2">
              <li><Link href="/matching" className="text-calm-300 hover:text-white transition-colors text-sm">マッチング</Link></li>
              <li><Link href="/projects" className="text-calm-300 hover:text-white transition-colors text-sm">プロジェクト管理</Link></li>
              <li><Link href="/portfolio" className="text-calm-300 hover:text-white transition-colors text-sm">ポートフォリオ</Link></li>
              <li><Link href="/payment" className="text-calm-300 hover:text-white transition-colors text-sm">決済・取引</Link></li>
              <li><Link href="/ai-analysis" className="text-calm-300 hover:text-white transition-colors text-sm">AI画像分析</Link></li>
              <li><Link href="/communication" className="text-calm-300 hover:text-white transition-colors text-sm">コミュニケーション</Link></li>
            </ul>
          </div>

          {/* サポート */}
          <div>
            <h4 className="text-base font-semibold mb-4 text-white">サポート</h4>
            <ul className="space-y-2">
              <li><Link href="/help" className="text-calm-300 hover:text-white transition-colors text-sm">ヘルプセンター</Link></li>
              <li><Link href="/faq" className="text-calm-300 hover:text-white transition-colors text-sm">よくある質問</Link></li>
              <li><Link href="/getting-started" className="text-calm-300 hover:text-white transition-colors text-sm">はじめかた</Link></li>
              <li><Link href="/tutorials" className="text-calm-300 hover:text-white transition-colors text-sm">チュートリアル</Link></li>
              <li><Link href="/contact" className="text-calm-300 hover:text-white transition-colors text-sm">お問い合わせ</Link></li>
              <li><Link href="/feedback" className="text-calm-300 hover:text-white transition-colors text-sm">ご意見・ご要望</Link></li>
            </ul>
          </div>

          {/* 会社情報 */}
          <div>
            <h4 className="text-base font-semibold mb-4 text-white">会社情報</h4>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-calm-300 hover:text-white transition-colors text-sm">会社概要</Link></li>
              <li><Link href="/vision" className="text-calm-300 hover:text-white transition-colors text-sm">ビジョン・ミッション</Link></li>
              <li><Link href="/team" className="text-calm-300 hover:text-white transition-colors text-sm">チーム紹介</Link></li>
              <li><Link href="/news" className="text-calm-300 hover:text-white transition-colors text-sm">ニュース・お知らせ</Link></li>
              <li><Link href="/press" className="text-calm-300 hover:text-white transition-colors text-sm">プレスリリース</Link></li>
              <li><Link href="/careers" className="text-calm-300 hover:text-white transition-colors text-sm">採用情報</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* ボトムセクション */}
      <div className="border-t border-calm-700">
        <div className="container mx-auto px-4 py-6">
          {/* 法的情報リンク */}
          <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 mb-4">
            <Link href="/terms" className="text-calm-400 hover:text-white transition-colors text-sm">
              利用規約
            </Link>
            <Link href="/privacy" className="text-calm-400 hover:text-white transition-colors text-sm">
              プライバシーポリシー
            </Link>
            <Link href="/security" className="text-calm-400 hover:text-white transition-colors text-sm">
              セキュリティポリシー
            </Link>
            <Link href="/payment-terms" className="text-calm-400 hover:text-white transition-colors text-sm">
              決済に関する特約
            </Link>
            <Link href="/commercial-law" className="text-calm-400 hover:text-white transition-colors text-sm">
              特定商取引法に基づく表記
            </Link>
            <Link href="/copyright" className="text-calm-400 hover:text-white transition-colors text-sm">
              著作権・知的財産権
            </Link>
            <Link href="/anti-social-forces" className="text-calm-400 hover:text-white transition-colors text-sm">
              反社会的勢力の排除
            </Link>
            <Link href="/sitemap" className="text-calm-400 hover:text-white transition-colors text-sm">
              サイトマップ
            </Link>
          </div>

          {/* 会社情報と著作権 */}
          <div className="flex flex-col md:flex-row justify-between items-center text-calm-400 text-sm">
            <div className="mb-2 md:mb-0">
              <p>
                運営会社: CreatorVridge株式会社 | 
                東京都渋谷区○○○ ○-○-○ | 
                電話: 03-XXXX-XXXX
              </p>
            </div>
            <div>
              <p>&copy; {currentYear} CreatorVridge Inc. All rights reserved.</p>
            </div>
          </div>

          {/* 補足情報 */}
          <div className="mt-4 pt-4 border-t border-calm-800">
            <p className="text-calm-500 text-xs text-center leading-relaxed">
              当サイトはVTuberと絵師のマッチングサービスです。金融商品取引業の登録は行っておりません。
              <br />
              決済代行サービスはStripe Inc.を利用しており、SSL暗号化通信により情報保護を行っています。
              <br />
              ※画面は開発中のものであり、実際のサービスとは異なる場合があります。
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}