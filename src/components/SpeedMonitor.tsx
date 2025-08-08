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
    maxSpeed: 3,
    comment: "Are you serious right now?",
    audioSrc: "/sounds/error.mp3",
    color: "text-destructive",
    icon: "💀"
  },
  {
    minSpeed: 3,
    maxSpeed: 5,
    comment: "My grandma's dial-up was faster.",
    audioSrc: "/sounds/slow.mp3",
    color: "text-destructive",
    icon: "😴"
  },
  {
    minSpeed: 5,
    maxSpeed: 10,
    comment: "It's... acceptable.",
    audioSrc: "/sounds/okay.mp3",
    color: "text-warning",
    icon: "😐"
  },
  {
    minSpeed: 10,
    maxSpeed: 15,
    comment: "Okay, now we're talking!",
    audioSrc: "/sounds/good.mp3",
    color: "text-success",
    icon: "😊"
  },
  {
    minSpeed: 15,
    maxSpeed: Infinity,
    comment: "UNLIMITED POWER!",
    audioSrc: "/sounds/unlimited.mp3",
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
  const [speedHistory, setSpeedHistory] = useState<number[]>([]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const checkInterval = 30 * 1000; // 30 seconds

  // FIXED: Use multiple test files for better accuracy
  const testFiles = [
    { url: 'https://httpbin.org/bytes/500000', size: 500000 }, // 500KB
    { url: 'https://httpbin.org/bytes/1000000', size: 1000000 }, // 1MB
    { url: 'https://httpbin.org/bytes/2000000', size: 2000000 }, // 2MB
  ];

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
      audio.volume = 0.7;
      audio.preload = 'auto';
      
      audio.play().catch(err => {
        console.warn(`Audio playback failed for ${tier.audioSrc}:`, err.message);
        console.warn('Please ensure you have valid MP3 files in the public/sounds/ folder');
      });
    }
  };

  // FIXED: More accurate speed measurement with multiple tests
  const measureSingleSpeed = async (testFile: { url: string; size: number }): Promise<number> => {
    const cacheBuster = `?t=${Date.now()}&r=${Math.random()}`;
    const url = `${testFile.url}${cacheBuster}`;
    
    // FIXED: Use performance.now() for more accurate timing
    const startTime = performance.now();
    
    const response = await fetch(url, { 
      cache: 'no-store',
      method: 'GET'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    // Read the response completely
    await response.blob();
    const endTime = performance.now();
    
    const durationInSeconds = (endTime - startTime) / 1000;
    
    // FIXED: Prevent division by very small numbers
    if (durationInSeconds < 0.01) {
      return 1000; // Return a high speed if too fast to measure
    }
    
    // Calculate speed in bits per second, then convert to Mbps
    const speedBps = (testFile.size * 8) / durationInSeconds;
    return speedBps / 1_000_000; // Convert to Mbps
  };

  // FIXED: Average multiple measurements for accuracy
  const measureSpeed = async () => {
    try {
      setIsLoading(true);
      const speeds: number[] = [];
      
      // Run tests with different file sizes
      for (const testFile of testFiles) {
        try {
          const speed = await measureSingleSpeed(testFile);
          speeds.push(speed);
        } catch (error) {
          console.warn(`Test failed for ${testFile.url}:`, error);
          // Continue with other tests
        }
      }
      
      if (speeds.length === 0) {
        throw new Error('All speed tests failed');
      }
      
      // FIXED: Calculate median instead of average to reduce outlier impact
      speeds.sort((a, b) => a - b);
      const medianSpeed = speeds.length % 2 === 0 
        ? (speeds[speeds.length / 2 - 1] + speeds[speeds.length / 2]) / 2
        : speeds[Math.floor(speeds.length / 2)];
      
      const finalSpeed = Number(medianSpeed.toFixed(2));
      
      // FIXED: Keep speed history for better accuracy over time
      setSpeedHistory(prev => {
        const newHistory = [...prev, finalSpeed].slice(-10); // Keep last 10 measurements
        return newHistory;
      });
      
      updateUI(finalSpeed);

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

  // FIXED: Alternative method using XMLHttpRequest for better control
  const measureSpeedXHR = async (): Promise<number> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const testUrl = `https://httpbin.org/bytes/1000000?t=${Date.now()}`;
      const fileSize = 1000000; // 1MB
      
      let startTime: number;
      let bytesLoaded = 0;
      
      xhr.open('GET', testUrl, true);
      xhr.responseType = 'blob';
      
      xhr.onloadstart = () => {
        startTime = performance.now();
      };
      
      xhr.onprogress = (event) => {
        if (event.lengthComputable) {
          bytesLoaded = event.loaded;
        }
      };
      
      xhr.onload = () => {
        const endTime = performance.now();
        const duration = (endTime - startTime) / 1000;
        
        if (duration < 0.01) {
          resolve(1000); // Very fast connection
          return;
        }
        
        const actualSize = xhr.response?.size || fileSize;
        const speedBps = (actualSize * 8) / duration;
        const speedMbps = speedBps / 1_000_000;
        
        resolve(Number(speedMbps.toFixed(2)));
      };
      
      xhr.onerror = () => reject(new Error('Network error'));
      xhr.ontimeout = () => reject(new Error('Request timeout'));
      
      xhr.timeout = 10000; // 10 second timeout
      xhr.send();
    });
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
    setSpeedHistory([]); // Reset history
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

  // FIXED: Calculate average speed from history for display
  const getAverageSpeed = () => {
    if (speedHistory.length === 0) return currentSpeed;
    const sum = speedHistory.reduce((a, b) => a + b, 0);
    return Number((sum / speedHistory.length).toFixed(2));
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
                    Current Speed
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
                  {/* FIXED: Show average speed from history */}
                  {speedHistory.length > 1 && (
                    <p className="text-sm text-muted-foreground">
                      Average: {getAverageSpeed()} Mbps ({speedHistory.length} tests)
                    </p>
                  )}
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
