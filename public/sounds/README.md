# Custom Audio Files

Place your custom audio files in this folder for the Internet Speed Meme Notifier.

## Required Files:
- `error.mp3` - For speeds 0-1 Mbps
- `slow.mp3` - For speeds 1-2 Mbps  
- `okay.mp3` - For speeds 2-5 Mbps
- `good.mp3` - For speeds 5-20 Mbps
- `unlimited.mp3` - For speeds 20+ Mbps

## Supported Formats:
- MP3
- WAV
- OGG

## How to Add Your Audio Files:
1. Record or find your audio files
2. Name them exactly as listed above (case-sensitive)
3. Place them in this `/public/sounds/` folder
4. The app will automatically use them when measuring internet speed

## File Path Reference:
The app looks for files at these paths:
- `/sounds/error.mp3` (for very slow speeds 0-1 Mbps)
- `/sounds/slow.mp3` (for slow speeds 1-2 Mbps)
- `/sounds/okay.mp3` (for okay speeds 2-5 Mbps)
- `/sounds/good.mp3` (for good speeds 5-20 Mbps)
- `/sounds/unlimited.mp3` (for fast speeds 20+ Mbps)

## Usage:
The app will automatically play the appropriate audio file based on the measured internet speed.