# voice-tts-service

A microservice that turns text into speech using ElevenLabs and uploads the audio to an S3 bucket.

### Usage
POST /api/generate-tts
Content-Type: application/json

{
  "text": "Your text here"
}
