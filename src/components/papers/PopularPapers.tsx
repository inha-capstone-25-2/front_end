import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { UnifiedPaperCard } from './UnifiedPaperCard';

const popularPapers = [
  {
    id: 1,
    title: "Attention Is All You Need: Transformer 모델의 혁신적 접근",
    authors: "Vaswani, A., et al.",
    pages: "pp. 5998-6008",
    publisher: "NeurIPS 2017",
    summary: "순환 신경망 없이 어텐션 메커니즘만으로 구성된 새로운 신경망 아키텍처 Transformer를 제안하여 자연어 처리 분야의 패러다임을 변화시킨 논문"
  },
  {
    id: 2,
    title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
    authors: "Devlin, J., Chang, M. W., et al.",
    pages: "pp. 4171-4186",
    publisher: "NAACL 2019",
    summary: "양방향 Transformer를 사전 학습하여 다양한 자연어 처리 작업에서 최고 성능을 달성한 모델"
  },
  {
    id: 3,
    title: "Deep Residual Learning for Image Recognition",
    authors: "He, K., Zhang, X., et al.",
    pages: "pp. 770-778",
    publisher: "CVPR 2016",
    summary: "잔차 학습 프레임워크를 통해 매우 깊은 신경망을 효과적으로 학습할 수 있게 한 ResNet 아키텍처 제안"
  },
  {
    id: 4,
    title: "Generative Adversarial Networks",
    authors: "Goodfellow, I., Pouget-Abadie, J., et al.",
    pages: "pp. 2672-2680",
    publisher: "NeurIPS 2014",
    summary: "생성자와 판별자가 경쟁하며 학습하는 새로운 생성 모델 프레임워크인 GAN을 제안"
  },
  {
    id: 5,
    title: "Adam: A Method for Stochastic Optimization",
    authors: "Kingma, D. P., Ba, J.",
    pages: "pp. 1-15",
    publisher: "ICLR 2015",
    summary: "적응적 학습률을 사용하는 효율적인 확률적 최적화 알고리즘으로, 딥러닝에서 가장 널리 사용되는 옵티마이저"
  }
];

const recentPapers = [
  {
    id: 6,
    title: "GPT-4 Technical Report: Large Multimodal Models",
    authors: "OpenAI Team",
    pages: "pp. 1-100",
    publisher: "arXiv 2023",
    summary: "텍스트와 이미지를 모두 처리할 수 있는 대규모 멀티모달 언어 모델의 기술적 세부사항 및 성능 평가"
  },
  {
    id: 7,
    title: "Segment Anything: A Foundation Model for Image Segmentation",
    authors: "Kirillov, A., et al.",
    pages: "pp. 4015-4026",
    publisher: "ICCV 2023",
    summary: "프롬프트 기반으로 이미지의 모든 객체를 분할할 수 있는 범용 이미지 분할 모델 SAM 제안"
  },
  {
    id: 8,
    title: "LLaMA: Open and Efficient Foundation Language Models",
    authors: "Touvron, H., et al.",
    pages: "pp. 1-27",
    publisher: "arXiv 2023",
    summary: "공개적으로 사용 가능한 데이터로만 학습된 효율적인 대규모 언어 모델 LLaMA 소개"
  },
  {
    id: 9,
    title: "Diffusion Models Beat GANs on Image Synthesis",
    authors: "Dhariwal, P., Nichol, A.",
    pages: "pp. 8780-8794",
    publisher: "NeurIPS 2021",
    summary: "확산 모델이 이미지 생성 품질에서 GAN을 능가할 수 있음을 실증적으로 증명한 연구"
  },
  {
    id: 10,
    title: "CLIP: Learning Transferable Visual Models From Natural Language Supervision",
    authors: "Radford, A., et al.",
    pages: "pp. 8748-8763",
    publisher: "ICML 2021",
    summary: "자연어 설명을 통해 이미지를 이해하는 멀티모달 학습 접근법으로, 제로샷 이미지 분류에서 우수한 성능 달성"
  }
];

interface PopularPapersProps {
  bookmarkedPaperIds?: number[];
  onToggleBookmark?: (paperId: string | number) => void;
  onPaperClick?: (paperId: string | number) => void;
}

export function PopularPapers({ bookmarkedPaperIds = [], onToggleBookmark, onPaperClick }: PopularPapersProps) {
  const [activeTab, setActiveTab] = useState<'popular' | 'recent'>('popular');

  const displayPapers = activeTab === 'popular' ? popularPapers : recentPapers;

  return (
    <section className="w-full py-16 md:py-20 bg-white">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-10">
        {/* Header with Title and Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-7 w-7" style={{ color: '#4FA3D1' }} />
            <h2 className="text-[28px]">인기 논문</h2>
          </div>

          {/* Tabs - Right Aligned */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('popular')}
              className={`px-6 py-2 rounded-full transition-colors ${
                activeTab === 'popular'
                  ? 'text-white'
                  : 'bg-[#F1F1F1] text-gray-700 hover:bg-gray-300'
              }`}
              style={activeTab === 'popular' ? { backgroundColor: '#215285' } : {}}
            >
              인기순
            </button>
            <button
              onClick={() => setActiveTab('recent')}
              className={`px-6 py-2 rounded-full transition-colors ${
                activeTab === 'recent'
                  ? 'text-white'
                  : 'bg-[#F1F1F1] text-gray-700 hover:bg-gray-300'
              }`}
              style={activeTab === 'recent' ? { backgroundColor: '#215285' } : {}}
            >
              최신순
            </button>
          </div>
        </div>

        {/* Paper List - Single Column */}
        <div className="space-y-4">
          {displayPapers.map((paper) => (
            <UnifiedPaperCard
              key={paper.id}
              paperId={paper.id}
              title={paper.title}
              authors={paper.authors}
              pages={paper.pages}
              publisher={paper.publisher}
              summary={paper.summary}
              isBookmarked={bookmarkedPaperIds.includes(paper.id)}
              onToggleBookmark={onToggleBookmark}
              onPaperClick={onPaperClick}
              variant="list"
              showSummary={true}
              showBookmark={!!onToggleBookmark}
            />
          ))}
        </div>
      </div>
    </section>
  );
}