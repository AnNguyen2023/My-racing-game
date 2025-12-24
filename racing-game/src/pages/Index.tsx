import { RacingGame } from '@/components/game/RacingGame';
import { Helmet } from 'react-helmet';

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Đua Xe Bắn Súng - Săn 10 Ngôi Sao ⭐</title>
        <meta name="description" content="Game đua xe bắn súng với hiệu ứng nổ đẹp mắt. Điều khiển xe, bắn hạ kẻ địch và thu thập 10 ngôi sao để chiến thắng!" />
      </Helmet>
      
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-display text-primary text-glow-cyan mb-2">
            Máy bay Chiến Đấu
          </h1>
          <p className="text-lg text-accent font-display">
            SĂN SAO ⭐⭐⭐
          </p>
        </div>

        {/* Game container */}
        <div className="relative rounded-xl overflow-hidden neon-border">
          <RacingGame />
        </div>

        {/* Mobile controls hint */}
        <p className="text-sm text-muted-foreground mt-4 text-center">
          Sử dụng bàn phím để điều khiển • Nhấn Enter để bắt đầu
        </p>
      </div>
    </>
  );
};

export default Index;
