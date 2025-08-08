import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Wifi, WifiOff, Zap, Timer, Volume2 } from 'lucide-react';

interface SpeedTier {
  minSpeed: number;
  maxSpeed: number;
  comment: string;
  audioSrc: string;
  color: string;
  icon: string;
}

const speedTiers: SpeedTier[] = [
  {
    minSpeed: 0,
    maxSpeed: 1,
    comment: "Are you serious right now?",
    audioSrc: "https://www.myinstants.com/media/sounds/dial-up-modem.mp3",
    color: "text-destructive",
    icon: "💀"
  },
  {
    minSpeed: 1,
    maxSpeed: 2,
    comment: "My grandma's dial-up was faster.",
    audioSrc: "https://www.myinstants.com/media/sounds/sad-trombone.mp3",
    color: "text-destructive",
    icon: "😴"
  },
  {
    minSpeed: 2,
    maxSpeed: 5,
    comment: "It's... acceptable.",
    audioSrc: "https://www.myinstants.com/media/sounds/wow_9.mp3",
    color: "text-warning",
    icon: "😐"
  },
  {
    minSpeed: 5,
    maxSpeed: 20,
    comment: "Okay, now we're talking!",
    audioSrc: "https://www.myinstants.com/media/sounds/nice-shot.mp3",
    color: "text-success",
    icon: "😊"
  },
  {
    minSpeed: 20,
    maxSpeed: Infinity,
    comment: "UNLIMITED POWER!",
    audioSrc: "https://www.myinstants.com/media/sounds/holy-moly-vine-sound-effect.mp3",
    color: "text-primary",
    icon: "🚀"
  }
];

const SpeedMonitor = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState<number | null>(null);
  const [lastComment, setLastComment] = useState("Ready to roast your Wi-Fi?");
  const [timeLeft, setTimeLeft] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [currentIcon, setCurrentIcon] = useState("🌐");

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const checkInterval = 30 * 1000; // 30 seconds
  const imageURL = 'https://placehold.co/1000x1000/000000/FFFFFF?text=Test-File';
  const imageSizeInBytes = 1000 * 1000;

  const findTierForSpeed = (speedMbps: number): SpeedTier | null => {
    return speedTiers.find(tier => speedMbps >= tier.minSpeed && speedMbps < tier.maxSpeed) || null;
  };

  const playMemeAudio = (speedMbps: number) => {
    const tier = findTierForSpeed(speedMbps);
    if (!tier) {
      console.warn(`No audio tier found for speed: ${speedMbps} Mbps`);
      setLastComment("No comment for this speed.");
      setCurrentIcon("❓");
      return;
    }

    setLastComment(tier.comment);
    setCurrentIcon(tier.icon);

    if (tier.audioSrc) {
      const audio = new Audio(tier.audioSrc);
      audio.play().catch(error => {
        console.error("Error playing audio:", error);
        setLastComment("Could not play audio. Please click the page and try again.");
      });
    }
  };

  const measureSpeed = async () => {
    try {
      setIsLoading(true);
      const startTime = new Date().getTime();
      const response = await fetch(imageURL + '&t=' + startTime);
      await response.blob();
      const endTime = new Date().getTime();
      
      const durationInSeconds = (endTime - startTime) / 1000;

      if (durationInSeconds < 0.1) {
        console.warn("Download was too fast to measure accurately. Assuming very high speed.");
        updateUI(500);
        return;
      }
      
      const speedBps = (imageSizeInBytes * 8) / durationInSeconds;
      const speedMbps = Number((speedBps / (1024 * 1024)).toFixed(2));
      updateUI(speedMbps);

    } catch (error) {
      console.error("Error measuring speed:", error);
      setCurrentSpeed(0);
      setLastComment("Connection error - check your internet!");
      setCurrentIcon("🔴");
      playMemeAudio(0);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUI = (speedMbps: number) => {
    setCurrentSpeed(speedMbps);
    playMemeAudio(speedMbps);
  };

  const startCountdown = () => {
    let timeLeft = checkInterval / 1000;
    const updateTimer = () => {
      setTimeLeft(timeLeft);
      timeLeft--;
      if (timeLeft < 0) {
        timeLeft = (checkInterval / 1000) - 1;
      }
    };
    updateTimer();
    countdownRef.current = setInterval(updateTimer, 1000);
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
    setLastComment("Starting speed check...");
    setCurrentIcon("🔄");
    measureSpeed();
    intervalRef.current = setInterval(measureSpeed, checkInterval);
    startCountdown();
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    intervalRef.current = null;
    countdownRef.current = null;
    setCurrentSpeed(null);
    setLastComment("Monitoring paused.");
    setCurrentIcon("⏸️");
    setTimeLeft(30);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getSpeedColor = (speed: number | null) => {
    if (speed === null) return "text-muted-foreground";
    const tier = findTierForSpeed(speed);
    return tier?.color || "text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 bg-card/80 backdrop-blur-sm border-border/50 shadow-card">
        <div className="text-center space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-gradient">
              Internet Speed Meme Notifier
            </h1>
            <p className="text-muted-foreground text-lg">
              I'll check your internet speed every 30 seconds and roast your connection.
            </p>
          </div>

          {!isMonitoring ? (
            /* Start Screen */
            <div className="space-y-8">
              <Card className="bg-muted/30 p-6 border-border/30">
                <div className="space-y-4">
                  <div className="text-6xl float">{currentIcon}</div>
                  <h2 className="text-xl font-bold text-foreground">Ready to Roast Your Wi-Fi?</h2>
                  <p className="text-muted-foreground">
                    Click start to begin the monitoring and prepare for some spicy comments.
                  </p>
                </div>
              </Card>
              
              <Button 
                onClick={startMonitoring}
                size="lg"
                className="bg-gradient-speed hover:bg-gradient-speed/90 text-primary-foreground font-bold py-6 px-8 text-xl transition-smooth shadow-cyber hover:shadow-glow"
              >
                <Zap className="mr-2 h-6 w-6" />
                Start Monitoring
              </Button>
            </div>
          ) : (
            /* Monitoring Screen */
            <div className="space-y-8">
              {/* Status Indicator */}
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 bg-success rounded-full pulse-glow"></div>
                  <span className="text-success text-lg font-medium">Monitoring Active</span>
                  <Wifi className="h-5 w-5 text-success" />
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Timer className="h-4 w-4" />
                <span>Next check in {formatTime(timeLeft)}</span>
              </div>

              {/* Speed Display */}
              <Card className="bg-gradient-to-r from-muted/20 to-muted/10 p-8 border-border/30">
                <div className="space-y-4">
                  <p className="text-muted-foreground text-sm uppercase tracking-widest">
                    Last Measured Speed
                  </p>
                  <div className="flex items-baseline justify-center">
                    <span className={`text-6xl font-bold transition-smooth ${getSpeedColor(currentSpeed)}`}>
                      {isLoading ? (
                        <span className="animate-pulse">...</span>
                      ) : currentSpeed !== null ? (
                        currentSpeed
                      ) : (
                        "--"
                      )}
                    </span>
                    <span className="text-2xl text-muted-foreground ml-2">Mbps</span>
                  </div>
                </div>
              </Card>

              {/* Comment Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <p className="text-muted-foreground text-sm uppercase tracking-widest">
                    Last Roast
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl">{currentIcon}</span>
                  <p className="text-lg text-primary italic font-medium">
                    "{lastComment}"
                  </p>
                </div>
              </div>

              <Button 
                onClick={stopMonitoring}
                variant="destructive"
                size="lg"
                className="mt-8 font-bold py-3 px-6 transition-smooth"
              >
                <WifiOff className="mr-2 h-5 w-5" />
                Stop Monitoring
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SpeedMonitor;